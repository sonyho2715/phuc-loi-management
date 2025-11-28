import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phucloi.vn' },
    update: {},
    create: {
      email: 'admin@phucloi.vn',
      password: hashedPassword,
      name: 'Quản trị viên',
      role: 'OWNER',
    },
  });
  console.log('Created admin user:', adminUser.email);

  // Create cement types
  const cementTypes = [
    { code: 'PCB30', name: 'Xi măng PCB30', description: 'Xi măng Portland hỗn hợp PCB30' },
    { code: 'PCB40', name: 'Xi măng PCB40', description: 'Xi măng Portland hỗn hợp PCB40' },
    { code: 'PC40', name: 'Xi măng PC40', description: 'Xi măng Portland PC40' },
    { code: 'PC50', name: 'Xi măng PC50', description: 'Xi măng Portland PC50' },
  ];

  for (const type of cementTypes) {
    await prisma.cementType.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }
  console.log('Created cement types');

  // Create sample suppliers
  const suppliers = [
    {
      companyName: 'Xi măng Nghi Sơn',
      contactPerson: 'Lê Văn Cường',
      phone: '0912345678',
      email: 'contact@nghison.vn',
      address: 'Thanh Hóa',
      cementBrands: ['PCB40', 'PCB50', 'PC50'],
    },
    {
      companyName: 'Xi măng Hoàng Thạch',
      contactPerson: 'Phạm Thị Dung',
      phone: '0987654321',
      email: 'sales@hoangthach.vn',
      address: 'Hải Dương',
      cementBrands: ['PCB30', 'PCB40'],
    },
    {
      companyName: 'Xi măng Bút Sơn',
      contactPerson: 'Nguyễn Văn Hùng',
      phone: '0909123456',
      address: 'Hà Nam',
      cementBrands: ['PC40', 'PCB40'],
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.create({
      data: supplier,
    });
  }
  console.log('Created suppliers');

  // Create sample customers
  const customers = [
    {
      companyName: 'Trạm trộn bê tông Đình Vũ',
      contactPerson: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'dinhvu@betong.vn',
      address: 'Khu công nghiệp Đình Vũ, Hải Phòng',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 500000000,
      paymentTerms: 30,
    },
    {
      companyName: 'Công ty TNHH Bê tông Hải Dương',
      contactPerson: 'Trần Thị Bình',
      phone: '0987654321',
      email: 'haiduong@betong.vn',
      address: 'Khu công nghiệp Nam Sách, Hải Dương',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 800000000,
      paymentTerms: 45,
    },
    {
      companyName: 'Trạm trộn Quang Minh',
      contactPerson: 'Lê Văn Cường',
      phone: '0909876543',
      address: 'Quang Minh, Mê Linh, Hà Nội',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 300000000,
      paymentTerms: 30,
    },
    {
      companyName: 'Đại lý Xi măng Hùng Vương',
      contactPerson: 'Phạm Văn Đức',
      phone: '0918765432',
      address: 'Thái Bình',
      customerType: 'RESELLER' as const,
      creditLimit: 200000000,
      paymentTerms: 15,
    },
    {
      companyName: 'Dự án Cầu Bạch Đằng',
      contactPerson: 'Hoàng Thị Mai',
      phone: '0908765123',
      address: 'Quảng Ninh',
      customerType: 'PROJECT' as const,
      creditLimit: 1000000000,
      paymentTerms: 60,
    },
    {
      companyName: 'Trạm trộn Kiến An',
      contactPerson: 'Vũ Văn Hải',
      phone: '0923456789',
      address: 'Kiến An, Hải Phòng',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 400000000,
      paymentTerms: 30,
    },
    {
      companyName: 'Bê tông Thăng Long',
      contactPerson: 'Đỗ Văn Thành',
      phone: '0934567890',
      address: 'Đông Anh, Hà Nội',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 600000000,
      paymentTerms: 45,
    },
    {
      companyName: 'Trạm trộn Nam Định',
      contactPerson: 'Bùi Văn Long',
      phone: '0945678901',
      address: 'Nam Định',
      customerType: 'MIXING_STATION' as const,
      creditLimit: 350000000,
      paymentTerms: 30,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer,
    });
  }
  console.log('Created customers');

  // Get created data for transactions
  const allCementTypes = await prisma.cementType.findMany();
  const allSuppliers = await prisma.supplier.findMany();
  const allCustomers = await prisma.customer.findMany();

  // Create sample purchases (last 6 months)
  const purchases = [];
  for (let i = 0; i < 50; i++) {
    const supplier = allSuppliers[Math.floor(Math.random() * allSuppliers.length)];
    const cementType = allCementTypes[Math.floor(Math.random() * allCementTypes.length)];
    const quantity = Math.floor(Math.random() * 500) + 100; // 100-600 tons
    const unitPrice = Math.floor(Math.random() * 200000) + 1200000; // 1.2M - 1.4M per ton
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 180));

    purchases.push({
      purchaseDate,
      supplierId: supplier.id,
      cementTypeId: cementType.id,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      hasInvoice: Math.random() > 0.3,
      paymentStatus: Math.random() > 0.4 ? 'PAID' as const : 'UNPAID' as const,
      truckNumber: `29C-${Math.floor(Math.random() * 90000) + 10000}`,
    });
  }

  for (const purchase of purchases) {
    await prisma.purchase.create({ data: purchase });
  }
  console.log('Created purchases');

  // Create sample sales (last 6 months)
  const sales = [];
  for (let i = 0; i < 80; i++) {
    const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
    const cementType = allCementTypes[Math.floor(Math.random() * allCementTypes.length)];
    const quantity = Math.floor(Math.random() * 300) + 50; // 50-350 tons
    const unitPrice = Math.floor(Math.random() * 200000) + 1350000; // 1.35M - 1.55M per ton
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 180));

    const paymentStatus = Math.random() > 0.5 ? 'PAID' as const : Math.random() > 0.5 ? 'PARTIAL' as const : 'UNPAID' as const;

    sales.push({
      saleDate,
      customerId: customer.id,
      cementTypeId: cementType.id,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      hasInvoice: Math.random() > 0.2,
      paymentStatus,
      deliveryAddress: customer.address,
      truckNumber: `30H-${Math.floor(Math.random() * 90000) + 10000}`,
    });
  }

  for (const sale of sales) {
    await prisma.sale.create({ data: sale });
  }
  console.log('Created sales');

  // Create receivables from unpaid/partial sales
  const unpaidSales = await prisma.sale.findMany({
    where: { paymentStatus: { not: 'PAID' } },
    include: { customer: true },
  });

  for (const sale of unpaidSales) {
    const dueDate = new Date(sale.saleDate);
    dueDate.setDate(dueDate.getDate() + sale.customer.paymentTerms);

    const paidAmount = sale.paymentStatus === 'PARTIAL'
      ? Number(sale.totalAmount) * (Math.random() * 0.5 + 0.2)
      : 0;

    const remainingAmount = Number(sale.totalAmount) - paidAmount;
    const isOverdue = dueDate < new Date();

    await prisma.receivable.create({
      data: {
        customerId: sale.customerId,
        transactionDate: sale.saleDate,
        dueDate,
        originalAmount: sale.totalAmount,
        paidAmount,
        remainingAmount,
        status: isOverdue ? 'OVERDUE' : 'CURRENT',
      },
    });
  }
  console.log('Created receivables');

  // Create payables from unpaid purchases
  const unpaidPurchases = await prisma.purchase.findMany({
    where: { paymentStatus: 'UNPAID' },
    include: { supplier: true },
  });

  for (const purchase of unpaidPurchases) {
    const dueDate = new Date(purchase.purchaseDate);
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

    const isOverdue = dueDate < new Date();

    await prisma.payable.create({
      data: {
        supplierId: purchase.supplierId,
        transactionDate: purchase.purchaseDate,
        dueDate,
        originalAmount: purchase.totalAmount,
        paidAmount: 0,
        remainingAmount: purchase.totalAmount,
        status: isOverdue ? 'OVERDUE' : 'CURRENT',
      },
    });
  }
  console.log('Created payables');

  console.log('Seeding completed!');
  console.log('\nLogin credentials:');
  console.log('Email: admin@phucloi.vn');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
