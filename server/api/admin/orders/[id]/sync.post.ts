import { eq } from "drizzle-orm";
import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { orders } from "~~/server/db/index";
import { snFetch } from "~~/server/utils/sn-api";

const SN_STATUS_MAP: Record<string, string> = {
  unpaid: "待支付",
  paid: "已支付",
  finished: "已完成",
  cancelled: "已取消",
  expired: "已取消",
  "0": "待支付",
  "1": "已支付",
  "2": "已完成",
  "3": "已取消",
  "4": "已取消",
};

function toLocalStatus(snStatus: string): string {
  return SN_STATUS_MAP[snStatus] || snStatus;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const orderId = getRouterParam(event, "id");
  if (!orderId) throw createError({ statusCode: 400, statusMessage: "Missing order ID" });

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw createError({ statusCode: 404, statusMessage: "Order not found" });

  const snOrder = await snFetch<Record<string, any>>(
    event,
    `/wallet/orders/${encodeURIComponent(order.orderId)}`,
  );

  const localStatus = toLocalStatus(snOrder.status);

  if (localStatus === "已支付" && order.status !== "已支付") {
    await db
      .update(orders)
      .set({ status: "已支付", paidAt: new Date(), deliveryStatus: "pending" })
      .where(eq(orders.id, orderId));
    order.status = "已支付";
    order.paidAt = new Date();
    order.deliveryStatus = "pending";
  } else if (snOrder.status && localStatus !== order.status) {
    await db
      .update(orders)
      .set({ status: localStatus })
      .where(eq(orders.id, orderId));
    order.status = localStatus;
  }

  return { id: order.id, status: order.status, deliveryStatus: order.deliveryStatus, paidAt: order.paidAt };
});
