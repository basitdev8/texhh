"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatPrice } from "@/lib/utils";
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

/* Filters follow the real order lifecycle, so the bar reads as a progression. */
const STATUS_SEQUENCE: Status[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/* /api/auth/me returns the full user document, which carries the phone,
   saved addresses and join date the auth context does not keep. */
interface Profile {
  name?: string;
  email?: string;
  role?: "admin" | "customer";
  phone?: string;
  addresses?: IAddress[];
  createdAt?: string;
}

const ORDER_FETCH_LIMIT = 100;

function padCount(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function hasImage(src?: string): src is string {
  return typeof src === "string" && (src.startsWith("http") || src.startsWith("/"));
}

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

  /* Signed-in identity is not known yet: hold the layout with skeletons
     instead of a bare line of text, so nothing shifts when data lands. */
  if (isLoading || !user) {
    return (
      <div className={styles.page}>
        <div className="container" aria-busy="true">
          <span className="sr-only">Loading your account</span>
          <div className={styles.head} aria-hidden="true">
            <div className={styles.headMain}>
              <span className={styles.skelLede} />
              <span className={styles.skelTitle} />
              <span className={styles.skelLede} />
            </div>
          </div>
          <ArchiveSkeleton />
        </div>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];
  const hasOrders = orders.length > 0;
  const spendLabel = orderTotal > orders.length ? "Recent spend" : "Lifetime spend";

  return (
    <>
      <div className={styles.page}>
        <div className="container">
          {/* 1. Identity and session */}
          <Reveal className={styles.head}>
            <div className={styles.headMain}>
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowLine} />
                <span className={styles.eyebrow}>Your account</span>
              </div>
              <h1 className={styles.greeting}>
                Welcome back,{" "}
                <em className={styles.greetingName}>{firstName}</em>.
              </h1>
              <p className={styles.lede}>
                Your order history, saved addresses, and account details, in one
                place.
              </p>
            </div>

            <div className={styles.headMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Signed in as</span>
                <span className={styles.metaValue}>{user.email}</span>
              </div>
              {profile?.createdAt && (
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Member since</span>
                  <span className={styles.metaValue}>
                    {formatDate(profile.createdAt)}
                  </span>
                </div>
              )}
              <button type="button" onClick={handleLogout} className={styles.signOut}>
                Sign out
              </button>
            </div>
          </Reveal>

          {/* 2. Ledger — only shown once there are real figures to show */}
          {hasOrders && (
            <Reveal className={styles.ledger} delay={100}>
              <div className={styles.ledgerCell}>
                <span className={styles.ledgerFigure}>{padCount(orderTotal)}</span>
                <span className={styles.ledgerLabel}>Orders placed</span>
              </div>
              <div className={styles.ledgerCell}>
                <span
                  className={`${styles.ledgerFigure} ${styles.ledgerFigureMoney}`}
                >
                  {formatPrice(stats.spend)}
                </span>
                <span className={styles.ledgerLabel}>{spendLabel}</span>
              </div>
              <div className={styles.ledgerCell}>
                <span className={styles.ledgerFigure}>{padCount(stats.inTransit)}</span>
                <span className={styles.ledgerLabel}>In transit</span>
              </div>
              <div className={styles.ledgerCell}>
                <span className={styles.ledgerFigure}>{padCount(stats.delivered)}</span>
                <span className={styles.ledgerLabel}>Delivered</span>
              </div>
            </Reveal>
          )}

          {/* 3. The archive */}
          <section className={styles.section}>
            <div className={styles.archiveHead}>
              <h2 className={styles.sectionTitle}>
                Every order, <em>on file</em>.
              </h2>

              {availableFilters.length > 1 && (
                <div className={styles.filters}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    aria-pressed={statusFilter === "all"}
                    className={`${styles.filter} ${statusFilter === "all" ? styles.filterActive : ""}`}
                  >
                    All
                    <span className={styles.filterCount}>{orders.length}</span>
                  </button>
                  {availableFilters.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      aria-pressed={statusFilter === status}
                      className={`${styles.filter} ${statusFilter === status ? styles.filterActive : ""}`}
                    >
                      {status}
                      <span className={styles.filterCount}>
                        {statusCounts.get(status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loadState === "loading" ? (
              <ArchiveSkeleton />
            ) : loadState === "error" ? (
              <div className={styles.state}>
                <h3 className={styles.stateTitle}>Orders could not be loaded.</h3>
                <p className={styles.stateText}>
                  The request to fetch your orders did not complete. Your account is
                  fine, the list just needs another try.
                </p>
                <button type="button" onClick={loadOrders} className={styles.retry}>
                  Try again
                </button>
              </div>
            ) : !hasOrders ? (
              <div className={styles.state}>
                <h3 className={styles.stateTitle}>Nothing on file yet.</h3>
                <p className={styles.stateText}>
                  Place an order and it appears here with its items, its status, and
                  the amount you paid.
                </p>
                <Link href="/products" className={styles.link}>
                  Browse the catalog
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className={styles.state}>
                <h3 className={styles.stateTitle}>No {statusFilter} orders.</h3>
                <p className={styles.stateText}>
                  Nothing in your archive carries that status right now.
                </p>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={styles.retry}
                >
                  Show all orders
                </button>
              </div>
            ) : (
              <div className={styles.rows}>
                {visibleOrders.map((order, i) => (
                  <Reveal key={order._id} delay={Math.min(i, 5) * 100}>
                    <Link
                      href={`/account/orders/${order._id}`}
                      className={styles.row}
                    >
                      <span className={styles.thumbs} aria-hidden="true">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index} className={styles.thumb}>
                            {hasImage(item.image) ? (
                              <Image
                                src={item.image}
                                alt=""
                                fill
                                sizes="60px"
                                className={styles.thumbImg}
                              />
                            ) : (
                              <span className={styles.thumbFallback}>
                                {item.name.charAt(0)}
                              </span>
                            )}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className={styles.thumbMore}>
                            +{order.items.length - 3}
                          </span>
                        )}
                      </span>

                      <span className={styles.rowInfo}>
                        <span className={styles.rowNumber}>{order.orderNumber}</span>
                        <span className={styles.rowItems}>
                          {order.items.map((item) => item.name).join(", ")}
                        </span>
                        <span className={styles.rowMeta}>
                          {formatDate(order.createdAt)} · {order.items.length}{" "}
                          item{order.items.length !== 1 ? "s" : ""}
                        </span>
                      </span>

                      <span className={styles.rowSide}>
                        <Badge variant={STATUS_VARIANT[order.status]}>
                          {order.status}
                        </Badge>
                        <span className={styles.rowAmount}>
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span className={styles.rowArrow} aria-hidden="true">
                          ↗
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          {/* 4. Shipping and account facts */}
          <Reveal as="section" className={styles.details}>
            <div>
              <h2 className={styles.detailsTitle}>Shipping</h2>
              {addresses.length === 0 ? (
                <p className={styles.stateText}>
                  No address on file yet. You enter one at checkout when you place
                  your first order.
                </p>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map((address, i) => (
                    <div key={i} className={styles.address}>
                      <span className={styles.addressName}>
                        {address.fullName}
                        {savedAddresses ? (
                          address.isDefault && <span className={styles.tag}>Default</span>
                        ) : (
                          <span className={styles.tag}>Last used</span>
                        )}
                      </span>
                      <span>{address.street}</span>
                      <span>
                        {address.city}, {address.state} {address.zipCode}
                      </span>
                      <span>{address.country}</span>
                      <span>{address.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className={styles.detailsTitle}>Account details</h2>
              <div className={styles.factList}>
                <div className={styles.fact}>
                  <span className={styles.factKey}>Name</span>
                  <span className={styles.factValue}>{user.name}</span>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factKey}>Email</span>
                  <span className={styles.factValue}>{user.email}</span>
                </div>
                {profile?.phone && (
                  <div className={styles.fact}>
                    <span className={styles.factKey}>Phone</span>
                    <span className={styles.factValue}>{profile.phone}</span>
                  </div>
                )}
                <div className={styles.fact}>
                  <span className={styles.factKey}>Account type</span>
                  <span className={styles.factValue}>
                    {user.role === "admin" ? "Administrator" : "Customer"}
                  </span>
                </div>
                {profile?.createdAt && (
                  <div className={styles.fact}>
                    <span className={styles.factKey}>Member since</span>
                    <span className={styles.factValue}>
                      {formatDate(profile.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* 5. The one ink band, same device the homepage uses */}
      <section className={styles.cta}>
        <div className="container">
          <Reveal className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>
                Build it <em>your</em> way.
              </h2>
              <p className={styles.ctaText}>
                Pick every component, watch compatibility as you go, and send the
                whole build to your basket in one pass.
              </p>
              <Link href="/pc-builder" className={styles.ctaButton}>
                Open PC Builder
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <nav className={styles.ctaLinks} aria-label="Account shortcuts">
              <span className={styles.ctaLinksTitle}>Quick links</span>
              {hasOrders && (
                <Link href="/products" className={styles.ctaLink}>
                  Full catalog
                  <span className={styles.ctaLinkArrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              )}
              <Link href="/cart" className={styles.ctaLink}>
                Your cart
                <span className={styles.ctaLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className={styles.ctaLink}>
                  Admin panel
                  <span className={styles.ctaLinkArrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              )}
            </nav>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* Skeleton mirrors the order row so nothing moves when the data arrives. */
function ArchiveSkeleton() {
  return (
    <div className={styles.rows} aria-busy="true">
      <span className="sr-only">Loading your orders</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.skelRow} aria-hidden="true">
          <span className={styles.skelBox} />
          <span className={styles.skelStack}>
            <span className={styles.skelLineA} />
            <span className={styles.skelLineB} />
          </span>
          <span className={styles.skelPill} />
        </div>
      ))}
    </div>
  );
}
