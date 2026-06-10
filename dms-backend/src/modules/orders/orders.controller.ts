import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { RequestReturnDto } from './dto/request-return.dto';
import { RecordOrderPaymentDto } from './dto/record-order-payment.dto';
import { RecordOrderRefundDto } from './dto/record-order-refund.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateSupplyPricingDto } from './dto/update-supply-pricing.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.create(
      createOrderDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.update(
      id,
      updateOrderDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/supply-pricing')
  updateSupplyPricing(
    @Param('id') id: string,
    @Body() updateSupplyPricingDto: UpdateSupplyPricingDto,
  ) {
    return this.ordersService.updateSupplyPricing(id, updateSupplyPricingDto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Roles(UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get('my-orders')
  findMyOrders(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findMyOrders(
      user._id.toString(),
      user.role,
      query,
    );
  }

  @Public()
  @Get('vnpay/return')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async vnpayReturn(@Query() query: Record<string, string | string[]>) {
    const result = await this.ordersService.handleVnpayCallback(query);

    return renderVnpayReturnPage(result);
  }

  @Public()
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, string | string[]>) {
    const result = await this.ordersService.handleVnpayCallback(query);

    return {
      RspCode: result.code,
      Message: result.message,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.findById(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Post(':id/vnpay/payment-url')
  createVnpayPaymentUrl(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Req() request: { ip?: string; headers?: Record<string, string> },
  ) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() || request.ip || '127.0.0.1';

    return this.ordersService.createVnpayPaymentUrl(
      id,
      user._id.toString(),
      user.role,
      ipAddress,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.approve(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Patch(':id/deliver')
  deliver(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.deliver(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.SELLER)
  @Patch(':id/return-request')
  requestReturn(
    @Param('id') id: string,
    @Body() requestReturnDto: RequestReturnDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.requestReturn(
      id,
      requestReturnDto,
      user._id.toString(),
    );
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/return')
  returnOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.returnOrder(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.ordersService.cancel(id, user._id.toString(), user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() recordOrderPaymentDto: RecordOrderPaymentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.recordPayment(
      id,
      recordOrderPaymentDto,
      user._id.toString(),
      user.role,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  @Post(':id/refunds')
  recordRefund(
    @Param('id') id: string,
    @Body() recordOrderRefundDto: RecordOrderRefundDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.recordRefund(
      id,
      recordOrderRefundDto,
      user._id.toString(),
      user.role,
    );
  }
}

function renderVnpayReturnPage(
  result: Awaited<ReturnType<OrdersService['handleVnpayCallback']>>,
) {
  const title = result.success
    ? 'Thanh toán thành công'
    : 'Thanh toán thất bại';
  const subtitle = result.success
    ? 'Đơn hàng đã được ghi nhận thanh toán. Bạn có thể quay lại app để xem trạng thái mới.'
    : result.message || 'Giao dịch chưa được ghi nhận.';
  const tone = result.success
    ? { main: '#059669', soft: '#ECFDF5', border: '#A7F3D0', icon: '✓' }
    : { main: '#DC2626', soft: '#FEF2F2', border: '#FECACA', icon: '!' };
  const orderCode =
    'orderCode' in result && typeof result.orderCode === 'string'
      ? result.orderCode
      : undefined;
  const amount =
    'amount' in result && typeof result.amount === 'number'
      ? result.amount
      : undefined;
  const orderId =
    'orderId' in result && typeof result.orderId === 'string'
      ? result.orderId
      : undefined;
  const appDeepLink =
    result.success && orderId
      ? `dmsseller://orders/${encodeURIComponent(orderId)}?payment=vnpay&status=success`
      : undefined;
  const appWebUrl =
    result.success && orderId
      ? `${(process.env.SELLER_APP_WEB_URL || 'http://localhost:8081').replace(/\/+$/, '')}/?vnpayOrderId=${encodeURIComponent(orderId)}&payment=vnpay&status=success`
      : undefined;

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #F8FAFC;
        color: #0F172A;
        font-family: Arial, sans-serif;
        padding: 24px;
      }
      .card {
        width: min(460px, 100%);
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
        padding: 28px;
        text-align: center;
      }
      .icon {
        width: 72px;
        height: 72px;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: ${tone.soft};
        border: 1px solid ${tone.border};
        color: ${tone.main};
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 18px;
      }
      h1 {
        color: ${tone.main};
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 10px;
      }
      p {
        color: #475569;
        font-size: 15px;
        line-height: 1.6;
        margin: 0;
      }
      .meta {
        display: grid;
        gap: 10px;
        margin-top: 22px;
        padding: 14px;
        border-radius: 10px;
        background: #F8FAFC;
        text-align: left;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 14px;
      }
      .label { color: #64748B; }
      .value { color: #0F172A; font-weight: 700; text-align: right; }
      .actions {
        display: grid;
        gap: 10px;
        margin-top: 22px;
      }
      a.button {
        display: block;
        width: 100%;
        border-radius: 10px;
        background: ${tone.main};
        color: #FFFFFF;
        font-size: 15px;
        font-weight: 700;
        padding: 13px 16px;
        text-decoration: none;
      }
      a.secondary {
        background: #FFFFFF;
        border: 1px solid #CBD5E1;
        color: #0F172A;
      }
    </style>
    ${
      appDeepLink
        ? `<script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.location.href = ${JSON.stringify(appDeepLink)};
        }, 700);
        setTimeout(function () {
          window.location.href = ${JSON.stringify(appWebUrl)};
        }, 2200);
      });
    </script>`
        : ''
    }
  </head>
  <body>
    <main class="card">
      <div class="icon">${tone.icon}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      ${
        orderCode || amount
          ? `<div class="meta">
              ${
                orderCode
                  ? `<div class="row"><span class="label">Mã đơn</span><span class="value">${escapeHtml(orderCode)}</span></div>`
                  : ''
              }
              ${
                amount
                  ? `<div class="row"><span class="label">Số tiền</span><span class="value">${Number(amount).toLocaleString('vi-VN')} đ</span></div>`
                  : ''
              }
            </div>`
          : ''
      }
      ${
        appDeepLink
          ? `<div class="actions">
              <a class="button" href="${escapeHtml(appDeepLink)}">Quay lại app</a>
              <a class="button secondary" href="${escapeHtml(appWebUrl)}">Mở app web</a>
            </div>`
          : ''
      }
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string | number | boolean | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
