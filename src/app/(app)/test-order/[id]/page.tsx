import OrderDetail from "@/features/test-order/components/order-detail";

export default async function TestOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetail orderId={Number(id)} />;
}
