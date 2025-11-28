'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerSchema, CustomerFormData } from '@/lib/validations/customer';
import { z } from 'zod';

export async function getCustomers(search?: string, type?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    isActive?: boolean;
    customerType?: 'MIXING_STATION' | 'RESELLER' | 'PROJECT' | 'OTHER';
    OR?: Array<{
      companyName?: { contains: string; mode: 'insensitive' };
      contactPerson?: { contains: string; mode: 'insensitive' };
      phone?: { contains: string; mode: 'insensitive' };
    }>;
  } = { isActive: true };

  if (type && type !== 'all') {
    where.customerType = type as 'MIXING_STATION' | 'RESELLER' | 'PROJECT' | 'OTHER';
  }

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { companyName: 'asc' },
    include: {
      receivables: {
        where: { status: { not: 'PAID' } },
        select: { remainingAmount: true },
      },
      sales: {
        orderBy: { saleDate: 'desc' },
        take: 1,
        select: { saleDate: true },
      },
      _count: {
        select: { sales: true },
      },
    },
  });

  return customers.map((customer) => ({
    ...customer,
    totalDebt: customer.receivables.reduce(
      (sum, r) => sum + Number(r.remainingAmount),
      0
    ),
    lastSaleDate: customer.sales[0]?.saleDate || null,
    salesCount: customer._count.sales,
  }));
}

export async function getCustomer(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      receivables: {
        where: { status: { not: 'PAID' } },
        orderBy: { dueDate: 'asc' },
      },
      sales: {
        orderBy: { saleDate: 'desc' },
        take: 20,
        include: {
          cementType: { select: { code: true, name: true } },
        },
      },
      interactions: {
        orderBy: { interactionDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) return null;

  const totalDebt = customer.receivables.reduce(
    (sum, r) => sum + Number(r.remainingAmount),
    0
  );

  const totalPurchases = await db.sale.aggregate({
    where: { customerId: id },
    _sum: { totalAmount: true },
  });

  return {
    ...customer,
    totalDebt,
    totalPurchases: Number(totalPurchases._sum.totalAmount || 0),
  };
}

export async function createCustomer(data: CustomerFormData) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validated = customerSchema.parse(data);

    const customer = await db.customer.create({
      data: {
        companyName: validated.companyName,
        contactPerson: validated.contactPerson || null,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
        taxCode: validated.taxCode || null,
        customerType: validated.customerType,
        creditLimit: validated.creditLimit,
        paymentTerms: validated.paymentTerms,
        notes: validated.notes || null,
        isActive: validated.isActive,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Customer',
        entityId: customer.id,
        details: { companyName: customer.companyName },
      },
    });

    revalidatePath('/customers');
    return { success: true, data: customer };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dữ liệu không hợp lệ', details: error.errors };
    }
    console.error('Create customer error:', error);
    return { success: false, error: 'Không thể tạo khách hàng' };
  }
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validated = customerSchema.parse(data);

    const customer = await db.customer.update({
      where: { id },
      data: {
        companyName: validated.companyName,
        contactPerson: validated.contactPerson || null,
        phone: validated.phone || null,
        email: validated.email || null,
        address: validated.address || null,
        taxCode: validated.taxCode || null,
        customerType: validated.customerType,
        creditLimit: validated.creditLimit,
        paymentTerms: validated.paymentTerms,
        notes: validated.notes || null,
        isActive: validated.isActive,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: customer.id,
        details: { companyName: customer.companyName },
      },
    });

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return { success: true, data: customer };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dữ liệu không hợp lệ', details: error.errors };
    }
    console.error('Update customer error:', error);
    return { success: false, error: 'Không thể cập nhật khách hàng' };
  }
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Soft delete
    const customer = await db.customer.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'Customer',
        entityId: customer.id,
        details: { companyName: customer.companyName },
      },
    });

    revalidatePath('/customers');
    return { success: true };
  } catch (error) {
    console.error('Delete customer error:', error);
    return { success: false, error: 'Không thể xóa khách hàng' };
  }
}

export async function addInteraction(
  customerId: string,
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE',
  content: string
) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const interaction = await db.interaction.create({
      data: {
        customerId,
        type,
        content,
        interactionDate: new Date(),
      },
    });

    revalidatePath(`/customers/${customerId}`);
    return { success: true, data: interaction };
  } catch (error) {
    console.error('Add interaction error:', error);
    return { success: false, error: 'Không thể thêm ghi chú' };
  }
}
