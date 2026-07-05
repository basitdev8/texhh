"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import styles from "./page.module.css";

interface ShippingForm {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Minimal shape of the Razorpay checkout constructor injected by their script.
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const { showToast } = useToast();

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && !shipping.fullName) {
      setShipping((prev) => ({ ...prev, fullName: user.name }));
    }
  }, [user, shipping.fullName]);

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      router.push("/cart");
    }
  }, [items.length, router, submitting]);

  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal + shippingCost + tax;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!shipping.fullName.trim()) errs.fullName = "Full name is required";
    if (!shipping.street.trim()) errs.street = "Street is required";
    if (!shipping.city.trim()) errs.city = "City is required";
    if (!shipping.state.trim()) errs.state = "State is required";
    if (!shipping.zipCode.trim()) errs.zipCode = "Zip code is required";
    if (!shipping.phone.trim()) errs.phone = "Phone is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const orderItemsPayload = () =>
    items.map((i) => ({
      product: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

  const handleRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setFormError(
        "Couldn't load the payment gateway. Check your connection and try again."
      );
      setSubmitting(false);
      return;
    }

    // 1. Create the Razorpay order (and a pending order) on the server.
    const res = await fetch("/api/payment/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderItemsPayload(),
        shippingAddress: shipping,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setFormError(data.error || "Failed to initiate payment");
      setSubmitting(false);
      return;
    }

    const { orderId, razorpayOrderId, amount, currency, keyId } = data.data;

    // 2. Open Razorpay checkout.
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: "TechHH",
      description: "Order payment",
      order_id: razorpayOrderId,
      prefill: {
        name: shipping.fullName || user?.name,
        email: user?.email,
        contact: shipping.phone,
      },
      theme: { color: "#0E7C7B" },
      handler: async (response: RazorpayResponse) => {
        // 3. Verify the signature server-side before confirming the order.
        try {
          const verifyRes = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            clearCart();
            showToast("Payment successful — order confirmed!", "success");
            router.push(`/account/orders/${orderId}`);
          } else {
            setFormError(
              verifyData.error || "Payment verification failed. Contact support."
            );
            setSubmitting(false);
          }
        } catch {
          setFormError("Payment verification failed. Please contact support.");
          setSubmitting(false);
        }
      },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          showToast("Payment cancelled", "error");
        },
      },
    });
    rzp.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);

    if (paymentMethod === "razorpay") {
      try {
        await handleRazorpayPayment();
      } catch {
        setFormError("Network error. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    // Cash on delivery / bank transfer — record the order directly.
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItemsPayload(),
          shippingAddress: shipping,
          paymentMethod,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        clearCart();
        showToast("Order placed successfully!", "success");
        router.push(`/account/orders/${data.data._id}`);
      } else {
        setFormError(data.error || "Failed to place order");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || items.length === 0) {
    return (
      <div className="container">
        <div style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.layout}>
            <div className={styles.form}>
              {formError && <div className={styles.formError}>{formError}</div>}

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionNumber}>1</span>
                  Shipping Address
                </h2>
                <div className={styles.grid}>
                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      name="fullName"
                      value={shipping.fullName}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                    />
                    {errors.fullName && (
                      <span className={styles.error}>{errors.fullName}</span>
                    )}
                  </div>
                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Street Address</label>
                    <input
                      name="street"
                      value={shipping.street}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.street ? styles.inputError : ""}`}
                    />
                    {errors.street && (
                      <span className={styles.error}>{errors.street}</span>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>City</label>
                    <input
                      name="city"
                      value={shipping.city}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.city ? styles.inputError : ""}`}
                    />
                    {errors.city && (
                      <span className={styles.error}>{errors.city}</span>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>State / Region</label>
                    <input
                      name="state"
                      value={shipping.state}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.state ? styles.inputError : ""}`}
                    />
                    {errors.state && (
                      <span className={styles.error}>{errors.state}</span>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Zip Code</label>
                    <input
                      name="zipCode"
                      value={shipping.zipCode}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.zipCode ? styles.inputError : ""}`}
                    />
                    {errors.zipCode && (
                      <span className={styles.error}>{errors.zipCode}</span>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Country</label>
                    <input
                      name="country"
                      value={shipping.country}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Phone</label>
                    <input
                      name="phone"
                      value={shipping.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                    />
                    {errors.phone && (
                      <span className={styles.error}>{errors.phone}</span>
                    )}
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionNumber}>2</span>
                  Payment Method
                </h2>
                <div className={styles.radioGroup}>
                  {[
                    {
                      value: "razorpay",
                      title: "Pay Online (Razorpay)",
                      desc: "Cards, UPI, netbanking & wallets — secure checkout.",
                    },
                    {
                      value: "cash_on_delivery",
                      title: "Cash on Delivery",
                      desc: "Pay when your order arrives at your doorstep.",
                    },
                    {
                      value: "bank_transfer",
                      title: "Bank Transfer",
                      desc: "We will send banking details after order placement.",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`${styles.radio} ${paymentMethod === opt.value ? styles.radioActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className={styles.radioBody}>
                        <span className={styles.radioTitle}>{opt.title}</span>
                        <span className={styles.radioDesc}>{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionNumber}>3</span>
                  Additional Notes
                </h2>
                <textarea
                  className={styles.textarea}
                  placeholder="Anything we should know? (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
            </div>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.productId} className={styles.summaryItem}>
                    <span className={styles.summaryItemName}>
                      {item.quantity} × {item.name}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.row}>
                <span>Shipping</span>
                <span>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className={styles.row}>
                <span>Tax (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className={`${styles.row} ${styles.totalRow}`}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                type="submit"
                className={styles.placeOrderBtn}
                disabled={submitting}
              >
                {submitting
                  ? "Processing…"
                  : paymentMethod === "razorpay"
                    ? `Pay ${formatPrice(total)}`
                    : "Place Order"}
              </button>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
