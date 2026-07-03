"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrdersByPatient } from "@/features/test-order/test-order.queries";
import type { Order, PartyDetails } from "@/features/test-order/test-order.types";

function entityName(details: PartyDetails | null | undefined, fallbackId: number | null) {
  return details?.name || (fallbackId != null ? `#${fallbackId}` : "—");
}

function providerName(order: Order) {
  const p = order.physicianDetails;
  if (!p) return "—";
  const name = p.name || [p.firstName, p.lastName].filter(Boolean).join(" ");
  const npi = p.npiNumber || p.npi;
  if (!name) return "—";
  return npi ? `${name} · NPI: ${npi}` : name;
}

function statusVariant(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return "success" as const;
  if (s === "draft") return "secondary" as const;
  return "default" as const;
}

export default function OrderHistoryTab({ patientId }: { patientId: number }) {
  const { data, isLoading, isError, error } = useOrdersByPatient(patientId);
  const orders = data?.docs ?? [];

  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <p className="py-4 text-destructive">{error?.message ?? "Failed to load orders."}</p>;
  }

  if (orders.length === 0) {
    return <p className="py-4 text-muted-foreground">No orders for this patient.</p>;
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Ordering Provider</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>Ordered Date</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Facility</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.code ?? `#${order.id}`}</TableCell>
              <TableCell>{providerName(order)}</TableCell>
              <TableCell>{order.numberOfSamplesOrdered ?? "—"}</TableCell>
              <TableCell>
                {order.orderPlacedTime ??
                  (order.createdAt ? order.createdAt.slice(0, 10) : "—")}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(order.status)}>{order.status ?? "—"}</Badge>
              </TableCell>
              <TableCell>{entityName(order.facilityDetails, order.facilityId)}</TableCell>
              <TableCell>{entityName(order.locationDetails, order.locationId)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
