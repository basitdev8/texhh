import type { Metadata } from "next";
import PolicyLayout, { Todo } from "../PolicyLayout";

export const metadata: Metadata = {
  title: "Terms of Service — TechChasers",
  description:
    "The terms that govern buying from TechChasers: orders, pricing, payment, delivery, and liability.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      eyebrow="Studio / Terms"
      title="Terms of service"
      updated="23 August 2026"
    >
      <p>
        These terms govern your use of this website and any order you place on it. The site is
        operated by <Todo>registered business/legal entity name</Todo> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;),
        registered at <Todo>registered business address</Todo>, GSTIN{" "}
        <Todo>GST identification number</Todo>. By placing an order you accept these terms.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You need an account to place an order, and you must be able to enter a binding contract
        under Indian law. Keep your password to yourself — you are responsible for activity
        under your account. Tell us immediately if you think someone else has access to it.
      </p>

      <h2>Products and availability</h2>
      <p>
        We try to describe and photograph products accurately, but specifications come from
        manufacturers and can change without notice, and screen colours vary. Stock shown on the
        site is our best current figure; if an item sells out between your order and our
        confirmation, we will tell you and refund you in full.
      </p>

      <h2>Prices and payment</h2>
      <ul>
        <li>All prices are in Indian Rupees and include GST.</li>
        <li>
          Shipping is charged separately where it applies, and is always shown before you pay —
          see the <a href="/policies/shipping">shipping policy</a>.
        </li>
        <li>
          We may correct an obvious pricing error even after an order is placed. If a price was
          wrong, we will contact you to confirm or cancel the order rather than charge the wrong
          amount.
        </li>
        <li>
          Online payments are processed by Razorpay. We do not receive or store your card
          details.
        </li>
      </ul>

      <h2>Orders</h2>
      <p>
        Your order is an offer to buy. A contract forms when we confirm the order. We may
        decline or cancel an order — with a full refund — where the item is unavailable, the
        price or description was wrong, we cannot deliver to the address, or we suspect fraud or
        resale in breach of these terms.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery timelines are estimates, not guarantees, and are set out in the{" "}
        <a href="/policies/shipping">shipping policy</a>. Risk in the goods passes to you on
        delivery.
      </p>

      <h2>Cancellations, returns and refunds</h2>
      <p>
        Governed by our <a href="/policies/refunds">refund and cancellation policy</a>, which
        forms part of these terms.
      </p>

      <h2>Warranties</h2>
      <p>
        Products carry the manufacturer&rsquo;s warranty where one applies. We are not the
        manufacturer, and warranty service is provided through the brand&rsquo;s authorised
        network.
        Nothing here removes rights you have under the Consumer Protection Act, 2019.
      </p>

      <h2>Custom PC builds</h2>
      <p>
        The PC builder lets you assemble a parts list. Compatibility between the parts you
        choose is your responsibility unless we have confirmed a configuration in writing. Parts
        are sold individually unless an assembly service is expressly purchased.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attempt to disrupt the site, scrape it at scale, resell our content, or use it
        for anything unlawful. We may suspend accounts that do.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The site design, text, and layout belong to us. Brand names, logos, and product images
        belong to their respective owners and are used to identify the products we sell.
      </p>

      <h2>Liability</h2>
      <p>
        We are not liable for indirect or consequential loss — lost profits, lost data, or loss
        of use. Where liability cannot be excluded, it is limited to the amount you paid for the
        order in question. Nothing in these terms limits liability for fraud or for anything
        that cannot lawfully be limited.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts at{" "}
        <Todo>city of jurisdiction</Todo> have exclusive jurisdiction over any dispute.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version in force is the one published here when you place
        your order.
      </p>

      <h2>Contact</h2>
      <p>
        Reach us through the <a href="/policies/contact">contact page</a>.
      </p>
    </PolicyLayout>
  );
}
