import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className={styles.inner}>
        <div className={styles.grid}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/logo.svg"
              alt="TechChasers"
              width={1316}
              height={276}
              className={styles.brandImage}
              unoptimized
            />
          </Link>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Shop</h2>
            <nav className={styles.links} aria-label="Shop links">
              <Link href="/products" className={styles.link}>
                Products
              </Link>
              <Link href="/pc-builder" className={styles.link}>
                PC Builder
              </Link>
              <Link href="/cart" className={styles.link}>
                Cart
              </Link>
            </nav>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Orders and support</h2>
            <nav className={styles.links} aria-label="Orders and support links">
              <Link href="/account" className={styles.link}>
                My account
              </Link>
              <Link href="/policies/shipping" className={styles.link}>
                Shipping
              </Link>
              <Link href="/policies/refunds" className={styles.link}>
                Returns and refunds
              </Link>
              <Link href="/policies/contact" className={styles.link}>
                Contact support
              </Link>
            </nav>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TechChasers
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/policies/privacy" className={styles.bottomLink}>Privacy</Link>
            <Link href="/policies/terms" className={styles.bottomLink}>Terms</Link>
            <Link href="/policies/shipping" className={styles.bottomLink}>Shipping</Link>
            <Link href="/policies/refunds" className={styles.bottomLink}>Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
