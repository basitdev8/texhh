"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatPrice } from "@/lib/utils";
import { isAllowedImageSource } from "@/lib/image";
import type { IAddress, IOrder } from "@/types";
import styles from "./page.module.css";

type Status = IOrder["status"];
type StatusFilter = "all" | Status;
type LoadState = "loading" | "ready" | "error";

const STATUS_VARIANT: Record<
  Status,
  "success" | "info" | "warning" | "error" | "neutral"
> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

const STATUS_SEQUENCE: Status[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

interface Profile {
  name?: string;
  email?: string;
  role?: "admin" | "customer";
  phone?: string;
  addresses?: IAddress[];
  createdAt?: string;
}

const ORDER_FETCH_LIMIT = 100;

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const loadOrders = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch(`/api/orders?limit=${ORDER_FETCH_LIMIT}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Request failed");
      const list: IOrder[] = Array.isArray(data.data) ? data.data : [];
      setOrders(list);
      setOrderTotal(
        typeof data.pagination?.total === "number" ? data.pagination.total : list.length
      );
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
  }, [isAuthenticated, loadOrders]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.success) setProfile(data.data as Profile);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const statusCounts = useMemo(() => {
    const counts = new Map<Status, number>();
    orders.forEach((order) => {
      counts.set(order.status, (counts.get(order.status) || 0) + 1);
    });
    return counts;
  }, [orders]);

  const availableFilters = useMemo(
    () => STATUS_SEQUENCE.filter((status) => statusCounts.has(status)),
    [statusCounts]
  );

  const stats = useMemo(() => {
    const spend = orders.reduce((sum, order) => {
      if (order.status === "cancelled" || order.paymentStatus === "refunded") return sum;
      return sum + (order.totalAmount || 0);
    }, 0);
    return {
      spend,
      inTransit: statusCounts.get("shipped") || 0,
      delivered: statusCounts.get("delivered") || 0,
    };
  }, [orders, statusCounts]);

  const visibleOrders = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter]
  );

  const savedAddresses = profile?.addresses?.length ? profile.addresses : null;
  const lastShippedTo = orders[0]?.shippingAddress ?? null;
  const addresses: IAddress[] = savedAddresses
    ? savedAddresses.slice(0, 2)
    : lastShippedTo
      ? [lastShippedTo]
      : [];

  if (isLoading || !user) {
    return (
      <div className={styles.page}>
        <div className="container" aria-busy="true">
          <span className="sr-only">Loading account</span>
          <div className={styles.header} aria-hidden="true">
            <span className={styles.skelLine} />
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];
  const hasOrders = orders.length > 0;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Account Header */}
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <span className={styles.eyebrow}>Account Overview</span>
            <h1 className={styles.title}>Hello, {firstName}</h1>
            <p className={styles.subtitle}>
              Manage your orders, saved addresses, and profile details.
            </p>
          </div>

          <div className={styles.headerMeta}>
            <div className={styles.metaField}>
              <span className={styles.metaKey}>Email</span>
              <span className={styles.metaVal}>{user.email}</span>
            </div>
            {profile?.createdAt && (
              <div className={styles.metaField}>
                <span className={styles.metaKey}>Member Since</span>
                <span className={styles.metaVal}>{formatDate(profile.createdAt)}</span>
              </div>
            )}
            <button type="button" onClick={handleLogout} className={styles.signOutBtn}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Quick Stats Grid */}
        {hasOrders && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{orderTotal}</span>
              <span className={styles.statLabel}>Total Orders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{formatPrice(stats.spend)}</span>
              <span className={styles.statLabel}>Total Spend</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.inTransit}</span>
              <span className={styles.statLabel}>In Transit</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.delivered}</span>
              <span className={styles.statLabel}>Delivered</span>
            </div>
          </div>
        )}

        {/* Order History Section */}
        <section className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Order History</h2>

            {availableFilters.length > 1 && (
              <div className={styles.filterPills}>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  aria-pressed={statusFilter === "all"}
                  className={`${styles.filterPill} ${statusFilter === "all" ? styles.filterPillActive : ""}`}
                >
                  All ({orders.length})
                </button>
                {availableFilters.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    aria-pressed={statusFilter === status}
                    className={`${styles.filterPill} ${statusFilter === status ? styles.filterPillActive : ""}`}
                  >
                    {status} ({statusCounts.get(status)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadState === "loading" ? (
            <div className={styles.emptyOrders}>Loading order history…</div>
          ) : loadState === "error" ? (
            <div className={styles.emptyOrders}>
              <p>Could not load order history.</p>
              <button type="button" onClick={loadOrders} className={styles.retryBtn}>
                Try again
              </button>
            </div>
          ) : !hasOrders ? (
            <div className={styles.emptyOrders}>
              <p>You have not placed any orders yet.</p>
              <Link href="/products" className={styles.shopBtn}>
                Browse Products
              </Link>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <p>No orders with status “{statusFilter}”.</p>
              <button type="button" onClick={() => setStatusFilter("all")} className={styles.retryBtn}>
                View all orders
              </button>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {visibleOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/account/orders/${order._id}`}
                  className={styles.orderRow}
                >
                  <div className={styles.orderThumbs}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className={styles.orderThumb}>
                        {isAllowedImageSource(item.image) ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="56px"
                            className={styles.orderThumbImg}
                          />
                        ) : (
                          <span className={styles.thumbInitial}>{item.name.charAt(0)}</span>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className={styles.moreThumbsBadge}>
                        +{order.items.length - 3}
                      </span>
                    )}
                  </div>

                  <div className={styles.orderInfo}>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span className={styles.orderItemsPreview}>
                      {order.items.map((item) => item.name).join(", ")}
                    </span>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className={styles.orderEnd}>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {order.status}
                    </Badge>
                    <span className={styles.orderAmount}>
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span className={styles.orderArrow}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Address & Profile Details */}
        <section className={styles.detailsGrid}>
          <div className={styles.detailsCard}>
            <h2 className={styles.cardHeading}>Delivery Addresses</h2>
            {addresses.length === 0 ? (
              <p className={styles.detailsMuted}>
                No saved address. Addresses are automatically recorded during checkout.
              </p>
            ) : (
              <div className={styles.addressList}>
                {addresses.map((address, i) => (
                  <div key={i} className={styles.addressItem}>
                    <strong>{address.fullName}</strong>
                    <span>{address.street}</span>
                    <span>{address.city}, {address.state} {address.zipCode}</span>
                    <span>{address.country} · Phone: {address.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailsCard}>
            <h2 className={styles.cardHeading}>Account Info</h2>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Full Name</span>
                <span className={styles.infoVal}>{user.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Email Address</span>
                <span className={styles.infoVal}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Account Role</span>
                <span className={styles.infoVal}>
                  {user.role === "admin" ? "Administrator" : "Customer"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
