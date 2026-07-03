/** Dashboard API — `services/dashboard/router.py` (mounted at `/dashboard`). */

import { http } from "@/core/api/client";

const base = "/dashboard";

export interface OnboardStat {
  count: number;
  thisMonth: number;
}
export interface OnboardingCount {
  facilities: OnboardStat;
  locations: OnboardStat;
  testOrders: OnboardStat;
  patients: OnboardStat;
}
export interface OrderStatusCount {
  total: number;
  segments: { label: string; value: number }[];
}
export interface OrderCountByYear {
  year: number;
  months: { month: string; count: number }[];
}
export interface WorkflowBucket {
  total: number;
  [k: string]: number;
}
export interface SampleWorkflow {
  ordered: WorkflowBucket;
  accessioned: WorkflowBucket;
  discontinued: WorkflowBucket;
  inProgress: WorkflowBucket;
  sendout: WorkflowBucket;
}
export interface SendoutAnalysis {
  sendoutPercentage: number;
  sampleCompletionRate: number;
  totalSendouts: number;
  avgTurnaround: string | null;
  referenceLabs: number;
}

export const dashboardApi = {
  onboarding: () =>
    http.post<OnboardingCount>(`${base}/onboarding-count`, {}).then((r) => r.data),
  orderStatus: () =>
    http.post<OrderStatusCount>(`${base}/order-status-count`, {}).then((r) => r.data),
  ordersByYear: (year?: number) =>
    http.post<OrderCountByYear>(`${base}/order-count-by-year`, { year }).then((r) => r.data),
  workflow: () =>
    http.post<SampleWorkflow>(`${base}/sample-workflow`, {}).then((r) => r.data),
  sendout: () =>
    http.post<SendoutAnalysis>(`${base}/sendout-analysis`, {}).then((r) => r.data),
};
