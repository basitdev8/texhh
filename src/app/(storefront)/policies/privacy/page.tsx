import type { Metadata } from "next";
import PolicyLayout, { Todo } from "../PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal data TechChasers collects, why, who it is shared with, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy policy"
      updated="23 August 2026"
    >
      <p>
        This policy explains what we collect when you use this site, why we collect it, and what
        you can ask us to do with it. The data controller is{" "}
        <Todo>registered business/legal entity name</Todo>, contactable at{" "}
        <Todo>support email address</Todo>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, and a securely hashed
          password. We never store your password itself.
        </li>
        <li>
          <strong>Order details:</strong> shipping address, phone number, the items you bought,
          and the amount paid.
        </li>
        <li>
          <strong>Payment data:</strong> handled entirely by Razorpay. We receive a payment
          reference and its status — never your card number, CVV, or UPI credentials.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address for rate limiting and abuse
          prevention, and basic request logs.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To take, process, and deliver your orders, and to handle returns and refunds</li>
        <li>To let you sign in and see your order history</li>
        <li>To respond when you contact support</li>
        <li>To keep the site secure and prevent fraud</li>
        <li>To meet tax and accounting obligations</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We set one essential cookie to keep you signed in. It is HTTP-only, so scripts cannot
        read it, and it expires after seven days. Your cart is stored in your own browser, not on
        our servers. We do not use advertising or tracking cookies.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>Razorpay</strong> — to process payments and refunds
        </li>
        <li>
          <strong>Courier partners</strong> — the name, address, and phone number needed to
          deliver your parcel
        </li>
        <li>
          <strong>MongoDB Atlas and Vercel</strong> — hosting and database infrastructure
        </li>
        <li>
          <strong>Cloudinary</strong> — product image hosting (no customer data)
        </li>
        <li>Government authorities, where the law requires it</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>How long we keep it</h2>
      <p>
        Order records are kept for <Todo>retention period, e.g. 8 years</Todo> to satisfy tax and
        accounting requirements. Account data is kept while your account is open. Request
        letters and support emails are kept for{" "}
        <Todo>support correspondence retention period</Todo>.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed with bcrypt, sessions use signed HTTP-only cookies, the site is
        served over HTTPS, and payment signatures are verified server-side. No system is
        perfect, but we take reasonable measures appropriate to the data we hold.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to show you the data we hold about you, correct it, or delete it. Some
        data must be retained for tax purposes even after an account is closed. Write to{" "}
        <Todo>support email address</Todo> and we will respond within{" "}
        <Todo>data request response time, e.g. 30 days</Todo>.
      </p>

      <h2>Children</h2>
      <p>
        This site is not intended for children under 18, and we do not knowingly collect their
        data.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially we will update the date at the top of this page.
      </p>
    </PolicyLayout>
  );
}
