import type { Metadata } from "next";
import PolicyLayout, { Todo, policyStyles as styles } from "../PolicyLayout";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the TechChasers team about an order, a return, or a product question.",
};

export default function ContactPage() {
  return (
    <PolicyLayout title="Contact us" updated="23 August 2026">
      <p>
        Questions about an order, a return, or a product are all welcome. Quote your order
        number (it looks like <strong>TH-XXXXX-XXXX</strong>) and we can answer faster.
      </p>

      <div className={styles.contactGrid}>
        <div className={styles.contactCard}>
          <span className={styles.contactLabel}>Email</span>
          <span className={styles.contactValue}>
            <Todo>support email address</Todo>
          </span>
        </div>
        <div className={styles.contactCard}>
          <span className={styles.contactLabel}>Phone</span>
          <span className={styles.contactValue}>
            <Todo>support phone number</Todo>
          </span>
        </div>
        <div className={styles.contactCard}>
          <span className={styles.contactLabel}>Hours</span>
          <span className={styles.contactValue}>
            <Todo>support hours, e.g. Mon–Sat, 10:00–19:00 IST</Todo>
          </span>
        </div>
        <div className={styles.contactCard}>
          <span className={styles.contactLabel}>Registered address</span>
          <span className={styles.contactValue}>
            <Todo>registered business name and full postal address</Todo>
          </span>
        </div>
      </div>

      <h2>Order support</h2>
      <p>
        For anything about a specific order — delivery timing, a change of address, a
        cancellation, or a return — email us with the order number. Cancellations and returns
        follow our{" "}
        <a href="/policies/refunds">Refund &amp; Cancellation Policy</a>.
      </p>

      <h2>Business details</h2>
      <p>
        Legal entity: <Todo>registered business/legal entity name</Todo>
        <br />
        GSTIN: <Todo>GST identification number</Todo>
      </p>
    </PolicyLayout>
  );
}
