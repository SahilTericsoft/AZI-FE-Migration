/**
 * Activity Log types — mirror `services/activity_log/models.py` + schemas.
 * A log row records: who (userId) changed what (module/feature/field/value)
 * on which record (identityId), and when (logDateTime).
 */

import type { BaseEntity } from "@/core/api/types";

export interface ActivityLog extends BaseEntity {
  module: string | null;
  feature?: string | null;
  field?: string | null;
  value?: string | null;
  type?: string | null;
  action?: string | null;
  userId?: number | null;
  identityId?: number | null;
  logDateTime?: string | null;
  data?: Record<string, unknown> | null;
  reasonForEdit?: string | null;
}

export interface ActivityLogListQuery {
  page?: number;
  limit?: number;
  identityId?: number;
  userId?: number;
  module?: string;
  type?: string;
}

export interface ActivityLogCreateRequest {
  module: string;
  [key: string]: unknown;
}
