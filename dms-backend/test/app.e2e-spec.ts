import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import type { AuditLog } from '../src/modules/audit-logs/schemas/audit-log.schema';
import { CustomerStatus } from '../src/modules/customers/schemas/customer.schema';
import type { Customer } from '../src/modules/customers/schemas/customer.schema';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../src/modules/inventory/schemas/inventory-transaction.schema';
import { LeaveStatus } from '../src/modules/leaves/schemas/leave-request.schema';
import type { LeaveRequest } from '../src/modules/leaves/schemas/leave-request.schema';
import { OrderStatus } from '../src/modules/orders/schemas/order.schema';
import type { Order } from '../src/modules/orders/schemas/order.schema';
import type { Category } from '../src/modules/products/schemas/category.schema';
import type { Product } from '../src/modules/products/schemas/product.schema';
import { UserRole } from '../src/modules/users/schemas/user.schema';
import type { User } from '../src/modules/users/schemas/user.schema';

jest.setTimeout(60_000);

describe('DMS critical workflows (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  let customerModel: Model<Customer>;
  let categoryModel: Model<Category>;
  let productModel: Model<Product>;
  let orderModel: Model<Order>;
  let leaveRequestModel: Model<LeaveRequest>;
  let inventoryTransactionModel: Model<InventoryTransaction>;
  let auditLogModel: Model<AuditLog>;

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminEmail = `e2e-admin-${runId}@dms.test`;
  const sellerEmail = `e2e-seller-${runId}@dms.test`;
  const lockoutEmail = `e2e-lockout-${runId}@dms.test`;
  const productCode = `E2E-${runId}`.slice(0, 32);
  const password = 'Password123!';

  let adminToken: string;
  let sellerToken: string;
  let sellerRefreshToken: string;
  let adminId: string;
  let sellerId: string;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS = '3000';
    process.env.MONGODB_RETRY_ATTEMPTS = '0';
    process.env.AUTH_RATE_LIMIT_MAX = '50';
    process.env.AUTH_MAX_FAILED_LOGIN_ATTEMPTS = '3';
    process.env.AUTH_LOGIN_LOCK_MINUTES = '15';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken('User'));
    customerModel = moduleFixture.get<Model<Customer>>(
      getModelToken('Customer'),
    );
    categoryModel = moduleFixture.get<Model<Category>>(
      getModelToken('Category'),
    );
    productModel = moduleFixture.get<Model<Product>>(getModelToken('Product'));
    orderModel = moduleFixture.get<Model<Order>>(getModelToken('Order'));
    leaveRequestModel = moduleFixture.get<Model<LeaveRequest>>(
      getModelToken('LeaveRequest'),
    );
    inventoryTransactionModel = moduleFixture.get<Model<InventoryTransaction>>(
      getModelToken('InventoryTransaction'),
    );
    auditLogModel = moduleFixture.get<Model<AuditLog>>(
      getModelToken('AuditLog'),
    );

    await seedUsers();
    await seedProductAndCustomer();
    await loginUsers();
  });

  afterAll(async () => {
    const cleanupTasks: Promise<unknown>[] = [];

    if (orderModel && sellerId) {
      cleanupTasks.push(orderModel.deleteMany({ seller: sellerId }).exec());
    }

    if (inventoryTransactionModel && productId) {
      cleanupTasks.push(
        inventoryTransactionModel.deleteMany({ product: productId }).exec(),
      );
    }

    if (customerModel && sellerId) {
      cleanupTasks.push(
        customerModel.deleteMany({ createdBy: sellerId }).exec(),
      );
    }

    if (leaveRequestModel && sellerId) {
      cleanupTasks.push(
        leaveRequestModel.deleteMany({ seller: sellerId }).exec(),
      );
    }

    if (productModel) {
      cleanupTasks.push(productModel.deleteMany({ code: productCode }).exec());
    }

    if (categoryModel) {
      cleanupTasks.push(
        categoryModel.deleteMany({ name: `E2E Category ${runId}` }).exec(),
      );
    }

    if (userModel) {
      cleanupTasks.push(
        userModel
          .deleteMany({
            email: { $in: [adminEmail, sellerEmail, lockoutEmail] },
          })
          .exec(),
      );
    }

    if (auditLogModel) {
      cleanupTasks.push(
        auditLogModel
          .deleteMany({
            $or: [
              { targetLabel: { $in: [adminEmail, sellerEmail, lockoutEmail] } },
              { 'metadata.e2eRunId': runId },
            ],
          })
          .exec(),
      );
    }

    await Promise.all(cleanupTasks);
    await app?.close();
  });

  it('exposes health status for operations monitoring', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { timestamp?: string; database: { status: string } };
        }) => {
          expect(body).toMatchObject({
            status: 'ok',
            service: 'dms-backend',
          });
          expect(body.timestamp).toBeTruthy();
          expect(body.database.status).toBe('connected');
        },
      );
  });

  it('authenticates users and returns the current profile from JWT', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: User & { _id: string } }) => {
        expect(body.email).toBe(adminEmail);
        expect(body.role).toBe(UserRole.ADMIN);
        expect(body.password).toBeUndefined();
      });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200)
      .expect(({ body }: { body: User & { _id: string } }) => {
        expect(body.email).toBe(sellerEmail);
        expect(body.role).toBe(UserRole.SELLER);
        expect(body.password).toBeUndefined();
      });
  });

  it('writes auth audit logs for successful logins', async () => {
    const loginLogs = await auditLogModel
      .find({
        module: 'auth',
        action: 'login_success',
        targetLabel: { $in: [adminEmail, sellerEmail] },
      })
      .lean()
      .exec();

    expect(loginLogs).toHaveLength(2);
    expect(
      loginLogs.every((log) => log.description === 'Login successfully'),
    ).toBe(true);
    expect(loginLogs.every((log) => log.metadata?.ip)).toBe(true);
  });

  it('enforces dashboard role permissions', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/dashboard/seller')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/dashboard/admin')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/dashboard/seller')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });

  it('rate limits sensitive auth endpoints', async () => {
    const previousLimit = process.env.AUTH_RATE_LIMIT_MAX;
    process.env.AUTH_RATE_LIMIT_MAX = '2';

    try {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-forwarded-for', `198.51.100.${runId.length}`)
        .send({ email: `rate-limit-${runId}@dms.test` })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-forwarded-for', `198.51.100.${runId.length}`)
        .send({ email: `rate-limit-${runId}@dms.test` })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-forwarded-for', `198.51.100.${runId.length}`)
        .send({ email: `rate-limit-${runId}@dms.test` })
        .expect(429);
    } finally {
      process.env.AUTH_RATE_LIMIT_MAX = previousLimit;
    }
  });

  it('locks an account after too many failed login attempts', async () => {
    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
      fullName: 'E2E Lockout',
      email: lockoutEmail,
      password: hashedPassword,
      role: UserRole.SELLER,
      isActive: true,
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lockoutEmail, password: 'WrongPassword1!' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lockoutEmail, password: 'WrongPassword2!' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lockoutEmail, password: 'WrongPassword3!' })
      .expect(401)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Account is temporarily locked');
      });

    const lockedUser = await userModel.findOne({ email: lockoutEmail }).lean();

    expect(lockedUser?.failedLoginAttempts).toBe(3);
    expect(lockedUser?.lockUntil?.getTime()).toBeGreaterThan(Date.now());

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lockoutEmail, password })
      .expect(401)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Account is temporarily locked');
      });

    const securityLogs = await auditLogModel
      .find({
        module: 'auth',
        targetLabel: lockoutEmail,
        action: { $in: ['login_failed', 'account_locked', 'login_blocked'] },
      })
      .lean()
      .exec();

    expect(securityLogs.some((log) => log.action === 'account_locked')).toBe(
      true,
    );
    expect(securityLogs.some((log) => log.action === 'login_blocked')).toBe(
      true,
    );

    await userModel
      .updateOne(
        { email: lockoutEmail },
        { lockUntil: new Date(Date.now() - 1000) },
      )
      .exec();

    await login(lockoutEmail);

    const unlockedUser = await userModel
      .findOne({ email: lockoutEmail })
      .lean();

    expect(unlockedUser?.failedLoginAttempts).toBe(0);
    expect(unlockedUser?.lockUntil).toBeUndefined();
    expect(unlockedUser?.lastLoginAt).toBeTruthy();
  });

  it('seller order approval subtracts stock, return approval restores stock', async () => {
    const createdOrder = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        customer: customerId,
        items: [{ product: productId, quantity: 3 }],
        note: 'E2E stock workflow',
      })
      .expect(201)
      .then((response) => response.body as Order & { _id: string });

    expect(createdOrder.status).toBe(OrderStatus.PENDING);
    expect(createdOrder.finalAmount).toBe(360000);

    const approvedOrder = await request(app.getHttpServer())
      .patch(`/orders/${createdOrder._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .then((response) => response.body as Order);

    expect(approvedOrder.status).toBe(OrderStatus.APPROVED);

    await expectProductStock(7);
    await expectInventoryTransaction({
      type: InventoryTransactionType.ORDER,
      quantity: 3,
      beforeStock: 10,
      afterStock: 7,
    });

    await request(app.getHttpServer())
      .patch(`/orders/${createdOrder._id}/deliver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: Order }) => {
        expect(body.status).toBe(OrderStatus.DELIVERED);
      });

    await request(app.getHttpServer())
      .patch(`/orders/${createdOrder._id}/return-request`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ reason: 'Customer returned unopened goods' })
      .expect(200)
      .expect(({ body }: { body: Order }) => {
        expect(body.status).toBe(OrderStatus.RETURN_REQUESTED);
      });

    await request(app.getHttpServer())
      .patch(`/orders/${createdOrder._id}/return`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: Order }) => {
        expect(body.status).toBe(OrderStatus.RETURNED);
      });

    await expectProductStock(10);
    await expectInventoryTransaction({
      type: InventoryTransactionType.RETURN,
      quantity: 3,
      beforeStock: 7,
      afterStock: 10,
    });
  });

  it('seller-created customer enters approval flow and admin can approve it', async () => {
    const createdCustomer = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: `E2E Pending Customer ${runId}`,
        phone: '0911111111',
        address: 'E2E Pending Ward',
        ownerName: 'E2E Owner',
        customerType: 'retail',
      })
      .expect(201)
      .then((response) => response.body as Customer & { _id: string });

    expect(createdCustomer.status).toBe(CustomerStatus.PENDING);
    expect(createdCustomer.createdBy.toString()).toBe(sellerId);
    expect(createdCustomer.assignedSeller.toString()).toBe(sellerId);

    const pendingCustomers = await request(app.getHttpServer())
      .get('/customers/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .then((response) => response.body as Array<Customer & { _id: string }>);

    expect(
      pendingCustomers.some((customer) => customer._id === createdCustomer._id),
    ).toBe(true);

    await request(app.getHttpServer())
      .patch(`/customers/${createdCustomer._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: Customer }) => {
        expect(body.status).toBe(CustomerStatus.APPROVED);
        expect(body.approvedBy?.toString()).toBe(adminId);
        expect(body.approvedAt).toBeTruthy();
      });
  });

  it('seller leave requests can be approved or rejected by admin', async () => {
    const approvedLeave = await createLeaveRequest({
      startDate: '2026-06-01',
      endDate: '2026-06-02',
      reason: 'Annual leave',
    });

    await request(app.getHttpServer())
      .patch(`/leaves/${approvedLeave._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: LeaveRequest }) => {
        expect(body.status).toBe(LeaveStatus.APPROVED);
        expect(body.approvedBy?.toString()).toBe(adminId);
        expect(body.adminNote).toBe('Approved');
        expect(body.approvedAt).toBeTruthy();
      });

    const rejectedLeave = await createLeaveRequest({
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      reason: 'Personal appointment',
    });

    await request(app.getHttpServer())
      .patch(`/leaves/${rejectedLeave._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNote: 'Route coverage is not available' })
      .expect(200)
      .expect(({ body }: { body: LeaveRequest }) => {
        expect(body.status).toBe(LeaveStatus.REJECTED);
        expect(body.approvedBy?.toString()).toBe(adminId);
        expect(body.adminNote).toBe('Route coverage is not available');
        expect(body.approvedAt).toBeTruthy();
      });
  });

  it('rotates refresh tokens and revokes them on logout', async () => {
    const refreshed = await refreshToken(sellerRefreshToken);

    expect(refreshed.refreshToken).not.toBe(sellerRefreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: sellerRefreshToken })
      .expect(401);

    sellerToken = refreshed.accessToken;
    sellerRefreshToken = refreshed.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(201)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Logout successfully');
      });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: sellerRefreshToken })
      .expect(401);
  });

  async function seedUsers() {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [admin, seller] = await userModel.create([
      {
        fullName: 'E2E Admin',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        fullName: 'E2E Seller',
        email: sellerEmail,
        password: hashedPassword,
        role: UserRole.SELLER,
        isActive: true,
      },
    ]);

    adminId = admin._id.toString();
    sellerId = seller._id.toString();
  }

  async function seedProductAndCustomer() {
    const category = await categoryModel.create({
      name: `E2E Category ${runId}`,
      description: 'E2E test category',
      isActive: true,
    });

    const product = await productModel.create({
      name: `E2E Product ${runId}`,
      code: productCode,
      category: category._id,
      price: 120000,
      unit: 'box',
      stock: 10,
      minStock: 2,
      isActive: true,
      isDeleted: false,
    });

    const customer = await customerModel.create({
      name: `E2E Customer ${runId}`,
      phone: '0900000000',
      address: 'E2E District',
      assignedSeller: new Types.ObjectId(sellerId),
      createdBy: new Types.ObjectId(sellerId),
      status: CustomerStatus.APPROVED,
      approvedBy: new Types.ObjectId(adminId),
      approvedAt: new Date(),
      isActive: true,
    });

    productId = product._id.toString();
    customerId = customer._id.toString();
  }

  async function loginUsers() {
    const adminLogin = await login(adminEmail);
    const sellerLogin = await login(sellerEmail);

    adminToken = adminLogin.accessToken;
    sellerToken = sellerLogin.accessToken;
    sellerRefreshToken = sellerLogin.refreshToken;
  }

  async function login(email: string) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201)
      .then(
        (response: { body: { accessToken: string; refreshToken: string } }) => {
          expect(response.body.accessToken).toBeTruthy();
          expect(response.body.refreshToken).toBeTruthy();

          return response.body;
        },
      );
  }

  async function refreshToken(token: string) {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: token })
      .expect(201)
      .then(
        (response: { body: { accessToken: string; refreshToken: string } }) => {
          expect(response.body.accessToken).toBeTruthy();
          expect(response.body.refreshToken).toBeTruthy();

          return response.body;
        },
      );
  }

  async function createLeaveRequest(payload: {
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    return request(app.getHttpServer())
      .post('/leaves')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload)
      .expect(201)
      .then((response) => response.body as LeaveRequest & { _id: string });
  }

  async function expectProductStock(expectedStock: number) {
    const product = await productModel.findById(productId).lean().exec();
    expect(product?.stock).toBe(expectedStock);
  }

  async function expectInventoryTransaction(expected: {
    type: InventoryTransactionType;
    quantity: number;
    beforeStock: number;
    afterStock: number;
  }) {
    const transaction = await inventoryTransactionModel
      .findOne({ product: new Types.ObjectId(productId), type: expected.type })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!transaction) {
      const existingTransactions = await inventoryTransactionModel
        .find({ product: new Types.ObjectId(productId) })
        .sort({ createdAt: 1 })
        .lean()
        .exec();

      throw new Error(
        `Missing inventory transaction ${expected.type}. Existing: ${JSON.stringify(
          existingTransactions.map((item) => ({
            type: item.type,
            quantity: item.quantity,
            beforeStock: item.beforeStock,
            afterStock: item.afterStock,
          })),
        )}`,
      );
    }

    expect(transaction).toMatchObject(expected);
    expect(transaction?.createdBy.toString()).toBe(adminId);
  }
});
