import { Suspense } from "react";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.card}>
            <div className={styles.header}>
              <h1 className={styles.title}>Sign in</h1>
              <p className={styles.subtitle}>Loading…</p>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
