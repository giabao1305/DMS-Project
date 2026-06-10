import 'dotenv/config';

import * as bcrypt from 'bcrypt';
import mongoose, { Types } from 'mongoose';

import {
  User,
  UserRole,
  UserSchema,
} from '../src/modules/users/schemas/user.schema';
import {
  Category,
  CategorySchema,
} from '../src/modules/products/schemas/category.schema';
import {
  Product,
  ProductSchema,
} from '../src/modules/products/schemas/product.schema';
import {
  Customer,
  CustomerSchema,
  CustomerStatus,
} from '../src/modules/customers/schemas/customer.schema';
import {
  InventoryTransaction,
  InventoryTransactionSchema,
  InventoryTransactionType,
} from '../src/modules/inventory/schemas/inventory-transaction.schema';
import {
  Promotion,
  PromotionSchema,
  PromotionType,
} from '../src/modules/promotions/schemas/promotion.schema';
import {
  Order,
  OrderSchema,
  OrderType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../src/modules/orders/schemas/order.schema';
import {
  Warehouse,
  WarehouseSchema,
  WarehouseType,
} from '../src/modules/warehouses/schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from '../src/modules/warehouses/schemas/warehouse-stock.schema';
import {
  Route,
  RouteSchema,
  RouteStatus,
} from '../src/modules/routes/schemas/route.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
  LeaveStatus,
} from '../src/modules/leaves/schemas/leave-request.schema';

const DEMO_PASSWORDS = {
  admin: 'Admin@123456',
  distributor: 'Distributor@123456',
  seller: 'Seller@123456',
};

const UserModel = mongoose.model<User>('User', UserSchema);
const CategoryModel = mongoose.model<Category>('Category', CategorySchema);
const ProductModel = mongoose.model<Product>('Product', ProductSchema);
const CustomerModel = mongoose.model<Customer>('Customer', CustomerSchema);
const InventoryTransactionModel = mongoose.model<InventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema,
);
const PromotionModel = mongoose.model<Promotion>('Promotion', PromotionSchema);
const OrderModel = mongoose.model<Order>('Order', OrderSchema);
const WarehouseModel = mongoose.model<Warehouse>('Warehouse', WarehouseSchema);
const WarehouseStockModel = mongoose.model<WarehouseStock>(
  'WarehouseStock',
  WarehouseStockSchema,
);
const RouteModel = mongoose.model<Route>('Route', RouteSchema);
const LeaveRequestModel = mongoose.model<LeaveRequest>(
  'LeaveRequest',
  LeaveRequestSchema,
);

const asObjectId = (value: unknown) => value as Types.ObjectId;

async function connectWithTimeout(mongoUri: string) {
  const timeoutMs = Number(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 60_000,
  );

  await Promise.race([
    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: timeoutMs,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `MongoDB connection timed out after ${timeoutMs}ms. Check MONGODB_URI and make sure MongoDB is running.`,
          ),
        );
      }, timeoutMs);
    }),
  ]);
}

async function upsertUsers() {
  const [adminPassword, distributorPassword, sellerPassword] =
    await Promise.all([
      bcrypt.hash(DEMO_PASSWORDS.admin, 10),
      bcrypt.hash(DEMO_PASSWORDS.distributor, 10),
      bcrypt.hash(DEMO_PASSWORDS.seller, 10),
    ]);

  const admin = await UserModel.findOneAndUpdate(
    { email: 'admin@dms.local' },
    {
      fullName: 'DMS Admin',
      email: 'admin@dms.local',
      password: adminPassword,
      phone: '0900000001',
      role: UserRole.ADMIN,
      companyName: 'DMS Distribution',
      address: 'Ho Chi Minh City',
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  const distributor = await UserModel.findOneAndUpdate(
    { email: 'distributor@dms.local' },
    {
      fullName: 'Demo Distributor',
      code: 'NPP-HCM-001',
      email: 'distributor@dms.local',
      password: distributorPassword,
      phone: '0900000003',
      role: UserRole.DISTRIBUTOR,
      companyName: 'DMS Distributor Demo',
      address: 'District 1, Ho Chi Minh City',
      taxCode: 'DEMO-DIST-001',
      createdBy: asObjectId(admin._id),
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  const seller = await UserModel.findOneAndUpdate(
    { email: 'seller@dms.local' },
    {
      fullName: 'Demo Seller',
      code: 'DSR-HCM-NPP001-001',
      email: 'seller@dms.local',
      password: sellerPassword,
      phone: '0900000002',
      role: UserRole.SELLER,
      companyName: 'DMS Distributor Demo',
      address: 'District 1, Ho Chi Minh City',
      taxCode: 'DEMO-TAX-001',
      manager: asObjectId(distributor._id),
      createdBy: asObjectId(admin._id),
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { admin, distributor, seller };
}

async function upsertCatalog() {
  const category = await CategoryModel.findOneAndUpdate(
    { code: 'NES-CAT-BEV' },
    {
      code: 'NES-CAT-BEV',
      name: 'Beverages',
      description: 'Demo drinks category',
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  const products = await Promise.all([
    ProductModel.findOneAndUpdate(
      { code: 'NES-BEV-COFFEE-001' },
      {
        name: 'Demo Coffee Box',
        code: 'NES-BEV-COFFEE-001',
        description: 'Seed product for DMS demo orders',
        category: asObjectId(category._id),
        price: 125000,
        unit: 'box',
        stock: 120,
        minStock: 20,
        isActive: true,
        isDeleted: false,
      },
      { returnDocument: 'after', upsert: true },
    ),
    ProductModel.findOneAndUpdate(
      { code: 'NES-BEV-TEA-001' },
      {
        name: 'Demo Tea Pack',
        code: 'NES-BEV-TEA-001',
        description: 'Seed product for DMS demo inventory',
        category: asObjectId(category._id),
        price: 85000,
        unit: 'pack',
        stock: 80,
        minStock: 15,
        isActive: true,
        isDeleted: false,
      },
      { returnDocument: 'after', upsert: true },
    ),
  ]);

  return { category, products };
}

async function upsertCustomers(
  adminId: Types.ObjectId,
  sellerId: Types.ObjectId,
) {
  const customer = await CustomerModel.findOneAndUpdate(
    { phone: '0911111111' },
    {
      name: 'Demo Retail Store',
      phone: '0911111111',
      address: '123 Demo Street, Ho Chi Minh City',
      latitude: 10.7769,
      longitude: 106.7009,
      ownerName: 'Nguyen Demo',
      customerType: 'retail',
      assignedSeller: sellerId,
      createdBy: sellerId,
      status: CustomerStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { customer };
}

async function upsertPromotion(productId: Types.ObjectId) {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const promotion = await PromotionModel.findOneAndUpdate(
    { name: 'Demo May Promotion' },
    {
      name: 'Demo May Promotion',
      description: 'Demo 5 percent discount for orders from seed data',
      type: PromotionType.PERCENT,
      discountPercent: 5,
      giftProduct: productId,
      giftQuantity: 1,
      minOrderValue: 100000,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { promotion };
}

async function upsertWarehouse(params: {
  distributorId: Types.ObjectId;
  products: Array<Product & { _id: unknown }>;
}) {
  const warehouse = await WarehouseModel.findOneAndUpdate(
    { code: 'WH-NPP-HCM-001' },
    {
      name: 'Kho Demo NPP HCM',
      code: 'WH-NPP-HCM-001',
      type: WarehouseType.DISTRIBUTOR,
      distributor: params.distributorId,
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  const stockPlans = [
    {
      product: params.products[0],
      quantity: 48,
      averageCost: 125000,
      sellingPrice: 155000,
    },
    {
      product: params.products[1],
      quantity: 36,
      averageCost: 85000,
      sellingPrice: 108000,
    },
  ];

  await Promise.all(
    stockPlans.map((plan) =>
      WarehouseStockModel.findOneAndUpdate(
        {
          warehouse: asObjectId(warehouse._id),
          product: asObjectId(plan.product._id),
        },
        {
          warehouse: asObjectId(warehouse._id),
          product: asObjectId(plan.product._id),
          quantity: plan.quantity,
          averageCost: plan.averageCost,
          sellingPrice: plan.sellingPrice,
        },
        { returnDocument: 'after', upsert: true },
      ),
    ),
  );

  return { warehouse };
}

async function upsertFinancialDemoOrders(params: {
  adminId: Types.ObjectId;
  distributorId: Types.ObjectId;
  sellerId: Types.ObjectId;
  customerId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  products: Array<Product & { _id: unknown }>;
  promotionId: Types.ObjectId;
}) {
  const now = new Date();
  const product = params.products[0];
  const supplyQuantity = 24;
  const supplySubtotal = product.price * supplyQuantity;

  const supplyOrder = await OrderModel.findOneAndUpdate(
    { orderCode: 'DEMO-SUPPLY-001' },
    {
      orderCode: 'DEMO-SUPPLY-001',
      orderType: OrderType.MANUFACTURER_TO_DISTRIBUTOR,
      distributor: params.distributorId,
      warehouse: params.warehouseId,
      items: [
        {
          product: asObjectId(product._id),
          productName: product.name,
          quantity: supplyQuantity,
          price: product.price,
          subtotal: supplySubtotal,
          costPrice: product.price,
          grossProfit: 0,
        },
      ],
      totalAmount: supplySubtotal,
      discountAmount: 0,
      finalAmount: supplySubtotal,
      totalCost: supplySubtotal,
      grossProfit: 0,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceDue: 0,
      payments: [],
      refundedAmount: 0,
      refunds: [],
      status: OrderStatus.DELIVERED,
      note: 'Demo supply order from Nestle to distributor',
      approvedBy: params.adminId,
      approvedAt: now,
      deliveredAt: now,
    },
    { returnDocument: 'after', upsert: true },
  );

  const storeQuantity = 3;
  const storePrice = 155000;
  const storeCost = 125000;
  const storeTotal = storePrice * storeQuantity;
  const storeDiscount = Math.round(storeTotal * 0.05);
  const storeFinal = storeTotal - storeDiscount;
  const storeTotalCost = storeCost * storeQuantity;
  const storeGrossProfit = storeFinal - storeTotalCost;
  const paidAmount = 250000;

  const storeOrder = await OrderModel.findOneAndUpdate(
    { orderCode: 'DEMO-STORE-PARTIAL-001' },
    {
      orderCode: 'DEMO-STORE-PARTIAL-001',
      orderType: OrderType.DISTRIBUTOR_TO_STORE,
      distributor: params.distributorId,
      warehouse: params.warehouseId,
      seller: params.sellerId,
      customer: params.customerId,
      items: [
        {
          product: asObjectId(product._id),
          productName: product.name,
          quantity: storeQuantity,
          price: storePrice,
          subtotal: storeTotal,
          costPrice: storeCost,
          grossProfit: storeTotal - storeTotalCost,
        },
      ],
      promotion: params.promotionId,
      totalAmount: storeTotal,
      discountAmount: storeDiscount,
      finalAmount: storeFinal,
      totalCost: storeTotalCost,
      grossProfit: storeGrossProfit,
      paymentStatus: PaymentStatus.PARTIAL,
      paidAmount,
      balanceDue: storeFinal - paidAmount,
      payments: [
        {
          amount: paidAmount,
          method: PaymentMethod.CASH,
          note: 'Demo partial cash collection',
          collectedBy: params.sellerId,
          collectedAt: now,
        },
      ],
      refundedAmount: 0,
      refunds: [],
      status: OrderStatus.DELIVERED,
      note: 'Demo store order with partial collection',
      approvedBy: params.adminId,
      approvedAt: now,
      deliveredAt: now,
    },
    { returnDocument: 'after', upsert: true },
  );

  const returnProduct = params.products[1];
  const returnQuantity = 2;
  const returnPrice = 108000;
  const returnCost = 85000;
  const returnTotal = returnPrice * returnQuantity;
  const returnTotalCost = returnCost * returnQuantity;

  const returnOrder = await OrderModel.findOneAndUpdate(
    { orderCode: 'DEMO-STORE-REFUND-001' },
    {
      orderCode: 'DEMO-STORE-REFUND-001',
      orderType: OrderType.DISTRIBUTOR_TO_STORE,
      distributor: params.distributorId,
      warehouse: params.warehouseId,
      seller: params.sellerId,
      customer: params.customerId,
      items: [
        {
          product: asObjectId(returnProduct._id),
          productName: returnProduct.name,
          quantity: returnQuantity,
          price: returnPrice,
          subtotal: returnTotal,
          costPrice: returnCost,
          grossProfit: returnTotal - returnTotalCost,
        },
      ],
      totalAmount: returnTotal,
      discountAmount: 0,
      finalAmount: returnTotal,
      totalCost: returnTotalCost,
      grossProfit: returnTotal - returnTotalCost,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: returnTotal,
      balanceDue: returnTotal,
      payments: [
        {
          amount: returnTotal,
          method: PaymentMethod.BANK_TRANSFER,
          note: 'Demo full collection before return',
          collectedBy: params.sellerId,
          collectedAt: now,
        },
      ],
      refundedAmount: returnTotal,
      refunds: [
        {
          amount: returnTotal,
          method: PaymentMethod.BANK_TRANSFER,
          note: 'Demo full refund before return approval',
          refundedBy: params.distributorId,
          refundedAt: now,
        },
      ],
      status: OrderStatus.RETURN_REQUESTED,
      note: 'Demo order ready for admin return approval',
      approvedBy: params.adminId,
      approvedAt: now,
      deliveredAt: now,
      returnReason: 'Demo customer returned goods after refund',
      returnRequestedBy: params.sellerId,
      returnRequestedAt: now,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { supplyOrder, storeOrder, returnOrder };
}

async function upsertRoute(params: {
  adminId: Types.ObjectId;
  sellerId: Types.ObjectId;
  customerId: Types.ObjectId;
}) {
  const workDate = new Date();
  workDate.setDate(workDate.getDate() + 1);
  workDate.setHours(8, 0, 0, 0);

  const route = await RouteModel.findOneAndUpdate(
    { name: 'Demo Route Tomorrow', seller: params.sellerId },
    {
      name: 'Demo Route Tomorrow',
      seller: params.sellerId,
      workDate,
      customers: [
        {
          customer: params.customerId,
          orderIndex: 1,
          note: 'Priority demo customer',
        },
      ],
      status: RouteStatus.PLANNED,
      createdBy: params.adminId,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { route };
}

async function upsertLeave(params: {
  adminId: Types.ObjectId;
  sellerId: Types.ObjectId;
}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const leave = await LeaveRequestModel.findOneAndUpdate(
    { seller: params.sellerId, reason: 'Demo personal leave' },
    {
      seller: params.sellerId,
      startDate,
      endDate,
      reason: 'Demo personal leave',
      status: LeaveStatus.APPROVED,
      approvedBy: params.adminId,
      approvedAt: new Date(),
      adminNote: 'Approved by demo seed',
    },
    { returnDocument: 'after', upsert: true },
  );

  return { leave };
}

async function seedInventory(
  adminId: Types.ObjectId,
  products: Array<Product & { _id: unknown }>,
) {
  await InventoryTransactionModel.deleteMany({
    note: 'Demo seed initial stock',
  });

  await InventoryTransactionModel.insertMany(
    products.map((product) => ({
      product: asObjectId(product._id),
      type: InventoryTransactionType.IMPORT,
      quantity: product.stock,
      beforeStock: 0,
      afterStock: product.stock,
      note: 'Demo seed initial stock',
      createdBy: adminId,
    })),
  );
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required to seed demo data');
  }

  console.log('Connecting to MongoDB for demo seed...');
  await connectWithTimeout(mongoUri);
  console.log('Connected to MongoDB');

  const { admin, distributor, seller } = await upsertUsers();
  const { products } = await upsertCatalog();
  const { customer } = await upsertCustomers(
    asObjectId(admin._id),
    asObjectId(seller._id),
  );
  const { promotion } = await upsertPromotion(asObjectId(products[0]._id));
  const { warehouse } = await upsertWarehouse({
    distributorId: asObjectId(distributor._id),
    products,
  });

  await upsertFinancialDemoOrders({
    adminId: asObjectId(admin._id),
    distributorId: asObjectId(distributor._id),
    sellerId: asObjectId(seller._id),
    customerId: asObjectId(customer._id),
    warehouseId: asObjectId(warehouse._id),
    products,
    promotionId: asObjectId(promotion._id),
  });

  await upsertRoute({
    adminId: asObjectId(admin._id),
    sellerId: asObjectId(seller._id),
    customerId: asObjectId(customer._id),
  });

  await upsertLeave({
    adminId: asObjectId(admin._id),
    sellerId: asObjectId(seller._id),
  });

  await seedInventory(asObjectId(admin._id), products);

  console.log('Demo data seeded successfully');
  console.log(`Admin: admin@dms.local / ${DEMO_PASSWORDS.admin}`);
  console.log(
    `Distributor: distributor@dms.local / ${DEMO_PASSWORDS.distributor}`,
  );
  console.log(`Seller: seller@dms.local / ${DEMO_PASSWORDS.seller}`);
  console.log(
    'Demo flow: /admin/warehouses, /admin/orders, /admin/financial-reports',
  );
  console.log(
    'Distributor flow: /distributor/warehouse, /distributor/orders, /distributor/financial-reports',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect().catch(() => undefined);
    }
    process.exit(process.exitCode ?? 0);
  });
