"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import DataTable, { Column } from "@/components/admin/DataTable";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";
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

const STATUS_VARIANT: Record<IOrder["status"], "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

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
      name: "Order Number",
      render: (o) => (
        <Link
          href={`/admin/orders/${o._id}`}
          className={styles.orderLink}
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
        <div className={styles.customerCol}>
          <span className={styles.customerName}>
            {o.user?.name || o.shippingAddress?.fullName || "Guest Customer"}
          </span>
          {o.user?.email && (
            <span className={styles.customerEmail}>{o.user.email}</span>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      name: "Total Amount",
      render: (o) => (
        <span className={styles.orderAmount}>
          {formatPrice(o.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      name: "Status",
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status] || "info"}>
          {o.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      name: "Date Placed",
      render: (o) => (
        <span className={styles.dateCol}>
          {formatDate(o.createdAt)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "var(--space-12) 0" }}>
        <LoadingState label="Loading dashboard metrics" />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          <p className={styles.pageSubtitle}>
            Real-time business performance, order processing queues, and inventory alerts.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/products/new" className={styles.primaryBtn}>
            + Add Product
          </Link>
          <Link href="/admin/orders" className={styles.secondaryBtn}>
            View All Orders
          </Link>
        </div>
      </header>

      {/* Primary KPI Metrics Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          label="Total Revenue"
          value={formatPrice(stats?.totalRevenue ?? 0)}
          sublabel="Cumulative paid sales"
          variant="accent"
        />
        <StatsCard
          label="Orders Placed"
          value={stats?.orderCount ?? 0}
          sublabel="All lifetime orders"
        />
        <StatsCard
          label="Active Catalog Products"
          value={stats?.productCount ?? 0}
          sublabel="Visible on storefront"
        />
        <StatsCard
          label="Registered Customers"
          value={stats?.customerCount ?? 0}
          sublabel="Customer accounts"
        />
      </div>

      {/* Actionable Queues Strip */}
      <section className={styles.opsGrid} aria-label="Operational queues">
        <Link href="/admin/orders?status=pending" className={styles.opCard}>
          <span className={styles.opValue}>{stats?.ordersToFulfill ?? 0}</span>
          <span className={styles.opLabel}>Orders to Fulfill</span>
          <span className={styles.opHint}>Pending &amp; processing orders →</span>
        </Link>
        <Link href="/admin/orders" className={styles.opCard}>
          <span
            className={styles.opValue}
            style={{
              color: (stats?.pendingPayments ?? 0) > 0 ? "var(--color-warning)" : undefined,
            }}
          >
            {stats?.pendingPayments ?? 0}
          </span>
          <span className={styles.opLabel}>Pending Payments</span>
          <span className={styles.opHint}>Awaiting verification →</span>
        </Link>
        <Link href="/admin/products" className={styles.opCard}>
          <span
            className={styles.opValue}
            style={{
              color: (stats?.outOfStock ?? 0) > 0 ? "var(--color-error)" : undefined,
            }}
          >
            {stats?.outOfStock ?? 0}
          </span>
          <span className={styles.opLabel}>Out of Stock</span>
          <span className={styles.opHint}>Items requiring restock →</span>
        </Link>
        <Link href="/admin/products/new" className={styles.opCard}>
          <span className={styles.opValue} style={{ color: "var(--color-accent)" }}>+</span>
          <span className={styles.opLabel}>Catalog Quick Action</span>
          <span className={styles.opHint}>Add new item or part →</span>
        </Link>
      </section>

      {/* Low Stock Alerts */}
      {stats?.lowStock && stats.lowStock.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Low Inventory Alerts</h2>
              <p className={styles.sectionSubtitle}>
                Items with 5 or fewer remaining units in active stock.
              </p>
            </div>
            <Link href="/admin/products" className={styles.sectionLink}>
              Manage inventory →
            </Link>
          </div>

          <div className={styles.lowStockGrid}>
            {stats.lowStock.map((p) => (
              <Link
                key={p._id}
                href={`/admin/products/${p._id}`}
                className={styles.lowStockCard}
              >
                <span className={styles.lowStockName}>{p.name}</span>
                <span className={styles.lowStockQty}>{p.stock} units left</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders Table */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <p className={styles.sectionSubtitle}>
              Latest orders placed across all categories and custom PC builds.
            </p>
          </div>
          <Link href="/admin/orders" className={styles.sectionLink}>
            View full order queue →
          </Link>
        </div>

        <DataTable
          columns={orderColumns}
          data={stats?.recentOrders ?? []}
          emptyMessage="No recent orders"
          emptyDescription="Customer orders will populate in this queue upon placement."
        />
      </section>
    </div>
  );
}
