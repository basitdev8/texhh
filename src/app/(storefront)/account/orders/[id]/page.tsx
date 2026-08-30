"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { isAllowedImageSource } from "@/lib/image";
import type { IOrder } from "@/types";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TIMELINE: { key: IOrder["status"]; label: string }[] = [
  { key: "pending", label: "Order placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_VARIANT: Record<
  IOrder["status"],
  "success" | "info" | "warning" | "error" | "neutral"
> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <LoadingState label="Opening your order" detail="Fetching your order timeline and items." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
          <h1>Order not found</h1>
          <Link
            href="/account"
            style={{
              display: "inline-block",
              marginTop: "var(--space-5)",
              color: "var(--color-accent)",
            }}
          >
            ← Back to account
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = TIMELINE.findIndex((t) => t.key === order.status);

  // First time each status was reached → shown as the timeline date.
  const statusDate = new Map<string, string>();
  (order.statusHistory || []).forEach((ev) => {
    if (!statusDate.has(ev.status)) {
      statusDate.set(ev.status, ev.timestamp as string);
    }
  });

  const hasTracking =
    order.trackingNumber || order.carrier || order.estimatedDelivery;
  const canCancel = order.status === "pending" || order.status === "processing";

  const cancelOrder = async () => {
    if (!window.confirm("Cancel this order? Any paid online amount will be refunded to the original payment method.")) {
      return;
    }

    setCancelling(true);
    setCancelError("");
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setCancelError(data.error || "Could not cancel this order. Please contact support.");
        return;
      }
      setOrder(data.data);
      if (data.warning) setCancelError(data.warning);
    } catch {
      setCancelError("Could not cancel this order. Please contact support.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/account" className={styles.back}>
          ← Back to account
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>
            Order {order.orderNumber}
            <Badge variant={STATUS_VARIANT[order.status]}>
              {order.status}
            </Badge>
          </h1>
          <p className={styles.subtitle}>
            Placed on {formatDateTime(order.createdAt)} ·{" "}
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Timeline</h3>
            {order.status === "cancelled" ? (
              <div className={styles.timeline}>
                <div className={styles.timelineStep}>
                  <div
                    className={`${styles.timelineDot} ${styles.timelineDotActive}`}
                    style={{
                      background: "var(--color-error)",
                      borderColor: "var(--color-error)",
                    }}
                  >
                    ✕
                  </div>
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineLabel}>Order cancelled</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.timeline}>
                {TIMELINE.map((step, i) => {
                  const isComplete = i <= currentIndex;
                  const when = statusDate.get(step.key);
                  return (
                    <div key={step.key} className={styles.timelineStep}>
                      <div
                        className={`${styles.timelineDot} ${isComplete ? styles.timelineDotActive : ""}`}
                      >
                        {isComplete ? "✓" : i + 1}
                      </div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineLabel}>{step.label}</div>
                        {when ? (
                          <div className={styles.timelineSub}>
                            {formatDateTime(when)}
                            {i === currentIndex ? " · Current status" : ""}
                          </div>
                        ) : i === currentIndex ? (
                          <div className={styles.timelineSub}>Current status</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasTracking && (
              <div className={styles.trackingBox}>
                <h3 className={styles.cardTitle} style={{ marginTop: 0 }}>
                  Tracking
                </h3>
                {order.carrier && (
                  <div className={styles.summaryRow}>
                    <span>Carrier</span>
                    <span style={{ fontWeight: 600 }}>{order.carrier}</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className={styles.summaryRow}>
                    <span>Tracking number</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className={styles.summaryRow}>
                    <span>Estimated delivery</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <h3 className={styles.cardTitle}>Items</h3>
            <div className={styles.items}>
              {order.items.map((item, i) => (
                <div key={i} className={styles.item}>
                  <div className={styles.itemImage}>
                    {isAllowedImageSource(item.image) && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="60px"
                        style={{ objectFit: "contain" }}
                      />
                    )}
                  </div>
                  <div>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Order Summary</h3>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0
                    ? "Free"
                    : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Shipping Address</h3>
              <address className={styles.address}>
                <strong>{order.shippingAddress.fullName}</strong>
                <br />
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
                <br />
                {order.shippingAddress.country}
                <br />
                Phone: {order.shippingAddress.phone}
              </address>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Payment</h3>
              <div className={styles.summaryRow}>
                <span>Method</span>
                <span style={{ textTransform: "capitalize" }}>
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Status</span>
                <Badge
                  variant={
                    order.paymentStatus === "paid"
                      ? "success"
                      : order.paymentStatus === "failed"
                      ? "error"
                      : "warning"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>

            {canCancel && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Need to cancel?</h3>
                <p className={styles.cancelCopy}>
                  This order has not been dispatched. Cancel now and any paid online amount will be refunded to the original payment method.
                </p>
                {cancelError && <p className={styles.cancelError}>{cancelError}</p>}
                <button className={styles.cancelButton} onClick={cancelOrder} disabled={cancelling}>
                  {cancelling ? "Cancelling…" : "Cancel order"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
