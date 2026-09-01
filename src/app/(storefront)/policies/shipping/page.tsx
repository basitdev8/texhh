import type { Metadata } from "next";
import PolicyLayout, { Todo } from "../PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Dispatch times, delivery estimates, shipping charges, and what happens if a parcel is damaged or lost.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      eyebrow="Studio / Shipping"
      title="Shipping policy"
      updated="23 August 2026"
    >
      <h2>Where we ship</h2>
      <p>
        We ship across India only. We do not currently ship internationally. All prices are
        in Indian Rupees and include GST.
      </p>

      <h2>Shipping charges</h2>
      <ul>
        <li>
          Orders of <strong>₹5,000 or more</strong>: free shipping.
        </li>
        <li>
          Orders below ₹5,000: a flat <strong>₹99</strong> shipping charge, shown at checkout
          before payment.
        </li>
      </ul>
      <p>
        The charge that applies to your order is always displayed in the order summary before
        you pay. If we change these rates, the rate shown at checkout is the rate you pay.
      </p>

      <h2>Dispatch and delivery times</h2>
      <ul>
        <li>
          <strong>Dispatch:</strong> within 1–2 business days of a confirmed order.
        </li>
        <li>
          <strong>Delivery:</strong> typically 3–7 business days after dispatch, depending on
          your location.
        </li>
      </ul>
      <p>
        Business days exclude Sundays and public holidays. Orders placed on a holiday are
        processed on the next business day. Remote PIN codes can take longer, and we will tell
        you if we know a delay is likely.
      </p>

      <h2>Tracking</h2>
      <p>
        Once your parcel leaves us, the tracking number and carrier appear on your order page
        under <a href="/account">your account</a>. Courier partners we use include{" "}
        <Todo>courier partners, e.g. Delhivery, Blue Dart, DTDC</Todo>.
      </p>

      <h2>Delivery attempts</h2>
      <p>
        Couriers usually attempt delivery up to three times. If nobody is available, the parcel
        returns to us and we will contact you to arrange a re-dispatch. A re-dispatch may carry
        the shipping charge again.
      </p>

      <h2>Damaged or missing parcels</h2>
      <p>
        Inspect the parcel before accepting it. If the packaging is visibly damaged or opened,
        refuse the delivery and tell us the same day. If you discover damage after opening,
        contact us within <Todo>damage reporting window, e.g. 48 hours</Todo> of delivery with
        photographs of the item and the packaging, and we will arrange a replacement or refund
        under our <a href="/policies/refunds">Refund &amp; Cancellation Policy</a>.
      </p>

      <h2>Wrong address</h2>
      <p>
        We ship to the address entered at checkout. Tell us before dispatch if it needs
        changing — after dispatch we cannot redirect a parcel, and a delivery to a wrong
        address supplied by you is not refundable.
      </p>

      <h2>Questions</h2>
      <p>
        Shipping questions go to our <a href="/policies/contact">contact page</a>.
      </p>
    </PolicyLayout>
  );
}
