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

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<(IOrder & { user: IUser }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = async (
    field: "status" | "paymentStatus",
    value: string
  ) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder({ ...order, ...data.data });
        showToast(`${field === "status" ? "Status" : "Payment"} updated`, "success");
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
              data-cursor-text="Back"
            >
              ← Activity / Orders
            </Link>
          </div>
          <h1 className={styles.pageTitle}>
            Order <span className={styles.pageTitleItalic}>{order.orderNumber}</span>{" "}
            <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
          </h1>
          <p className={styles.pageSubtitle}>
            Placed {formatDateTime(order.createdAt)} · Update the order and
            payment status from the sidebar.
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
            <h2 className={styles.sectionTitle}>Update Status</h2>
            <div className={styles.field}>
              <label className={styles.label}>Order Status</label>
              <select
                className={styles.input}
                value={order.status}
                onChange={(e) => updateField("status", e.target.value)}
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
