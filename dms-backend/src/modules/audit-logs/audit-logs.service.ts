import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type mongoose from 'mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildSearchRegex,
  getPagination,
  getSort,
  PaginatedResult,
  shouldPaginate,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { UserDocument } from '../users/schemas/user.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

type QueryFilter = mongoose.QueryFilter<AuditLogDocument> & {
  createdAt?: DateRangeFilter;
};

export type CreateAuditLogPayload = {
  actor?: UserDocument | Types.ObjectId | string;
  action: string;
  module: string;
  targetId?: string;
  targetLabel?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(payload: CreateAuditLogPayload): Promise<AuditLog> {
    const actor =
      payload.actor &&
      typeof payload.actor === 'object' &&
      '_id' in payload.actor
        ? payload.actor._id
        : payload.actor;

    const auditLog = new this.auditLogModel({
      ...payload,
      actor,
    });

    return auditLog.save();
  }

  private buildAuditLogListFilter(query?: PaginationQueryDto): QueryFilter {
    const filter: QueryFilter = {};

    if (query?.status) {
      filter.action = query.status;
    }

    if (query?.module) {
      filter.module = query.module;
    }

    if (query?.search) {
      const search = buildSearchRegex(query.search);
      filter.$or = [
        { action: search },
        { module: search },
        { targetLabel: search },
        { description: search },
      ];
    }

    const createdAt: DateRangeFilter = {};

    if (query?.fromDate) {
      createdAt.$gte = new Date(query.fromDate);
    }

    if (query?.toDate) {
      createdAt.$lte = new Date(query.toDate);
    }

    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }

    return filter;
  }

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<AuditLog[] | PaginatedResult<AuditLog>> {
    const filter = this.buildAuditLogListFilter(query);
    const auditLogQuery = this.auditLogModel
      .find(filter)
      .populate('actor', 'fullName email role')
      .sort(getSort(query));

    if (!shouldPaginate(query)) {
      return auditLogQuery.limit(300).exec();
    }

    const { page, limit, skip } = getPagination(query);
    const [data, total] = await Promise.all([
      auditLogQuery.skip(skip).limit(limit).exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(data, total, page, limit);
  }
}
