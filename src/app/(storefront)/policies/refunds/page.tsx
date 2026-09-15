import type { Metadata } from "next";
import PolicyLayout, { Todo } from "../PolicyLayout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How to cancel an order, when a return is accepted, and how long a refund takes.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund &amp; cancellation policy"
      updated="23 August 2026"
    >
      <h2>Cancelling an order</h2>
      <p>
        You can cancel any order that has not yet been dispatched. Email or call us with your
        order number and we will cancel it and refund any payment already taken. Details are on
        the <a href="/policies/contact">contact page</a>.
      </p>
      <p>
        Once an order has been dispatched it cannot be cancelled — refuse the delivery or
        return the item under the returns section below.
      </p>

      <h2>Returns</h2>
      <p>
        We accept returns within <Todo>return window, e.g. 7 days</Todo> of delivery, provided
        the item is:
      </p>
      <ul>
        <li>unused and in the condition you received it</li>
        <li>in its original packaging with all accessories, manuals, and free gifts</li>
        <li>accompanied by the invoice or order number</li>
      </ul>

      <h3>What we cannot accept back</h3>
      <ul>
        <li>items damaged by misuse, accident, or unauthorised repair</li>
        <li>products with a broken or removed manufacturer seal, where sealed on arrival</li>
        <li>
          custom PC builds and assembled configurations, unless the item arrived faulty or was
          not what you ordered
        </li>
        <li>items missing serial numbers or original packaging</li>
      </ul>

      <h2>Faulty, damaged, or wrong items</h2>
      <p>
        If an item arrives damaged, faulty, or is not what you ordered, tell us within{" "}
        <Todo>damage reporting window, e.g. 48 hours</Todo> of delivery with photographs. We
        will arrange a replacement or a full refund including any shipping you paid. You pay
        nothing to return an item that was our error.
      </p>

      <h2>Return shipping</h2>
      <p>
        For a change-of-mind return, return shipping is{" "}
        <Todo>who pays return shipping on a change-of-mind return</Todo>. For a faulty or
        incorrect item, we cover it.
      </p>

      <h2>Refunds</h2>
      <ul>
        <li>
          Refunds are issued to the original payment method. We cannot refund to a different
          account or card.
        </li>
        <li>
          Online payments: the refund is initiated within{" "}
          <Todo>refund initiation time, e.g. 3 business days</Todo> of us approving the return,
          and typically reaches your account in 5–7 business days depending on your bank.
        </li>
        <li>
          Cash on Delivery orders: refunded by bank transfer to an account you nominate, on the
          same timeline.
        </li>
        <li>
          Where a return is approved but shipping was charged and not our error, the shipping
          charge is not refunded.
        </li>
      </ul>

      <h2>Warranty claims</h2>
      <p>
        Manufacturer warranties are honoured by the brand&rsquo;s service network. We will help you
        raise a claim, but repairs and replacements under warranty are handled by the
        manufacturer and are separate from this returns policy. Warranty period:{" "}
        <Todo>warranty handling terms</Todo>.
      </p>

      <h2>How to start</h2>
      <p>
        Email us the order number and what went wrong, with photographs where relevant. See the{" "}
        <a href="/policies/contact">contact page</a>. We reply within{" "}
        <Todo>support response time, e.g. 1 business day</Todo>.
      </p>
    </PolicyLayout>
  );
}
