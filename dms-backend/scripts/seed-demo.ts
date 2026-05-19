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
  OrderStatus,
} from '../src/modules/orders/schemas/order.schema';
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
  const [adminPassword, sellerPassword] = await Promise.all([
    bcrypt.hash(DEMO_PASSWORDS.admin, 10),
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

  const seller = await UserModel.findOneAndUpdate(
    { email: 'seller@dms.local' },
    {
      fullName: 'Demo Seller',
      email: 'seller@dms.local',
      password: sellerPassword,
      phone: '0900000002',
      role: UserRole.SELLER,
      companyName: 'DMS Distributor Demo',
      address: 'District 1, Ho Chi Minh City',
      taxCode: 'DEMO-TAX-001',
      createdBy: asObjectId(admin._id),
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  return { admin, seller };
}

async function upsertCatalog() {
  const category = await CategoryModel.findOneAndUpdate(
    { name: 'Beverages' },
    {
      name: 'Beverages',
      description: 'Demo drinks category',
      isActive: true,
    },
    { returnDocument: 'after', upsert: true },
  );

  const products = await Promise.all([
    ProductModel.findOneAndUpdate(
      { code: 'DMS-COFFEE-001' },
      {
        name: 'Demo Coffee Box',
        code: 'DMS-COFFEE-001',
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
      { code: 'DMS-TEA-001' },
      {
        name: 'Demo Tea Pack',
        code: 'DMS-TEA-001',
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

async function upsertOrder(params: {
  adminId: Types.ObjectId;
  sellerId: Types.ObjectId;
  customerId: Types.ObjectId;
  productId: Types.ObjectId;
  productName: string;
  price: number;
  promotionId: Types.ObjectId;
}) {
  const quantity = 3;
  const totalAmount = params.price * quantity;
  const discountAmount = Math.round(totalAmount * 0.05);
  const finalAmount = totalAmount - discountAmount;

  const order = await OrderModel.findOneAndUpdate(
    { orderCode: 'DEMO-ORDER-001' },
    {
      orderCode: 'DEMO-ORDER-001',
      seller: params.sellerId,
      customer: params.customerId,
      items: [
        {
          product: params.productId,
          productName: params.productName,
          quantity,
          price: params.price,
          subtotal: totalAmount,
        },
      ],
      promotion: params.promotionId,
      totalAmount,
      discountAmount,
      finalAmount,
      status: OrderStatus.APPROVED,
      note: 'Demo seed order',
      approvedBy: params.adminId,
      approvedAt: new Date(),
    },
    { returnDocument: 'after', upsert: true },
  );

  return { order };
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

  const { admin, seller } = await upsertUsers();
  const { products } = await upsertCatalog();
  const { customer } = await upsertCustomers(
    asObjectId(admin._id),
    asObjectId(seller._id),
  );
  const { promotion } = await upsertPromotion(asObjectId(products[0]._id));

  await upsertOrder({
    adminId: asObjectId(admin._id),
    sellerId: asObjectId(seller._id),
    customerId: asObjectId(customer._id),
    productId: asObjectId(products[0]._id),
    productName: products[0].name,
    price: products[0].price,
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
  console.log(`Seller: seller@dms.local / ${DEMO_PASSWORDS.seller}`);
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
