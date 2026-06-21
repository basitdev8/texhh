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
    section: 'Main',
    links: [
      { href: '/admin', label: 'Dashboard', exact: true },
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/orders', label: 'Orders' },
    ],
  },
  {
    section: 'Catalogue',
    links: [
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/pc-components', label: 'PC Components' },
    ],
  },
  {
    section: 'People',
    links: [
      { href: '/admin/customers', label: 'Customers' },
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

  // Continuous numbering across all sections (№01 … №06)
  let counter = 0;

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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.logo}>
          <Link href="/admin" className={styles.logoLink}>
            <span className={styles.logoText}>
              Tech<em>HH</em>
            </span>
            <span className={styles.logoAdmin}>Atelier · Admin</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {NAV.map((section) => (
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.links.map((link) => {
                counter += 1;
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    onClick={() => {
                      if (window.innerWidth <= 1024) onToggle();
                    }}
                    data-cursor-text={link.label.slice(0, 8)}
                  >
                    <span className={styles.navNum}>
                      №{String(counter).padStart(2, '0')}
                    </span>
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
            data-cursor-text="Storefront"
          >
            → View storefront
          </Link>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            data-cursor-text="Out"
          >
            ← Sign out
          </button>
          <span className={styles.footerWordmark} aria-hidden="true">
            Tec<em>hH</em>H
          </span>
        </div>
      </aside>
    </>
  );
}
