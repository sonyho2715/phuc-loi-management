import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for Phuc Loi Management System...');

  // ============================================
  // 1. Create Users
  // ============================================
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

  const accountant = await prisma.user.upsert({
    where: { email: 'ketoan@phucloi.vn' },
    update: {},
    create: {
      email: 'ketoan@phucloi.vn',
      password: hashedPassword,
      name: 'Kế toán',
      role: 'ACCOUNTANT',
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: 'dieudo@phucloi.vn' },
    update: {},
    create: {
      email: 'dieudo@phucloi.vn',
      password: hashedPassword,
      name: 'Điều độ',
      role: 'DISPATCHER',
    },
  });
  console.log('Created users');

  // ============================================
  // 2. Create Cement Types
  // ============================================
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

  // ============================================
  // 3. Create Factories (Nhà máy xi măng)
  // ============================================
  const factories = [
    {
      code: 'XUAN_THANH',
      name: 'Xi măng Xuân Thành',
      address: 'Xuân Thành, Hà Tĩnh',
      phone: '0238 3866 888',
      contactPerson: 'Nguyễn Văn Xuân',
      cementBrands: ['PCB40', 'PC50'],
      paymentTerms: 30,
    },
    {
      code: 'HOANG_THACH',
      name: 'Xi măng Hoàng Thạch',
      address: 'Kim Môn, Hải Dương',
      phone: '0220 3733 888',
      contactPerson: 'Trần Văn Thạch',
      cementBrands: ['PCB30', 'PCB40', 'PC40'],
      paymentTerms: 45,
    },
    {
      code: 'BUT_SON',
      name: 'Xi măng Bút Sơn',
      address: 'Thanh Liêm, Hà Nam',
      phone: '0226 3841 888',
      contactPerson: 'Lê Văn Sơn',
      cementBrands: ['PCB40', 'PC40'],
      paymentTerms: 30,
    },
    {
      code: 'NGHI_SON',
      name: 'Xi măng Nghi Sơn',
      address: 'Tĩnh Gia, Thanh Hóa',
      phone: '0237 3661 888',
      contactPerson: 'Phạm Văn Nghi',
      cementBrands: ['PCB40', 'PC50'],
      paymentTerms: 30,
    },
    {
      code: 'CHIN_FON',
      name: 'Xi măng Chinfon',
      address: 'Thủy Nguyên, Hải Phòng',
      phone: '0225 3856 888',
      contactPerson: 'Hoàng Văn Chin',
      cementBrands: ['PCB30', 'PCB40'],
      paymentTerms: 30,
    },
  ];

  const createdFactories: Record<string, { id: string }> = {};
  for (const factory of factories) {
    const created = await prisma.factory.upsert({
      where: { code: factory.code },
      update: {},
      create: factory,
    });
    createdFactories[factory.code] = created;
  }
  console.log('Created factories');

  // ============================================
  // 4. Create Drivers (Lái xe)
  // ============================================
  const drivers = [
    { code: 'LX01', name: 'Nguyễn Văn Minh', phone: '0912345001', baseSalary: 8000000 },
    { code: 'LX02', name: 'Trần Văn Hùng', phone: '0912345002', baseSalary: 8500000 },
    { code: 'LX03', name: 'Lê Văn Đức', phone: '0912345003', baseSalary: 8000000 },
    { code: 'LX04', name: 'Phạm Văn Nam', phone: '0912345004', baseSalary: 9000000 },
    { code: 'LX05', name: 'Hoàng Văn Bình', phone: '0912345005', baseSalary: 8500000 },
    { code: 'LX06', name: 'Vũ Văn Toàn', phone: '0912345006', baseSalary: 8000000 },
    { code: 'LX07', name: 'Đỗ Văn Hải', phone: '0912345007', baseSalary: 8500000 },
    { code: 'LX08', name: 'Bùi Văn Long', phone: '0912345008', baseSalary: 8000000 },
    { code: 'LX09', name: 'Ngô Văn Thành', phone: '0912345009', baseSalary: 9000000 },
    { code: 'LX10', name: 'Đinh Văn Phong', phone: '0912345010', baseSalary: 8500000 },
    { code: 'LX11', name: 'Dương Văn Quang', phone: '0912345011', baseSalary: 8000000 },
    { code: 'LX12', name: 'Phan Văn Tú', phone: '0912345012', baseSalary: 8500000 },
    { code: 'LX13', name: 'Lý Văn Kiên', phone: '0912345013', baseSalary: 8000000 },
    { code: 'LX14', name: 'Cao Văn Dũng', phone: '0912345014', baseSalary: 9000000 },
    { code: 'LX15', name: 'Trịnh Văn Hoàng', phone: '0912345015', baseSalary: 8500000 },
    { code: 'LX16', name: 'Võ Văn Sơn', phone: '0912345016', baseSalary: 8000000 },
    { code: 'LX17', name: 'Hồ Văn Tuấn', phone: '0912345017', baseSalary: 8500000 },
    { code: 'LX18', name: 'Đặng Văn Vinh', phone: '0912345018', baseSalary: 8000000 },
    { code: 'LX19', name: 'Tạ Văn Cường', phone: '0912345019', baseSalary: 9000000 },
    { code: 'LX20', name: 'Mai Văn Khoa', phone: '0912345020', baseSalary: 8500000 },
  ];

  const createdDrivers: { id: string; code: string }[] = [];
  for (const driver of drivers) {
    const created = await prisma.driver.upsert({
      where: { code: driver.code },
      update: {},
      create: {
        ...driver,
        bankName: 'Vietcombank',
        bankAccount: `100${driver.code.replace('LX', '')}8899`,
        status: 'ACTIVE',
      },
    });
    createdDrivers.push(created);
  }
  console.log('Created 20 drivers');

  // ============================================
  // 5. Create Vehicles (20 xe bồn)
  // ============================================
  const vehicles = [
    { plateNumber: '15H-12345', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12346', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12347', capacity: 28, brand: 'Dongfeng', model: 'DFL' },
    { plateNumber: '15H-12348', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12349', capacity: 32, brand: 'JAC', model: 'HFC' },
    { plateNumber: '15H-12350', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12351', capacity: 28, brand: 'Dongfeng', model: 'DFL' },
    { plateNumber: '15H-12352', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12353', capacity: 32, brand: 'JAC', model: 'HFC' },
    { plateNumber: '15H-12354', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12355', capacity: 28, brand: 'Dongfeng', model: 'DFL' },
    { plateNumber: '15H-12356', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12357', capacity: 32, brand: 'JAC', model: 'HFC' },
    { plateNumber: '15H-12358', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12359', capacity: 28, brand: 'Dongfeng', model: 'DFL' },
    { plateNumber: '15H-12360', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12361', capacity: 32, brand: 'JAC', model: 'HFC' },
    { plateNumber: '15H-12362', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
    { plateNumber: '15H-12363', capacity: 28, brand: 'Dongfeng', model: 'DFL' },
    { plateNumber: '15H-12364', capacity: 30, brand: 'Howo', model: 'Sinotruk' },
  ];

  const createdVehicles: { id: string; plateNumber: string }[] = [];
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const driver = createdDrivers[i];
    const created = await prisma.vehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {},
      create: {
        plateNumber: vehicle.plateNumber,
        vehicleType: 'CEMENT_TRUCK',
        capacity: vehicle.capacity,
        brand: vehicle.brand,
        model: vehicle.model,
        yearMade: 2020 + Math.floor(Math.random() * 4),
        ownerType: 'COMPANY',
        status: 'ACTIVE',
        driverId: driver.id,
      },
    });
    createdVehicles.push(created);
  }
  console.log('Created 20 vehicles');

  // ============================================
  // 6. Create Customers (Trạm trộn bê tông)
  // ============================================
  const customers = [
    { code: 'HP01', companyName: 'Trạm trộn Đình Vũ', shortName: 'Đình Vũ', province: 'Hải Phòng', creditLimit: 5000000000 },
    { code: 'HP02', companyName: 'Trạm trộn Kiến An', shortName: 'Kiến An', province: 'Hải Phòng', creditLimit: 3000000000 },
    { code: 'HP03', companyName: 'Trạm trộn An Dương', shortName: 'An Dương', province: 'Hải Phòng', creditLimit: 4000000000 },
    { code: 'HP04', companyName: 'Trạm trộn Thủy Nguyên', shortName: 'Thủy Nguyên', province: 'Hải Phòng', creditLimit: 3500000000 },
    { code: 'HD01', companyName: 'Trạm trộn Nam Sách', shortName: 'Nam Sách', province: 'Hải Dương', creditLimit: 4000000000 },
    { code: 'HD02', companyName: 'Trạm trộn Chí Linh', shortName: 'Chí Linh', province: 'Hải Dương', creditLimit: 3000000000 },
    { code: 'QN01', companyName: 'Trạm trộn Quảng Yên', shortName: 'Quảng Yên', province: 'Quảng Ninh', creditLimit: 6000000000 },
    { code: 'QN02', companyName: 'Trạm trộn Hạ Long', shortName: 'Hạ Long', province: 'Quảng Ninh', creditLimit: 5000000000 },
    { code: 'TB01', companyName: 'Trạm trộn Thái Bình', shortName: 'Thái Bình', province: 'Thái Bình', creditLimit: 2500000000 },
    { code: 'HN01', companyName: 'Trạm trộn Đông Anh', shortName: 'Đông Anh', province: 'Hà Nội', creditLimit: 8000000000 },
    { code: 'HN02', companyName: 'Trạm trộn Gia Lâm', shortName: 'Gia Lâm', province: 'Hà Nội', creditLimit: 6000000000 },
    { code: 'ND01', companyName: 'Trạm trộn Nam Định', shortName: 'Nam Định', province: 'Nam Định', creditLimit: 3000000000 },
    { code: 'BN01', companyName: 'Trạm trộn Bắc Ninh', shortName: 'Bắc Ninh', province: 'Bắc Ninh', creditLimit: 5000000000 },
    { code: 'HY01', companyName: 'Trạm trộn Hưng Yên', shortName: 'Hưng Yên', province: 'Hưng Yên', creditLimit: 2500000000 },
    { code: 'VP01', companyName: 'Trạm trộn Vĩnh Phúc', shortName: 'Vĩnh Phúc', province: 'Vĩnh Phúc', creditLimit: 4000000000 },
  ];

  const createdCustomers: { id: string; code: string | null }[] = [];
  for (const customer of customers) {
    const created = await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: {
        code: customer.code,
        companyName: customer.companyName,
        shortName: customer.shortName,
        province: customer.province,
        customerType: 'MIXING_STATION',
        creditLimit: customer.creditLimit,
        paymentTerms: 30,
        address: `${customer.shortName}, ${customer.province}`,
        phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      },
    });
    createdCustomers.push(created);
  }
  console.log('Created 15 customers');

  // ============================================
  // 7. Create Fuel Stations (Cây dầu)
  // ============================================
  const fuelStations = [
    { code: 'PETRO_HP', name: 'Petrolimex Hải Phòng', address: 'Lạch Tray, Hải Phòng' },
    { code: 'PETRO_HD', name: 'Petrolimex Hải Dương', address: 'TP Hải Dương' },
    { code: 'PVOIL_HP', name: 'PV Oil Kiến An', address: 'Kiến An, Hải Phòng' },
    { code: 'TOTAL_HP', name: 'Total An Dương', address: 'An Dương, Hải Phòng' },
  ];

  const createdStations: { id: string }[] = [];
  for (const station of fuelStations) {
    const created = await prisma.fuelStation.upsert({
      where: { code: station.code },
      update: {},
      create: station,
    });
    createdStations.push(created);
  }
  console.log('Created fuel stations');

  // ============================================
  // 8. Create Routes (Tuyến đường với định mức)
  // ============================================
  const routes = [
    // Xuân Thành routes
    { code: 'XT_HP01', name: 'Xuân Thành - Đình Vũ', factoryCode: 'XUAN_THANH', customerCode: 'HP01', distance: 280, fuelAllowance: 100, driverPay: 1200000, mealAllowance: 150000, tollFee: 350000 },
    { code: 'XT_HP02', name: 'Xuân Thành - Kiến An', factoryCode: 'XUAN_THANH', customerCode: 'HP02', distance: 275, fuelAllowance: 98, driverPay: 1150000, mealAllowance: 150000, tollFee: 350000 },
    { code: 'XT_QN01', name: 'Xuân Thành - Quảng Yên', factoryCode: 'XUAN_THANH', customerCode: 'QN01', distance: 320, fuelAllowance: 115, driverPay: 1400000, mealAllowance: 200000, tollFee: 400000 },

    // Hoàng Thạch routes
    { code: 'HT_HP01', name: 'Hoàng Thạch - Đình Vũ', factoryCode: 'HOANG_THACH', customerCode: 'HP01', distance: 85, fuelAllowance: 32, driverPay: 500000, mealAllowance: 50000, tollFee: 100000 },
    { code: 'HT_HD01', name: 'Hoàng Thạch - Nam Sách', factoryCode: 'HOANG_THACH', customerCode: 'HD01', distance: 25, fuelAllowance: 12, driverPay: 250000, mealAllowance: 0, tollFee: 0 },
    { code: 'HT_HN01', name: 'Hoàng Thạch - Đông Anh', factoryCode: 'HOANG_THACH', customerCode: 'HN01', distance: 120, fuelAllowance: 45, driverPay: 700000, mealAllowance: 100000, tollFee: 150000 },

    // Bút Sơn routes
    { code: 'BS_HN01', name: 'Bút Sơn - Đông Anh', factoryCode: 'BUT_SON', customerCode: 'HN01', distance: 80, fuelAllowance: 30, driverPay: 450000, mealAllowance: 50000, tollFee: 100000 },
    { code: 'BS_ND01', name: 'Bút Sơn - Nam Định', factoryCode: 'BUT_SON', customerCode: 'ND01', distance: 60, fuelAllowance: 25, driverPay: 350000, mealAllowance: 50000, tollFee: 50000 },
    { code: 'BS_HP01', name: 'Bút Sơn - Đình Vũ', factoryCode: 'BUT_SON', customerCode: 'HP01', distance: 130, fuelAllowance: 48, driverPay: 750000, mealAllowance: 100000, tollFee: 200000 },

    // Nghi Sơn routes
    { code: 'NS_HP01', name: 'Nghi Sơn - Đình Vũ', factoryCode: 'NGHI_SON', customerCode: 'HP01', distance: 200, fuelAllowance: 72, driverPay: 950000, mealAllowance: 150000, tollFee: 250000 },
    { code: 'NS_TB01', name: 'Nghi Sơn - Thái Bình', factoryCode: 'NGHI_SON', customerCode: 'TB01', distance: 150, fuelAllowance: 55, driverPay: 700000, mealAllowance: 100000, tollFee: 150000 },

    // Chinfon routes
    { code: 'CF_HP01', name: 'Chinfon - Đình Vũ', factoryCode: 'CHIN_FON', customerCode: 'HP01', distance: 20, fuelAllowance: 10, driverPay: 200000, mealAllowance: 0, tollFee: 0 },
    { code: 'CF_HP03', name: 'Chinfon - An Dương', factoryCode: 'CHIN_FON', customerCode: 'HP03', distance: 15, fuelAllowance: 8, driverPay: 150000, mealAllowance: 0, tollFee: 0 },
    { code: 'CF_QN01', name: 'Chinfon - Quảng Yên', factoryCode: 'CHIN_FON', customerCode: 'QN01', distance: 45, fuelAllowance: 18, driverPay: 350000, mealAllowance: 50000, tollFee: 50000 },
  ];

  const createdRoutes: { id: string; code: string }[] = [];
  for (const route of routes) {
    const factory = createdFactories[route.factoryCode];
    const customer = createdCustomers.find(c => c.code === route.customerCode);

    const created = await prisma.route.upsert({
      where: { code: route.code },
      update: {},
      create: {
        code: route.code,
        name: route.name,
        fromType: 'FACTORY',
        factoryId: factory.id,
        toType: 'CUSTOMER',
        customerId: customer?.id,
        distance: route.distance,
        fuelAllowance: route.fuelAllowance,
        driverPay: route.driverPay,
        mealAllowance: route.mealAllowance,
        tollFee: route.tollFee,
        estimatedTime: Math.round(route.distance * 1.5), // minutes
      },
    });
    createdRoutes.push(created);
  }
  console.log('Created 14 routes');

  // ============================================
  // 9. Create Business Goal (Mục tiêu 500 tỷ)
  // ============================================
  await prisma.businessGoal.upsert({
    where: { year: 2024 },
    update: {},
    create: {
      year: 2024,
      revenueTarget: 500000000000, // 500 tỷ
      revenueActual: 180000000000, // 180 tỷ đã đạt
      volumeTarget: 350000, // 350,000 tấn
      volumeActual: 125000, // 125,000 tấn
      newCustomerTarget: 20,
      newCustomerActual: 8,
      tripTarget: 12000,
      tripActual: 4200,
    },
  });

  await prisma.businessGoal.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      revenueTarget: 700000000000, // 700 tỷ
      revenueActual: 0,
      volumeTarget: 500000, // 500,000 tấn
      volumeActual: 0,
      newCustomerTarget: 30,
      newCustomerActual: 0,
      tripTarget: 18000,
      tripActual: 0,
    },
  });
  console.log('Created business goals');

  // ============================================
  // 10. Get all data for transactions
  // ============================================
  const allCementTypes = await prisma.cementType.findMany();
  const allFactories = await prisma.factory.findMany();
  const allCustomers = await prisma.customer.findMany();
  const allVehicles = await prisma.vehicle.findMany({ include: { driver: true } });
  const allRoutes = await prisma.route.findMany();
  const allStations = await prisma.fuelStation.findMany();

  // ============================================
  // 11. Create Sample Purchases (Nhập hàng) - Last 3 months
  // ============================================
  console.log('Creating purchases...');
  for (let i = 0; i < 100; i++) {
    const factory = allFactories[Math.floor(Math.random() * allFactories.length)];
    const cementType = allCementTypes[Math.floor(Math.random() * allCementTypes.length)];
    const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    const quantity = Math.floor(Math.random() * 5 + 28); // 28-32 tons
    const unitPrice = Math.floor(Math.random() * 50000) + 1250000; // 1.25M - 1.3M per ton
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 90));

    await prisma.purchase.create({
      data: {
        purchaseCode: `PN-${purchaseDate.getFullYear()}${(purchaseDate.getMonth() + 1).toString().padStart(2, '0')}${purchaseDate.getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
        purchaseDate,
        factoryId: factory.id,
        cementTypeId: cementType.id,
        vehicleId: vehicle.id,
        quantity,
        unitPrice,
        totalAmount: quantity * unitPrice,
        hasInvoice: Math.random() > 0.3,
        paymentStatus: Math.random() > 0.4 ? 'PAID' : 'UNPAID',
      },
    });
  }
  console.log('Created 100 purchases');

  // ============================================
  // 12. Create Sample Sales (Xuất hàng) - Last 3 months
  // ============================================
  console.log('Creating sales...');
  for (let i = 0; i < 150; i++) {
    const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
    const cementType = allCementTypes[Math.floor(Math.random() * allCementTypes.length)];
    const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    const quantity = Math.floor(Math.random() * 5 + 28); // 28-32 tons
    const unitPrice = Math.floor(Math.random() * 50000) + 1380000; // 1.38M - 1.43M per ton (markup)
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));

    const paymentStatus = Math.random() > 0.5 ? 'PAID' : Math.random() > 0.5 ? 'PARTIAL' : 'UNPAID';

    await prisma.sale.create({
      data: {
        saleCode: `PX-${saleDate.getFullYear()}${(saleDate.getMonth() + 1).toString().padStart(2, '0')}${saleDate.getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
        saleDate,
        customerId: customer.id,
        cementTypeId: cementType.id,
        vehicleId: vehicle.id,
        quantity,
        unitPrice,
        totalAmount: quantity * unitPrice,
        deliveryAddress: customer.address,
        hasInvoice: Math.random() > 0.2,
        paymentStatus,
      },
    });
  }
  console.log('Created 150 sales');

  // ============================================
  // 13. Create Sample Trips (Chuyến hàng) - Last month
  // ============================================
  console.log('Creating trips...');
  for (let i = 0; i < 200; i++) {
    const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    const route = allRoutes[Math.floor(Math.random() * allRoutes.length)];
    const cementType = allCementTypes[Math.floor(Math.random() * allCementTypes.length)];
    const tripDate = new Date();
    tripDate.setDate(tripDate.getDate() - Math.floor(Math.random() * 30));

    const quantity = Number(vehicle.capacity) - Math.floor(Math.random() * 3);
    const fuelVariance = (Math.random() - 0.5) * 10; // +/- 5 liters
    const actualFuel = Number(route.fuelAllowance) + fuelVariance;

    await prisma.trip.create({
      data: {
        tripCode: `TR-${tripDate.getFullYear()}${(tripDate.getMonth() + 1).toString().padStart(2, '0')}${tripDate.getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
        tripDate,
        vehicleId: vehicle.id,
        driverId: vehicle.driverId!,
        routeId: route.id,
        cementTypeId: cementType.id,
        quantity,
        actualFuel,
        actualDriverPay: route.driverPay,
        actualMeal: route.mealAllowance,
        actualToll: route.tollFee,
        status: 'DELIVERED',
        departureTime: new Date(tripDate.getTime() + 6 * 3600000), // 6 AM
        arrivalTime: new Date(tripDate.getTime() + 6 * 3600000 + (Number(route.estimatedTime) || 120) * 60000),
        receiverSign: true,
      },
    });
  }
  console.log('Created 200 trips');

  // ============================================
  // 14. Create Sample Fuel Transactions
  // ============================================
  console.log('Creating fuel transactions...');
  for (let i = 0; i < 100; i++) {
    const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    const station = allStations[Math.floor(Math.random() * allStations.length)];
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 30));

    const liters = Math.floor(Math.random() * 50) + 80; // 80-130 liters
    const pricePerLiter = 24500; // Current diesel price

    await prisma.fuelTransaction.create({
      data: {
        transactionDate,
        vehicleId: vehicle.id,
        fuelStationId: station.id,
        liters,
        pricePerLiter,
        totalAmount: liters * pricePerLiter,
        isWithinLimit: liters <= 100,
        overLimit: liters > 100 ? liters - 100 : null,
        paymentMethod: 'COMPANY_ACCOUNT',
      },
    });
  }
  console.log('Created 100 fuel transactions');

  // ============================================
  // 15. Create Receivables from unpaid sales
  // ============================================
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

  // ============================================
  // 16. Create Payables from unpaid purchases
  // ============================================
  const unpaidPurchases = await prisma.purchase.findMany({
    where: { paymentStatus: 'UNPAID' },
    include: { factory: true },
  });

  for (const purchase of unpaidPurchases) {
    const dueDate = new Date(purchase.purchaseDate);
    dueDate.setDate(dueDate.getDate() + purchase.factory.paymentTerms);

    const isOverdue = dueDate < new Date();

    await prisma.payable.create({
      data: {
        factoryId: purchase.factoryId,
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

  // ============================================
  // 17. Create Sample Alerts
  // ============================================
  const alerts = [
    {
      alertType: 'FUEL_OVERAGE' as const,
      severity: 'MEDIUM' as const,
      title: 'Vượt định mức dầu',
      message: `Xe ${allVehicles[0].plateNumber} vượt định mức 8 lít trong chuyến hàng hôm nay`,
      entityType: 'Vehicle',
      entityId: allVehicles[0].id,
    },
    {
      alertType: 'PAYMENT_OVERDUE' as const,
      severity: 'HIGH' as const,
      title: 'Công nợ quá hạn',
      message: `Khách hàng ${allCustomers[0].companyName} có công nợ quá hạn 15 ngày`,
      entityType: 'Customer',
      entityId: allCustomers[0].id,
    },
    {
      alertType: 'GOAL_WARNING' as const,
      severity: 'LOW' as const,
      title: 'Cảnh báo mục tiêu',
      message: 'Doanh thu tháng này đạt 75% kế hoạch, cần đẩy mạnh bán hàng',
    },
  ];

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert });
  }
  console.log('Created sample alerts');

  console.log('\n========================================');
  console.log('Seeding completed successfully!');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log('Email: admin@phucloi.vn');
  console.log('Password: admin123');
  console.log('\nData created:');
  console.log('- 3 Users (admin, accountant, dispatcher)');
  console.log('- 4 Cement types');
  console.log('- 5 Factories');
  console.log('- 20 Drivers');
  console.log('- 20 Vehicles');
  console.log('- 15 Customers');
  console.log('- 4 Fuel stations');
  console.log('- 14 Routes with fixed costs');
  console.log('- 2 Business goals (2024, 2025)');
  console.log('- 100 Purchases');
  console.log('- 150 Sales');
  console.log('- 200 Trips');
  console.log('- 100 Fuel transactions');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
