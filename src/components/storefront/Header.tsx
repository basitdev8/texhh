"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

interface NavCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

// Short editorial taglines per category slug. Fallback to truncated description.
const CATEGORY_TAGLINES: Record<string, string> = {
  "tws-bluetooth": "True wireless, hand-vetted.",
  "bluetooth-speakers": "Portable & home audio.",
  "wireless-headphones": "Over-ear, noise cancelled.",
  "professional-speakerphones": "Conference-grade voice.",
  "professional-audio": "Studio headsets for pros.",
  smartwatches: "Wearables with intent.",
  cameras: "Mirrorless, instant, lens.",
  smartphones: "Flagship picks only.",
  "video-conferencing": "Meeting-room kit.",
  headphones: "Closed-back & reference.",
  "gaming-headphones": "Low-latency, game-ready.",
};

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
        id="main-header"
      >
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} id="header-logo">
            Tech<span className={styles.logoAccent}>Chasers</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            <Link
              href="/"
              className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}
              id="nav-home"
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`${styles.navLink} ${pathname.startsWith("/products") ? styles.navLinkActive : ""}`}
              id="nav-products"
            >
              Products
            </Link>
            <Link
              href="/pc-builder"
              className={`${styles.navLink} ${isActive("/pc-builder") ? styles.navLinkActive : ""}`}
              id="nav-pc-builder"
            >
              PC Builder
            </Link>
            <div
              className={`${styles.dropdownWrapper} ${dropdownOpen ? styles.dropdownOpen : ""}`}
              ref={dropdownRef}
            >
              <button
                className={styles.dropdownTrigger}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                id="nav-categories-dropdown"
              >
                Categories
                <svg
                  className={styles.dropdownChevron}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 4.5l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu} role="menu">
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownEyebrow}>
                      Browse / The Atelier
                    </span>
                    <span className={styles.dropdownEyebrowAccent}>
                      {categories.length || 11} edits
                    </span>
                  </div>

                  {(categories.length > 0
                    ? categories
                    : Array.from({ length: 4 }).map((_, i) => ({
                        _id: `placeholder-${i}`,
                        name: "Loading…",
                        slug: "",
                        description: "",
                      }))
                  ).map((cat, i) => (
                    <Link
                      key={cat._id || cat.slug || i}
                      href={cat.slug ? `/products?category=${cat.slug}` : "#"}
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className={styles.dropdownItemNum}>
                        №{String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.dropdownItemBody}>
                        <span className={styles.dropdownItemName}>
                          {cat.name}
                        </span>
                        <span className={styles.dropdownItemSub}>
                          {CATEGORY_TAGLINES[cat.slug] ||
                            (cat.description?.slice(0, 48) ?? "")}
                        </span>
                      </span>
                      <span className={styles.dropdownItemArrow} aria-hidden="true">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path
                            d="M2 5.5h7M6 2.5l3 3-3 3"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Link>
                  ))}

                  <div className={styles.dropdownFooter}>
                    <span className={styles.dropdownFooterLabel}>
                      Not sure where to start?
                    </span>
                    <Link
                      href="/products"
                      className={styles.dropdownFooterCTA}
                      onClick={() => setDropdownOpen(false)}
                    >
                      View entire catalogue →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className={styles.actions}>
            <Link href="/search" className={styles.iconBtn} aria-label="Search" id="header-search">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              className={styles.iconBtn}
              aria-label="Account"
              id="header-account"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M3 17.5c0-2.485 3.134-4.5 7-4.5s7 2.015 7 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <Link href="/cart" className={styles.iconBtn} aria-label="Cart" id="header-cart">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M6 6h12l-1.5 7H7.5L6 6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M6 6L5 3H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="16.5" r="1.5" fill="currentColor" />
              </svg>
              {itemCount > 0 && (
                <span className={styles.cartBadge}>{itemCount > 99 ? "99+" : itemCount}</span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              id="header-hamburger"
            >
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className={styles.mobileBackdrop}
            onClick={() => setMobileOpen(false)}
          />
          <aside className={styles.mobileDrawer} aria-label="Mobile navigation">
            <nav className={styles.mobileNav}>
              <Link href="/" className={styles.mobileNavLink}>
                Home
              </Link>
              <Link href="/products" className={styles.mobileNavLink}>
                Products
              </Link>
              <Link href="/pc-builder" className={styles.mobileNavLink}>
                PC Builder
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className={styles.mobileNavLink}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href={isAuthenticated ? "/account" : "/auth/login"}
                className={styles.mobileNavLink}
              >
                {isAuthenticated ? "My Account" : "Sign In"}
              </Link>
            </nav>
          </aside>
        </>
      )}

      {/* Spacer */}
      <div className={styles.spacer} />
    </>
  );
}
