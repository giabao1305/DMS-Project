import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Promotion,
  PromotionDocument,
  PromotionType,
} from './schemas/promotion.schema';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private emitPromotionRealtime(action: string, promotion: Promotion): void {
    this.notificationsService.emitRealtime('promotion-updated', {
      action,
      promotion,
    });
  }

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    if (
      new Date(createPromotionDto.startDate) >
      new Date(createPromotionDto.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (
      createPromotionDto.type === PromotionType.PERCENT &&
      createPromotionDto.discountPercent === undefined
    ) {
      throw new BadRequestException('Discount percent is required');
    }

    if (
      createPromotionDto.type === PromotionType.AMOUNT &&
      createPromotionDto.discountAmount === undefined
    ) {
      throw new BadRequestException('Discount amount is required');
    }

    if (createPromotionDto.type === PromotionType.PRODUCT_GIFT) {
      if (!createPromotionDto.giftProduct || !createPromotionDto.giftQuantity) {
        throw new BadRequestException(
          'Gift product and gift quantity are required',
        );
      }

      const product = await this.productModel.findById(
        createPromotionDto.giftProduct,
      );

      if (!product || !product.isActive) {
        throw new NotFoundException('Gift product not found');
      }
    }

    const promotion = new this.promotionModel({
      ...createPromotionDto,
      giftProduct: createPromotionDto.giftProduct
        ? new Types.ObjectId(createPromotionDto.giftProduct)
        : undefined,
      startDate: new Date(createPromotionDto.startDate),
      endDate: new Date(createPromotionDto.endDate),
      minOrderValue: createPromotionDto.minOrderValue || 0,
    });

    const savedPromotion = await promotion.save();

    const sellers = await this.usersService.findByRole(UserRole.SELLER);

    await Promise.all(
      sellers.map((seller) =>
        this.notificationsService.create({
          user: seller._id.toString(),
          title: 'Khuyến mãi mới',
          message: `Chương trình khuyến mãi "${savedPromotion.name}" đã được tạo`,
          type: NotificationType.PROMOTION,
          relatedId: savedPromotion._id.toString(),
        }),
      ),
    );

    this.emitPromotionRealtime('created', savedPromotion);

    return savedPromotion;
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionModel
      .find()
      .populate('giftProduct', 'name code price unit')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<Promotion[]> {
    const now = new Date();

    return this.promotionModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .populate('giftProduct', 'name code price unit')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel
      .findById(id)
      .populate('giftProduct', 'name code price unit')
      .exec();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    this.emitPromotionRealtime('updated', promotion);

    return promotion;
  }

  async updatePromotion(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const { giftProduct, startDate, endDate, ...rest } = updatePromotionDto;

    const updateData: typeof rest & {
      giftProduct?: Types.ObjectId;
      startDate?: Date;
      endDate?: Date;
    } = {
      ...rest,
    };

    if (giftProduct) {
      updateData.giftProduct = new Types.ObjectId(giftProduct);
    }

    if (startDate) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    const promotion = await this.promotionModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate('giftProduct', 'name code price unit')
      .exec();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  async remove(id: string): Promise<{ message: string }> {
    const promotion = await this.promotionModel
      .findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' })
      .exec();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    this.emitPromotionRealtime('deleted', promotion);

    return {
      message: 'Promotion deleted successfully',
    };
  }
}
