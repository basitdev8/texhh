"use client";

import React, { useEffect, useState, useMemo } from "react";
import DataTable, { Column } from "@/components/admin/DataTable";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/utils";
import styles from "../admin.module.css";

interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const PER_PAGE = 25;

  // Searching starts from the first page again.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Filtering happens server-side, so a large customer list is never all in memory.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PER_PAGE));
    params.set("page", String(page));
    if (search.trim()) params.set("search", search.trim());
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/admin/customers?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setCustomers(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timeout);
  }, [search, page]);

  const columns: Column<CustomerRow>[] = useMemo(
    () => [
      {
        key: "name",
        name: "Customer",
        render: (c) => (
          <div className={styles.cellName}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                background: "var(--color-accent-subtle)",
                color: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.cellNameText}>{c.name}</div>
              <div className={styles.cellNameSub}>{c.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "orderCount",
        name: "Orders",
        render: (c) => (
          <Badge variant={c.orderCount > 0 ? "info" : "neutral"}>
            {c.orderCount}
          </Badge>
        ),
      },
      {
        key: "totalSpent",
        name: "Total Spent",
        render: (c) => formatPrice(c.totalSpent),
      },
      {
        key: "createdAt",
        name: "Joined",
        render: (c) => formatDate(c.createdAt),
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
              People / {total} customer{total !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className={styles.pageTitle}>Customers</h1>
          <p className={styles.pageSubtitle}>
            Registered accounts, total orders placed, and lifetime spend
            across the storefront.
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by name or email…"
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading customers…</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={customers}
            emptyMessage="No customers found"
            emptyDescription="When users register, they will appear here."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
