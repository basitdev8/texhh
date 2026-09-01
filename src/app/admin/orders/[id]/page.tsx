"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { IOrder, IUser } from "@/types";
import styles from "../../admin.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_OPTIONS: IOrder["status"][] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_OPTIONS: IOrder["paymentStatus"][] = [
  "pending",
  "paid",
  "failed",
  "refunded",
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

function toDateInput(value?: Date | string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<(IOrder & { user: IUser }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  // Local, editable delivery fields
  const [status, setStatus] = useState<IOrder["status"]>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const hydrate = (o: IOrder & { user: IUser }) => {
    setOrder(o);
    setStatus(o.status);
    setTrackingNumber(o.trackingNumber || "");
    setCarrier(o.carrier || "");
    setEstimatedDelivery(toDateInput(o.estimatedDelivery));
  };

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) hydrate(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = async (
    field: "paymentStatus",
    value: string
  ) => {
    if (!order) return;
    if (value === "refunded" && !window.confirm("Issue a refund? Razorpay payments will be refunded to the original payment method.")) {
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        hydrate(data.data);
        showToast("Payment updated", "success");
      } else {
        showToast(data.error || "Failed to update", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdating(false);
    }
  };

  const saveDelivery = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber.trim() || null,
          carrier: carrier.trim() || null,
          estimatedDelivery: estimatedDelivery || null,
          statusNote: statusNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        hydrate(data.data);
        setStatusNote("");
        showToast("Delivery details updated", "success");
      } else {
        showToast(data.error || "Failed to update", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading order…</div>;
  if (!order)
    return (
      <div className={styles.loading}>
        Order not found.{" "}
        <Link href="/admin/orders" style={{ color: "var(--color-accent)" }}>
          Back to list
        </Link>
      </div>
    );

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <Link
              href="/admin/orders"
              className={styles.pageHeaderEyebrow}
              style={{ color: "var(--color-ink)" }}
            >
              ← Activity / Orders
            </Link>
          </div>
          <h1 className={styles.pageTitle}>
            Order <span className={styles.pageTitleItalic}>{order.orderNumber}</span>{" "}
            <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
          </h1>
          <p className={styles.pageSubtitle}>
            Placed {formatDateTime(order.createdAt)} · Review fulfillment, payment, and delivery details.
          </p>
        </div>
      </header>

      <div className={styles.detailGrid}>
        <div className={styles.section} style={{ margin: 0 }}>
          <h2 className={styles.sectionTitle}>Items</h2>
          {order.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr auto",
                gap: "var(--space-4)",
                padding: "var(--space-3) 0",
                borderBottom: "1px solid var(--color-border-light)",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: "var(--color-bg-alt)",
                  borderRadius: "var(--radius-md)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {item.image && (
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
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {item.quantity} × {formatPrice(item.price)}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}

          <div style={{ marginTop: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
              <span>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid var(--color-border)",
                marginTop: "var(--space-3)",
                paddingTop: "var(--space-3)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
              }}
            >
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div className={styles.section} style={{ margin: 0 }}>
            <h2 className={styles.sectionTitle}>Delivery & Tracking</h2>
            <div className={styles.field}>
              <label className={styles.label}>Delivery Status</label>
              <select
                className={styles.input}
                value={status}
                onChange={(e) => setStatus(e.target.value as IOrder["status"])}
                disabled={updating}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Carrier</label>
              <input
                className={styles.input}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Delhivery, Blue Dart, DTDC"
                disabled={updating}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tracking Number</label>
              <input
                className={styles.input}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                disabled={updating}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Estimated Delivery</label>
              <input
                type="date"
                className={styles.input}
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                disabled={updating}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Update note (optional)</label>
              <input
                className={styles.input}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Shown to the customer in the timeline"
                disabled={updating}
              />
            </div>
            <button
              className={styles.primaryBtn}
              style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-2)" }}
              onClick={saveDelivery}
              disabled={updating}
            >
              {updating ? "Saving…" : "Save delivery update"}
            </button>
          </div>

          <div className={styles.section} style={{ margin: 0 }}>
            <h2 className={styles.sectionTitle}>Payment</h2>
            <div className={styles.field}>
              <label className={styles.label}>Payment Status</label>
              <select
                className={styles.input}
                value={order.paymentStatus}
                onChange={(e) => updateField("paymentStatus", e.target.value)}
                disabled={updating}
              >
                {PAYMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className={styles.section} style={{ margin: 0 }}>
              <h2 className={styles.sectionTitle}>Status History</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {[...order.statusHistory].reverse().map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      paddingBottom: "var(--space-3)",
                      borderBottom:
                        i < order.statusHistory!.length - 1
                          ? "1px solid var(--color-border-light)"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        textTransform: "capitalize",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      {ev.status}
                    </span>
                    {ev.note && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {ev.note}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {formatDateTime(ev.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section} style={{ margin: 0 }}>
            <h2 className={styles.sectionTitle}>Customer</h2>
            <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
              <strong>{order.user?.name}</strong>
              <br />
              <span style={{ color: "var(--color-text-secondary)" }}>
                {order.user?.email}
              </span>
            </div>
          </div>

          <div className={styles.section} style={{ margin: 0 }}>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>
            <address style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text)" }}>
                {order.shippingAddress.fullName}
              </strong>
              <br />
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zipCode}
              <br />
              {order.shippingAddress.country}
              <br />
              Phone: {order.shippingAddress.phone}
            </address>
          </div>

          {order.notes && (
            <div className={styles.section} style={{ margin: 0 }}>
              <h2 className={styles.sectionTitle}>Customer Notes</h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
