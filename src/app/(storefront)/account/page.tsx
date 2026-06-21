"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { IOrder } from "@/types";
import styles from "./page.module.css";

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

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/orders?limit=10")
      .then((res) => res.json())
      .then((data) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  if (isLoading || !user) {
    return (
      <div className="container">
        <div style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.greeting}>Welcome, {user.name.split(" ")[0]}</h1>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>

        <div className={styles.layout}>
          <aside className={styles.profileCard}>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={styles.name}>{user.name}</h2>
              <p className={styles.email}>{user.email}</p>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailKey}>Account type</span>
              <span className={styles.detailValue}>
                {user.role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailKey}>Total orders</span>
              <span className={styles.detailValue}>{orders.length}</span>
            </div>
            {user.role === "admin" && (
              <Link
                href="/admin"
                style={{
                  display: "inline-block",
                  marginTop: "var(--space-3)",
                  padding: "var(--space-2) var(--space-4)",
                  background: "var(--color-accent-subtle)",
                  color: "var(--color-accent)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                }}
              >
                Open Admin Panel →
              </Link>
            )}
          </aside>

          <section className={styles.ordersCard}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            {loading ? (
              <div className={styles.empty}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className={styles.empty}>
                You haven&apos;t placed any orders yet.
                <br />
                <Link
                  href="/products"
                  style={{
                    display: "inline-block",
                    marginTop: "var(--space-3)",
                    color: "var(--color-accent)",
                  }}
                >
                  Start shopping →
                </Link>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/account/orders/${order._id}`}
                    className={styles.orderRow}
                  >
                    <div className={styles.orderInfo}>
                      <span className={styles.orderNumber}>
                        {order.orderNumber}
                      </span>
                      <span className={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {order.status}
                    </Badge>
                    <span className={styles.orderAmount}>
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
