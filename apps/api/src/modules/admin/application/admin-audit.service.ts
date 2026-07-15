/**
 * Purpose: Read side of the admin audit-log surface — a filtered, paginated
 *   query and a CSV export over the same filters.
 * Why important: Every admin mutation writes an AuditLog row; this is the only
 *   way to inspect and export that trail for security review and compliance.
 * Used by: AdminAuditController (modules/admin).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminAuditLogRecord, AdminAuditLogsResponse } from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { toAuditCsv } from './admin-audit.csv';

export type AdminAuditLogsQuery = {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  adminUserId?: string;
  from?: string;
  to?: string;
};

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Prisma.JsonValue;
  newValue: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string } | null;
};

// A single export is capped so one click can never pull the whole table into
// memory; tighten the filters to export a narrower slice.
const EXPORT_CAP = 10_000;

@Injectable()
export class AdminAuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async listLogs(query: AdminAuditLogsQuery): Promise<AdminAuditLogsResponse> {
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prismaService.auditLog.count({ where }),
      this.prismaService.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    return {
      data: rows.map((row: AuditRow) => this.toRecord(row)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async collectCsv(query: AdminAuditLogsQuery): Promise<string> {
    const rows = await this.prismaService.auditLog.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
      take: EXPORT_CAP,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    return toAuditCsv(rows.map((row: AuditRow) => this.toRecord(row)));
  }

  private buildWhere(query: AdminAuditLogsQuery): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.adminUserId) where.userId = query.adminUserId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    return where;
  }

  private toRecord(row: AuditRow): AdminAuditLogRecord {
    return {
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      admin: row.user
        ? { id: row.user.id, firstName: row.user.firstName, lastName: row.user.lastName }
        : null,
      oldValue: row.oldValue ?? null,
      newValue: row.newValue ?? null,
      metadata: row.metadata ?? null,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
