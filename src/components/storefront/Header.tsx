"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

interface NavCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMounted, setMobileMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const mobileMountedRef = useRef(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMounted]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  function openMobileMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    mobileMountedRef.current = true;
    setMobileMounted(true);
    setMobileOpen(true);
  }

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (!mobileMountedRef.current) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      mobileMountedRef.current = false;
      setMobileMounted(false);
      if (restoreFocus) hamburgerRef.current?.focus();
    }, 240);
  }, []);

  useEffect(() => {
    closeMobileMenu();
    setDropdownOpen(false);
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        if (mobileOpen) closeMobileMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, closeMobileMenu]);

  const findCategorySlug = (keywords: string[]) => {
    const found = categories.find((c) =>
      keywords.some((kw) => c.slug.toLowerCase().includes(kw) || c.name.toLowerCase().includes(kw))
    );
    return found ? `/products?category=${found.slug}` : "/products";
  };

  const mobilesHref = findCategorySlug(["phone", "mobile", "smartphones"]);
  const computersHref = findCategorySlug(["computer", "laptop", "pc", "desktop"]);
  const accessoriesHref = findCategorySlug(["accessory", "accessories", "watch", "tws", "audio", "headphone", "speaker"]);

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
        id="main-header"
      >
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} id="header-logo" aria-label="TechChasers Home">
            <span className={styles.logoMain}>TechChasers</span>
          </Link>

          <div className={styles.searchArea}>
            <SearchBar
              variant="header"
              placeholder="Search for products"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Primary navigation">
            <Link
              href="/products"
              className={`${styles.navLink} ${pathname === "/products" ? styles.navLinkActive : ""}`}
              id="nav-products"
            >
              Products
            </Link>
            <Link
              href={mobilesHref}
              className={`${styles.navLink} ${pathname === mobilesHref ? styles.navLinkActive : ""}`}
              id="nav-mobiles"
            >
              Mobiles
            </Link>
            <Link
              href={computersHref}
              className={`${styles.navLink} ${pathname === computersHref ? styles.navLinkActive : ""}`}
              id="nav-computers"
            >
              Computers
            </Link>
            <Link
              href="/pc-builder"
              className={`${styles.navLink} ${pathname === "/pc-builder" ? styles.navLinkActive : ""}`}
              id="nav-pc-builder"
            >
              Build a PC
            </Link>
            <Link
              href={accessoriesHref}
              className={`${styles.navLink} ${pathname === accessoriesHref ? styles.navLinkActive : ""}`}
              id="nav-accessories"
            >
              Accessories
            </Link>

            {/* Categories dropdown */}
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
                All Categories
                <svg
                  className={styles.dropdownChevron}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
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
                <div className={styles.dropdownMenu} role="menu" aria-label="All Categories">
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownTitle}>Shop by Category</span>
                    <Link
                      href="/products"
                      className={styles.dropdownViewAll}
                      onClick={() => setDropdownOpen(false)}
                    >
                      View all products →
                    </Link>
                  </div>

                  <div className={styles.dropdownGrid}>
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        className={styles.dropdownItem}
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className={styles.dropdownItemName}>{cat.name}</span>
                        {cat.description && (
                          <span className={styles.dropdownItemSub}>{cat.description}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className={styles.actions}>
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              className={styles.iconBtn}
              aria-label={isAuthenticated ? "My Account" : "Sign In"}
              id="header-account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <Link
              href="/cart"
              className={styles.iconBtn}
              aria-label={`Cart, ${hasMounted ? itemCount : 0} items`}
              id="header-cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {hasMounted && itemCount > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              ref={hamburgerRef}
              className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
              onClick={mobileOpen ? () => closeMobileMenu() : openMobileMenu}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation-drawer"
              aria-expanded={mobileOpen}
              id="header-hamburger"
            >
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMounted && (
        <>
          <div
            className={`${styles.mobileBackdrop} ${
              mobileOpen ? styles.mobileBackdropOpen : styles.mobileBackdropClosing
            }`}
            onClick={() => closeMobileMenu()}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            className={`${styles.mobileDrawer} ${
              mobileOpen ? styles.mobileDrawerOpen : styles.mobileDrawerClosing
            }`}
            aria-label="Mobile navigation"
            aria-modal="true"
            role="dialog"
            id="mobile-navigation-drawer"
          >
            <div className={styles.mobileDrawerHead}>
              <span className={styles.mobileDrawerTitle}>Navigation</span>
              <button
                className={styles.mobileClose}
                onClick={() => closeMobileMenu()}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className={styles.mobileNav}>
              <div className={styles.mobilePrimaryLinks}>
                <Link href="/" className={styles.mobileNavLink} onClick={() => closeMobileMenu()}>
                  Home
                </Link>
                <Link href="/products" className={styles.mobileNavLink} onClick={() => closeMobileMenu()}>
                  All Products
                </Link>
                <Link href="/pc-builder" className={styles.mobileNavLink} onClick={() => closeMobileMenu()}>
                  PC Builder
                </Link>
              </div>

              {categories.length > 0 && (
                <div className={styles.mobileCategories}>
                  <span className={styles.mobileCategoryHeading}>Categories</span>
                  <div className={styles.mobileCategoryList}>
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        className={styles.mobileCategoryItem}
                        onClick={() => closeMobileMenu()}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.mobileFooter}>
                <Link
                  href={isAuthenticated ? "/account" : "/auth/login"}
                  className={styles.mobileAccountBtn}
                  onClick={() => closeMobileMenu()}
                >
                  {isAuthenticated ? "My Account" : "Sign In / Register"}
                </Link>
              </div>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
