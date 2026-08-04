"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import DataTable, { Column } from "@/components/admin/DataTable";
import { formatDate, formatPrice } from "@/lib/utils";
import type { IOrder, IUser } from "@/types";
import styles from "./admin.module.css";

interface LowStockItem {
  _id: string;
  name: string;
  slug: string;
  stock: number;
}

interface AdminStats {
  totalRevenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
  statusBreakdown: Record<string, number>;
  recentOrders: (IOrder & { user: IUser })[];
  ordersToFulfill: number;
  pendingPayments: number;
  outOfStock: number;
  lowStock: LowStockItem[];
}

const STATUS_LABEL: Record<IOrder["status"], { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "var(--color-warning)" },
  processing: { label: "Processing", tone: "var(--color-info)" },
  shipped: { label: "Shipped", tone: "var(--color-info)" },
  delivered: { label: "Delivered", tone: "var(--color-success)" },
  cancelled: { label: "Cancelled", tone: "var(--color-error)" },
};

function StatusPill({ status }: { status: IOrder["status"] }) {
  const info = STATUS_LABEL[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        fontWeight: 600,
        color: info.tone,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: info.tone,
          display: "inline-block",
        }}
      />
      {info.label}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const orderColumns: Column<IOrder & { user: IUser }>[] = [
    {
      key: "orderNumber",
      name: "Order №",
      render: (o) => (
        <Link
          href={`/admin/orders/${o._id}`}
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--color-ink)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            fontSize: "var(--text-base)",
          }}
          data-cursor-text="Open"
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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
            {o.user?.name || "Guest"}
          </span>
          {o.user?.email && (
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                letterSpacing: 0.2,
              }}
            >
              {o.user.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      name: "Total",
      render: (o) => (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "var(--text-base)",
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {formatPrice(o.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      name: "Status",
      render: (o) => <StatusPill status={o.status} />,
    },
    {
      key: "createdAt",
      name: "Placed",
      render: (o) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          {formatDate(o.createdAt)}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className={styles.loading}>Reading the books…</div>;
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      {/* Editorial page header */}
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeaderEyebrowRow}>
            <span className={styles.pageHeaderEyebrowLine} />
            <span className={styles.pageHeaderEyebrow}>
              Dashboard / {today}
            </span>
          </div>
          <h1 className={styles.pageTitle}>
            The <span className={styles.pageTitleItalic}>atelier</span>, in numbers.
          </h1>
          <p className={styles.pageSubtitle}>
            A live read of revenue, orders, and the people interacting with
            your storefront. Nothing here is cached — these numbers are
            queried fresh on every visit.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className={styles.primaryBtn}
          data-cursor-text="Orders"
        >
          Open orders
        </Link>
      </header>

      {/* Stats row — typographic, no cards */}
      <div className={styles.statsGrid}>
        <StatsCard
          label="Total revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
          sublabel="Paid orders, lifetime"
          variant="accent"
        />
        <StatsCard
          label="Orders placed"
          value={stats?.orderCount ?? 0}
          sublabel="All-time order count"
        />
        <StatsCard
          label="Active products"
          value={stats?.productCount ?? 0}
          sublabel="Visible on storefront"
        />
        <StatsCard
          label="Customers"
          value={stats?.customerCount ?? 0}
          sublabel="Registered accounts"
        />
      </div>

      {/* Operations — actionable tiles that link straight to work queues */}
      <section className={styles.opsGrid}>
        <Link href="/admin/orders?status=pending" className={styles.opCard}>
          <span className={styles.opValue}>{stats?.ordersToFulfill ?? 0}</span>
          <span className={styles.opLabel}>Orders to fulfill</span>
          <span className={styles.opHint}>Pending &amp; processing → ship these</span>
        </Link>
        <Link href="/admin/orders" className={styles.opCard}>
          <span
            className={styles.opValue}
            style={{
              color:
                (stats?.pendingPayments ?? 0) > 0
                  ? "var(--color-warning)"
                  : undefined,
            }}
          >
            {stats?.pendingPayments ?? 0}
          </span>
          <span className={styles.opLabel}>Pending payments</span>
          <span className={styles.opHint}>Awaiting capture or confirmation</span>
        </Link>
        <Link href="/admin/products" className={styles.opCard}>
          <span
            className={styles.opValue}
            style={{
              color:
                (stats?.outOfStock ?? 0) > 0 ? "var(--color-error)" : undefined,
            }}
          >
            {stats?.outOfStock ?? 0}
          </span>
          <span className={styles.opLabel}>Out of stock</span>
          <span className={styles.opHint}>Active products at zero stock</span>
        </Link>
        <Link href="/admin/products/new" className={styles.opCardAction}>
          <span className={styles.opActionPlus}>＋</span>
          <span className={styles.opLabel}>Quick actions</span>
          <span className={styles.opHint}>Add a product · manage catalog</span>
        </Link>
      </section>

      {/* Low stock — restock queue */}
      {stats?.lowStock && stats.lowStock.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionEyebrowRow}>
                <span className={styles.sectionEyebrowLine} />
                <span className={styles.sectionEyebrow}>
                  Inventory / Running low
                </span>
              </div>
              <h2 className={styles.sectionTitle}>Restock soon.</h2>
            </div>
            <Link href="/admin/products" className={styles.sectionLink}>
              Manage products →
            </Link>
          </div>
          <div className={styles.lowStockList}>
            {stats.lowStock.map((p) => (
              <Link
                key={p._id}
                href={`/admin/products/${p._id}`}
                className={styles.lowStockRow}
              >
                <span className={styles.lowStockName}>{p.name}</span>
                <span className={styles.lowStockQty}>
                  {p.stock} left
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Status breakdown — quiet, in-page list */}
      {stats?.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionEyebrowRow}>
                <span className={styles.sectionEyebrowLine} />
                <span className={styles.sectionEyebrow}>
                  Breakdown / Order status
                </span>
              </div>
              <h2 className={styles.sectionTitle}>Where things stand.</h2>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Object.keys(stats.statusBreakdown).length}, 1fr)`,
              borderTop: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const info = STATUS_LABEL[status as IOrder["status"]];
              return (
                <div
                  key={status}
                  style={{
                    padding: "var(--space-6)",
                    borderRight: "1px solid var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 400,
                      fontStyle: "italic",
                      fontSize: "var(--text-4xl)",
                      letterSpacing: "-0.03em",
                      color: info?.tone || "var(--color-ink)",
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.22em",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {info?.label || status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent orders — editorial table */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionEyebrowRow}>
              <span className={styles.sectionEyebrowLine} />
              <span className={styles.sectionEyebrow}>
                Activity / Recent orders
              </span>
            </div>
            <h2 className={styles.sectionTitle}>The latest ten.</h2>
          </div>
          <Link
            href="/admin/orders"
            className={styles.sectionLink}
            data-cursor-text="All"
          >
            View all orders →
          </Link>
        </div>
        <DataTable
          columns={orderColumns}
          data={stats?.recentOrders ?? []}
          emptyMessage="No orders yet"
          emptyDescription="When customers place orders, they will appear here."
        />
      </section>
    </>
  );
}
