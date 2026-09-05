"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

interface NavCategory {
  _id: string;
  name: string;
  slug: string;
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const menuMountedRef = useRef(false);
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
    document.body.style.overflow = menuMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuMounted]);

  // The drawer covers the trigger, so focus moves in on open and back on close.
  useEffect(() => {
    if (menuOpen) drawerCloseRef.current?.focus();
  }, [menuOpen]);

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

  function openMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    menuMountedRef.current = true;
    setMenuMounted(true);
    setMenuOpen(true);
  }

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    if (!menuMountedRef.current) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      menuMountedRef.current = false;
      setMenuMounted(false);
      if (restoreFocus) menuButtonRef.current?.focus();
    }, 240);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
        id="main-header"
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} id="header-logo">
            <Image
              src="/logo.svg"
              alt="TechChasers"
              width={1316}
              height={276}
              className={styles.logoImage}
              priority
              unoptimized
            />
          </Link>

          <div className={styles.searchArea}>
            <SearchBar variant="header" placeholder="Search for products" />
          </div>

          {/* Two high-intent destinations stay inline; everything else lives in the menu. */}
          <nav className={styles.quickNav} aria-label="Primary navigation">
            <Link
              href="/products"
              className={`${styles.navLink} ${pathname === "/products" ? styles.navLinkActive : ""}`}
              id="nav-products"
            >
              Products
            </Link>
            <Link
              href="/pc-builder"
              className={`${styles.navLink} ${pathname === "/pc-builder" ? styles.navLinkActive : ""}`}
              id="nav-pc-builder"
            >
              Build a PC
            </Link>
          </nav>

          <div className={styles.actions}>
            <Link
              href={isAuthenticated ? "/account" : "/auth/login"}
              className={styles.iconBtn}
              aria-label={isAuthenticated ? "My account" : "Sign in"}
              id="header-account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuBtn}
              onClick={menuOpen ? () => closeMenu() : openMenu}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-controls="storefront-menu"
              aria-expanded={menuOpen}
              id="header-menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className={styles.menuBtnLabel}>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {menuMounted && (
        <>
          <div
            className={`${styles.backdrop} ${
              menuOpen ? styles.backdropOpen : styles.backdropClosing
            }`}
            onClick={() => closeMenu()}
            aria-hidden="true"
          />
          <aside
            className={`${styles.drawer} ${
              menuOpen ? styles.drawerOpen : styles.drawerClosing
            }`}
            aria-label="Menu"
            aria-modal="true"
            role="dialog"
            id="storefront-menu"
          >
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>Menu</span>
              <button
                ref={drawerCloseRef}
                type="button"
                className={styles.drawerClose}
                onClick={() => closeMenu()}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className={styles.drawerNav}>
              <div className={styles.drawerLinks}>
                <Link href="/products" className={styles.drawerLink} onClick={() => closeMenu()}>
                  Products
                </Link>
                <Link href="/pc-builder" className={styles.drawerLink} onClick={() => closeMenu()}>
                  Build a PC
                </Link>
                <Link
                  href={isAuthenticated ? "/account" : "/auth/login"}
                  className={styles.drawerLink}
                  onClick={() => closeMenu()}
                >
                  {isAuthenticated ? "My account" : "Sign in"}
                </Link>
                <Link href="/cart" className={styles.drawerLink} onClick={() => closeMenu()}>
                  Cart
                </Link>
              </div>

              {categories.length > 0 && (
                <div className={styles.drawerGroup}>
                  <span className={styles.drawerGroupTitle}>Categories</span>
                  <div className={styles.drawerCategories}>
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        className={styles.drawerCategory}
                        onClick={() => closeMenu()}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
