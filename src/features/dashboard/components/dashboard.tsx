"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Building2,
  ClipboardList,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { humanizeKey } from "@/lib/format";

import {
  useOnboardingCount,
  useOrderStatusCount,
  useOrdersByYear,
  useSampleWorkflow,
  useSendoutAnalysis,
} from "../dashboard.queries";
import type { WorkflowBucket } from "../dashboard.api";

const NOW_YEAR = new Date().getFullYear();
const YEARS = [NOW_YEAR, NOW_YEAR - 1, NOW_YEAR - 2];
const COOLDOWN_MS = 5 * 60 * 1000;

const STATUS_COLORS: Record<string, string> = {
  draft: "#F59E0B",
  ordered: "#6B7280",
  inprocess: "#3B82F6",
  partiallyresulted: "#8B5CF6",
  completed: "#10B981",
  canceled: "#EF4444",
  cancelled: "#EF4444",
};
const FALLBACK = ["#6E43DB", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"];
const colorFor = (label: string, i: number) =>
  STATUS_COLORS[label.toLowerCase().replace(/[^a-z]/g, "")] ?? FALLBACK[i % FALLBACK.length];

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [year, setYear] = useState(NOW_YEAR);
  const [now, setNow] = useState(Date.now());

  const onboarding = useOnboardingCount(loaded);
  const orderStatus = useOrderStatusCount(loaded);
  const orders = useOrdersByYear(year, loaded);
  const workflow = useSampleWorkflow(loaded);
  const sendout = useSendoutAnalysis(loaded);
  const queries = [onboarding, orderStatus, orders, workflow, sendout];
  const fetching = queries.some((q) => q.isFetching);

  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  const cooldownLeft = lastUpdated
    ? Math.max(0, Math.ceil((COOLDOWN_MS - (now - lastUpdated.getTime())) / 60000))
    : 0;

  const load = () => {
    setLoaded(true);
    setLastUpdated(new Date());
  };
  const refresh = () => {
    queries.forEach((q) => q.refetch());
    setLastUpdated(new Date());
    setNow(Date.now());
  };

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <Tabs defaultValue="general">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          {loaded && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Last Updated:{" "}
                {lastUpdated ? lastUpdated.toLocaleString() : "-"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={refresh}
                disabled={fetching || cooldownLeft > 0}
                title={cooldownLeft > 0 ? `Refresh enabled in ${cooldownLeft} min` : ""}
              >
                <RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {fetching ? "Fetching…" : "Refresh Data"}
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="general" className="mt-6">
          {!loaded ? (
            <LoadGate onLoad={load} />
          ) : (
            <div className="flex flex-col gap-6">
              <LabOverview data={onboarding.data} loading={onboarding.isLoading} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <OrderStatusCard data={orderStatus.data} loading={orderStatus.isLoading} />
                <SendoutCard data={sendout.data} loading={sendout.isLoading} />
              </div>

              <OrdersCreatedCard
                data={orders.data}
                loading={orders.isLoading}
                year={year}
                onYear={setYear}
              />

              <WorkflowSection data={workflow.data} loading={workflow.isLoading} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="grid place-items-center p-12 text-muted-foreground">
            Analytics coming soon.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadGate({ onLoad }: { onLoad: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
        <RefreshCw className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold">Load dashboard data</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Dashboard metrics are heavy aggregations, so they aren&apos;t loaded
          automatically. Click below to fetch the latest figures.
        </p>
      </div>
      <Button size="lg" className="gap-2" onClick={onLoad}>
        <RefreshCw className="h-4 w-4" />
        Load Dashboard Data
      </Button>
    </Card>
  );
}

/* --------------------------------- sections -------------------------------- */

const OVERVIEW = [
  { key: "facilities", label: "Facilities", href: "/facility", icon: Building2, bg: "bg-amber-100 text-amber-600" },
  { key: "locations", label: "Locations", href: "/location", icon: MapPin, bg: "bg-blue-100 text-blue-600" },
  { key: "testOrders", label: "Test Orders", href: "/test-order", icon: ClipboardList, bg: "bg-rose-100 text-rose-600" },
  { key: "patients", label: "Patients", href: "/patient", icon: Users, bg: "bg-violet-100 text-violet-600" },
] as const;

function compact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

function LabOverview({
  data,
  loading,
}: {
  data?: import("../dashboard.api").OnboardingCount;
  loading: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Lab Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW.map(({ key, label, href, icon: Icon, bg }) => {
          const stat = data?.[key];
          return (
            <Card key={key} className="p-4">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${bg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Link href={href} className="text-xs font-medium text-primary hover:underline">
                  View All →
                </Link>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              {loading ? (
                <div className="mt-1 h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-3xl font-bold">{compact(stat?.count ?? 0)}</p>
              )}
              {stat && stat.thisMonth > 0 && (
                <p className="text-xs font-medium text-emerald-600">+{stat.thisMonth} this month</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ChartCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        {right}
      </div>
      {children}
    </Card>
  );
}

function OrderStatusCard({
  data,
  loading,
}: {
  data?: import("../dashboard.api").OrderStatusCount;
  loading: boolean;
}) {
  const segments = data?.segments ?? [];
  return (
    <ChartCard title="Order by Status">
      {loading ? (
        <div className="grid h-60 place-items-center">
          <Spinner />
        </div>
      ) : segments.length === 0 ? (
        <div className="grid h-60 place-items-center text-sm text-muted-foreground">
          No orders yet.
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-56 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {segments.map((s, i) => (
                    <Cell key={s.label} fill={colorFor(s.label, i)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v as number, humanizeKey(String(n))]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">{compact(data?.total ?? 0)}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {segments.map((s, i) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(s.label, i) }} />
                <span className="text-muted-foreground">{humanizeKey(s.label)}</span>
                <span className="ml-auto font-medium">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

function Gauge({ value, color }: { value: number; color: string }) {
  const data = [
    { v: value },
    { v: 100 - value },
  ];
  return (
    <div className="relative h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="v"
            innerRadius={52}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#E5E7EB" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-xl font-bold">{value}%</div>
    </div>
  );
}

function SendoutCard({
  data,
  loading,
}: {
  data?: import("../dashboard.api").SendoutAnalysis;
  loading: boolean;
}) {
  return (
    <ChartCard title="Sendout Analysis">
      {loading ? (
        <div className="grid h-60 place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <Gauge value={data?.sendoutPercentage ?? 0} color="#6E43DB" />
              <span className="text-sm text-muted-foreground">Sendout Percentage</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Gauge value={data?.sampleCompletionRate ?? 0} color="#10B981" />
              <span className="text-sm text-muted-foreground">Sample Completion Rate</span>
            </div>
          </div>
          <dl className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
            <Row label="Total Sendouts" value={data?.totalSendouts ?? 0} />
            <Row label="Avg. Turnaround Time" value={data?.avgTurnaround ?? "Unavailable"} />
            <Row label="Reference Labs" value={data?.referenceLabs ?? 0} />
          </dl>
        </div>
      )}
    </ChartCard>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function OrdersCreatedCard({
  data,
  loading,
  year,
  onYear,
}: {
  data?: import("../dashboard.api").OrderCountByYear;
  loading: boolean;
  year: number;
  onYear: (y: number) => void;
}) {
  return (
    <ChartCard
      title="Orders Created"
      right={
        <Select value={String(year)} onValueChange={(v) => onYear(Number(v))}>
          <SelectTrigger className="h-9 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <div className="grid h-64 place-items-center">
          <Spinner />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.months ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(110,67,219,0.06)" }} />
            <Bar dataKey="count" fill="#6E43DB" radius={[4, 4, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

const WORKFLOW_CARDS = [
  { key: "ordered", label: "Ordered", accent: "border-amber-300 bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
  { key: "accessioned", label: "Accessioned", accent: "border-blue-300 bg-blue-50", bar: "bg-blue-500", text: "text-blue-700" },
  { key: "discontinued", label: "Discontinued", accent: "border-rose-300 bg-rose-50", bar: "bg-rose-500", text: "text-rose-700" },
  { key: "inProgress", label: "In Progress", accent: "border-slate-300 bg-slate-50", bar: "bg-slate-500", text: "text-slate-700" },
  { key: "sendout", label: "Sendout", accent: "border-yellow-300 bg-yellow-50", bar: "bg-yellow-500", text: "text-yellow-700" },
] as const;

function WorkflowSection({
  data,
  loading,
}: {
  data?: import("../dashboard.api").SampleWorkflow;
  loading: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Sample Workflow Status</h2>
      {loading ? (
        <Card className="grid h-40 place-items-center">
          <Spinner />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {WORKFLOW_CARDS.map(({ key, label, accent, bar, text }) => {
            const bucket = data?.[key] as WorkflowBucket | undefined;
            const total = bucket?.total ?? 0;
            const rows = Object.entries(bucket ?? {}).filter(([k]) => k !== "total");
            return (
              <Card key={key} className={`border p-4 ${accent}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${text}`}>{label}</span>
                  <span className={`text-lg font-bold ${text}`}>{total}</span>
                </div>
                <div className="mt-3 flex flex-col gap-2.5">
                  {rows.map(([k, v]) => (
                    <div key={k}>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="capitalize">{humanizeKey(k)}</span>
                        <span>{v}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div
                          className={`h-full rounded-full ${bar}`}
                          style={{ width: `${total > 0 ? Math.round((v / total) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
