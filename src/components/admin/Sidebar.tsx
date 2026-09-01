'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavSection {
  section: string;
  links: { href: string; label: string; exact?: boolean }[];
}

const NAV: NavSection[] = [
  {
    section: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard', exact: true },
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/customers', label: 'Customers' },
    ],
  },
  {
    section: 'Catalog Management',
    links: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/pc-components', label: 'PC Components' },
      { href: '/admin/categories', label: 'Categories' },
    ],
  },
  {
    section: 'Storefront & Config',
    links: [
      { href: '/admin/homepage', label: 'Featured Selection' },
      { href: '/admin/settings', label: 'Store Settings' },
    ],
  },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onToggle}
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Admin navigation"
      >
        <button
          className={styles.collapseBtn}
          onClick={onToggle}
          aria-label="Close sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.logo}>
          <Link href="/admin" className={styles.logoLink}>
            <span className={styles.logoText}>TechChasers</span>
            <span className={styles.logoAdmin}>Operations Console</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {NAV.map((section) => (
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.links.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    onClick={() => {
                      if (window.innerWidth <= 1024) onToggle();
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <Link
            href="/"
            className={styles.viewSite}
          >
            ← View Live Storefront
          </Link>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
