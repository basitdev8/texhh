"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/admin/DataTable";
import Badge from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { IOrder, IUser } from "@/types";
import styles from "../admin.module.css";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<(IOrder & { user: IUser })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (statusFilter) params.set("status", statusFilter);
    setLoading(true);
    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const columns: Column<IOrder & { user: IUser }>[] = useMemo(
    () => [
      {
        key: "orderNumber",
        name: "Order #",
        render: (o) => (
          <Link
            href={`/admin/orders/${o._id}`}
            style={{ color: "var(--color-accent)", fontWeight: 600 }}
          >
            {o.orderNumber}
          </Link>
        ),
      },
      {
        key: "user",
        name: "Customer",
        sortable: false,
        render: (o) => (
          <div>
            <div style={{ fontWeight: 500 }}>{o.user?.name || "—"}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {o.user?.email}
            </div>
          </div>
        ),
      },
      {
        key: "items",
        name: "Items",
        sortable: false,
        render: (o) => o.items.length,
      },
      {
        key: "totalAmount",
        name: "Total",
        render: (o) => formatPrice(o.totalAmount),
      },
      {
        key: "status",
        name: "Status",
        render: (o) => (
          <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
        ),
      },
      {
        key: "createdAt",
        name: "Date",
        render: (o) => formatDate(o.createdAt),
      },
    ],
    []
  );

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <span className={styles.pageHeaderEyebrow}>
              Activity / {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className={styles.pageTitle}>
            The <span className={styles.pageTitleItalic}>order book</span>.
          </h1>
          <p className={styles.pageSubtitle}>
            Every order placed across the storefront, filterable by status
            and openable for status updates.
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading orders…</div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          emptyMessage="No orders yet"
          emptyDescription="When customers place orders, they will appear here."
        />
      )}
    </>
  );
}
