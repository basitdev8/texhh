'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { useAuth } from '@/context/AuthContext';
import styles from './layout.module.css';

const SECTION_LABEL: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/products/new': 'New product',
  '/admin/orders': 'Orders',
  '/admin/categories': 'Categories',
  '/admin/pc-components': 'PC components',
  '/admin/customers': 'Customers',
};

function getSectionLabel(pathname: string): string {
  if (SECTION_LABEL[pathname]) return SECTION_LABEL[pathname];
  if (pathname.startsWith('/admin/products/')) return 'Edit product';
  if (pathname.startsWith('/admin/orders/')) return 'Order detail';
  return 'Atelier';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState<string>('');
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const update = () => {
      setNow(
        new Date().toLocaleString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) {
    return (
      <div
        className={styles.layoutWrapper}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'var(--text-2xl)',
          }}
        >
          Loading the atelier…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open sidebar"
              data-cursor-text="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className={styles.topBreadcrumb}>
              <span>TechHH · Atelier</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span className={styles.topBreadcrumbAccent}>
                {getSectionLabel(pathname)}
              </span>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <span className={styles.topMeta}>
              <span className={styles.topMetaDot} />
              Live · {now}
            </span>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className={styles.adminMeta}>
                <span className={styles.adminName}>{user?.name || 'Admin'}</span>
                <span className={styles.adminRole}>Atelier · Curator</span>
              </div>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
