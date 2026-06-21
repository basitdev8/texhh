"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className={styles.inner}>
        <div className={styles.topMeta}>
          <span className={styles.topMetaLabel}>
            TechHH · Edition 04 · 2026
          </span>
          <span className={styles.topMetaItalic}>
            <em>Stay close.</em> Subscribe below.
          </span>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            <span className={styles.colTitle}>The Atelier</span>
            <p className={styles.aboutText}>
              TechHH is a small studio obsessed with how technology{" "}
              <em>feels</em>. We photograph it, vet it, and ship it like
              an object should be — with quiet care, never on the cheap.
            </p>
            <div className={styles.socials}>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Facebook"
                data-cursor-text="FB"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Twitter"
                data-cursor-text="X"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="#"
                className={styles.socialIcon}
                aria-label="Instagram"
                data-cursor-text="IG"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Shop</span>
            <nav className={styles.links}>
              <Link href="/products" className={styles.link}>
                All Products
              </Link>
              <Link
                href="/products?category=laptops"
                className={styles.link}
              >
                Laptops
              </Link>
              <Link
                href="/products?category=audio"
                className={styles.link}
              >
                Audio
              </Link>
              <Link
                href="/products?category=monitors"
                className={styles.link}
              >
                Monitors
              </Link>
              <Link href="/pc-builder" className={styles.link}>
                PC Builder
              </Link>
            </nav>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Studio</span>
            <nav className={styles.links}>
              <Link href="#" className={styles.link}>Contact</Link>
              <Link href="#" className={styles.link}>FAQ</Link>
              <Link href="#" className={styles.link}>Shipping</Link>
              <Link href="#" className={styles.link}>Returns</Link>
              <Link href="#" className={styles.link}>Warranty</Link>
            </nav>
          </div>

          <div className={styles.column}>
            <span className={styles.colTitle}>Newsletter</span>
            <p className={styles.aboutText}>
              One letter a month. New pieces, studio dispatches, and the
              occasional <em>secret drop</em>. Unsubscribe anytime.
            </p>
            <form
              className={styles.newsletterForm}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email"
                className={styles.newsletterInput}
                id="footer-newsletter-input"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className={styles.newsletterBtn}
                id="footer-newsletter-btn"
                aria-label="Subscribe"
                data-cursor-text="Send"
              >
                →
              </button>
            </form>
          </div>
        </div>

        {/* Huge wordmark — the editorial signature */}
        <div className={styles.wordmark} aria-hidden="true">
          Tec<em>hH</em>H
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TechHH — Curated tech for the
            considered.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="#" className={styles.bottomLink}>Privacy</Link>
            <Link href="#" className={styles.bottomLink}>Terms</Link>
            <Link href="#" className={styles.bottomLink}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
