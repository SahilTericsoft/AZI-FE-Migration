/** Support types — mirror `services/support/models.py`. */

import type { BaseEntity } from "@/core/api/types";

/** Matches the admin-console `helpSection` attachment shape. */
export interface HelpAttachment {
  id?: number;
  helpSectionId?: number;
  title?: string | null;
  description?: string | null;
  secureUrl?: string | null;
  url?: string | null;
  mimeType?: string | null;
  size?: string | null;
  attachmentType?: string | null;
}

export interface HelpSection extends BaseEntity {
  sequence?: number | null;
  title: string | null;
  description?: string | null;
  attachments?: HelpAttachment[] | null;
}

export interface SystemDocument extends BaseEntity {
  title: string | null;
  url: string | null;
  description?: string | null;
}

export interface DocumentCreateRequest {
  title: string;
  url: string;
  description?: string;
}
