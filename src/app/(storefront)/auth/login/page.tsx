import { Suspense } from "react";
import LoginForm from "./LoginForm";
import LoadingState from "@/components/ui/LoadingState";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.card}>
            <LoadingState label="Opening sign in" compact />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
