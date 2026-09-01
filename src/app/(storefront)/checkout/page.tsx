"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useCartValidation } from "@/hooks/useCartValidation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import LoadingState from "@/components/ui/LoadingState";
import StatusNotice from "@/components/ui/StatusNotice";
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
  const { changes, blockers, totals, settings, revalidate } = useCartValidation();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  // Mobile shows the summary as a collapsed disclosure above the form; desktop
  // ignores this flag and always renders the full card.
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [priceNoticeSeen, setPriceNoticeSeen] = useState(false);

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

  const shippingCost =
    totals?.shippingCost ??
    (subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingRate);
  const tax =
    totals?.tax ??
    Number(((subtotal * settings.gstRate) / (100 + settings.gstRate)).toFixed(2));
  const total = totals?.totalAmount ?? subtotal + shippingCost;

  const validateDelivery = (): boolean => {
    const errs: Record<string, string> = {};
    if (!shipping.fullName.trim()) errs.fullName = "Full name is required";
    if (!shipping.street.trim()) errs.street = "Street address is required";
    if (!shipping.city.trim()) errs.city = "City is required";
    if (!shipping.state.trim()) errs.state = "State is required";
    if (!shipping.zipCode.trim()) errs.zipCode = "Postal code is required";
    const phoneClean = shipping.phone.replace(/\D/g, "");
    if (!phoneClean || phoneClean.length < 10) {
      errs.phone = "Valid 10-digit mobile number required";
    }
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
      itemType: i.itemType ?? "product",
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

  const handleRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setFormError("Could not load payment gateway. Please check your connection and retry.");
      setSubmitting(false);
      return;
    }

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
      await revalidate();
      setPriceNoticeSeen(false);
      return;
    }

    const { orderId, razorpayOrderId, amount, currency, keyId } = data.data;

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: "TechChasers",
      description: "Order Payment",
      order_id: razorpayOrderId,
      prefill: {
        name: shipping.fullName || user?.name,
        email: user?.email,
        contact: shipping.phone,
      },
      theme: { color: "#155EEF" },
      handler: async (response: RazorpayResponse) => {
        try {
          const verifyRes = await fetch("/api/payment/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            clearCart();
            showToast("Payment verified — Order confirmed!", "success");
            router.push(`/account/orders/${orderId}`);
          } else {
            setFormError(verifyData.error || "Payment verification failed. Please contact support.");
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
          showToast("Payment window closed", "info");
        },
      },
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    setFormError("");
    if (!validateDelivery()) {
      setCurrentStep(1);
      return;
    }

    if (blockers.length > 0) {
      setFormError(blockers[0].message);
      return;
    }

    if (paymentMethod === "cash_on_delivery" && total > settings.codMaxOrderAmount) {
      setFormError(
        `Cash on delivery is limited to orders up to ${formatPrice(settings.codMaxOrderAmount)}. Please select online payment.`
      );
      return;
    }

    if (changes.length > 0 && !priceNoticeSeen) {
      setPriceNoticeSeen(true);
      setFormError(
        "Cart pricing was updated from the catalog. Review the updated total and confirm."
      );
      return;
    }

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
        await revalidate();
        setPriceNoticeSeen(false);
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || items.length === 0) {
    return (
      <div className="container" style={{ padding: "var(--space-12) 0" }}>
        <LoadingState label="Preparing checkout" detail="Checking your cart and authentication." />
      </div>
    );
  }

  const codDisabled = paymentMethod === "cash_on_delivery" && total > settings.codMaxOrderAmount;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Step Indicator Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Checkout</h1>
          <nav className={styles.stepper} aria-label="Checkout Progress">
            <button
              type="button"
              className={`${styles.stepBtn} ${currentStep === 1 ? styles.stepBtnActive : currentStep > 1 ? styles.stepBtnDone : ""}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepLabel}>Delivery</span>
            </button>
            <span className={styles.stepSep} aria-hidden="true">/</span>
            <button
              type="button"
              className={`${styles.stepBtn} ${currentStep === 2 ? styles.stepBtnActive : currentStep > 2 ? styles.stepBtnDone : ""}`}
              onClick={() => {
                if (validateDelivery()) setCurrentStep(2);
              }}
            >
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepLabel}>Payment</span>
            </button>
            <span className={styles.stepSep} aria-hidden="true">/</span>
            <button
              type="button"
              className={`${styles.stepBtn} ${currentStep === 3 ? styles.stepBtnActive : ""}`}
              onClick={() => {
                if (validateDelivery()) setCurrentStep(3);
              }}
            >
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepLabel}>Review</span>
            </button>
          </nav>
        </header>

        {formError && (
          <div className={styles.noticeWrap}>
            <StatusNotice variant="error" title="Action required">
              {formError}
            </StatusNotice>
          </div>
        )}

        {blockers.length > 0 && (
          <div className={styles.noticeWrap}>
            <StatusNotice variant="error" title="Cart conflicts detected">
              {blockers.map((b) => (
                <div key={`${b.product}-${b.kind}`}>{b.message}</div>
              ))}
              <Link href="/cart" className={styles.cartLink}>
                Return to cart to resolve →
              </Link>
            </StatusNotice>
          </div>
        )}

        {/* Checkout 2-Column Layout */}
        <div className={styles.layout}>
          {/* Main Interactive Form Steps */}
          <div className={styles.stepsCol}>
            {/* ── STEP 1: Delivery Address ────────────────────── */}
            {currentStep === 1 && (
              <section className={styles.stepSection} aria-labelledby="step-1-title">
                <h2 id="step-1-title" className={styles.stepTitle}>
                  1. Delivery Information
                </h2>

                <div className={styles.formGrid}>
                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="input-fullName" className={styles.label}>
                      Full Name *
                    </label>
                    <input
                      id="input-fullName"
                      name="fullName"
                      value={shipping.fullName}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                      placeholder="Receiver's full name"
                      required
                    />
                    {errors.fullName && (
                      <span className={styles.fieldError}>{errors.fullName}</span>
                    )}
                  </div>

                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="input-street" className={styles.label}>
                      Street Address &amp; Flat / House No. *
                    </label>
                    <input
                      id="input-street"
                      name="street"
                      value={shipping.street}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.street ? styles.inputError : ""}`}
                      placeholder="Street name, building, apartment"
                      required
                    />
                    {errors.street && (
                      <span className={styles.fieldError}>{errors.street}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="input-city" className={styles.label}>
                      City *
                    </label>
                    <input
                      id="input-city"
                      name="city"
                      value={shipping.city}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.city ? styles.inputError : ""}`}
                      placeholder="City"
                      required
                    />
                    {errors.city && (
                      <span className={styles.fieldError}>{errors.city}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="input-state" className={styles.label}>
                      State *
                    </label>
                    <input
                      id="input-state"
                      name="state"
                      value={shipping.state}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.state ? styles.inputError : ""}`}
                      placeholder="State / Province"
                      required
                    />
                    {errors.state && (
                      <span className={styles.fieldError}>{errors.state}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="input-zipCode" className={styles.label}>
                      Postal Code / PIN *
                    </label>
                    <input
                      id="input-zipCode"
                      name="zipCode"
                      value={shipping.zipCode}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.zipCode ? styles.inputError : ""}`}
                      placeholder="6-digit PIN"
                      required
                    />
                    {errors.zipCode && (
                      <span className={styles.fieldError}>{errors.zipCode}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="input-phone" className={styles.label}>
                      Mobile Number *
                    </label>
                    <input
                      id="input-phone"
                      name="phone"
                      type="tel"
                      value={shipping.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                      placeholder="10-digit mobile number"
                      required
                    />
                    {errors.phone && (
                      <span className={styles.fieldError}>{errors.phone}</span>
                    )}
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button
                    type="button"
                    className={styles.nextStepBtn}
                    onClick={() => {
                      if (validateDelivery()) setCurrentStep(2);
                    }}
                    id="checkout-step-1-next"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </section>
            )}

            {/* ── STEP 2: Payment Method ──────────────────────── */}
            {currentStep === 2 && (
              <section className={styles.stepSection} aria-labelledby="step-2-title">
                <h2 id="step-2-title" className={styles.stepTitle}>
                  2. Select Payment Method
                </h2>

                <div className={styles.paymentOptions}>
                  {/* Razorpay Online */}
                  <label
                    className={`${styles.paymentOption} ${paymentMethod === "razorpay" ? styles.paymentOptionActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className={styles.optionContent}>
                      <span className={styles.optionTitle}>Online Payment (Razorpay)</span>
                      <span className={styles.optionDesc}>
                        Cards, UPI, Netbanking, and Wallets. Verified 256-bit encrypted transaction.
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  {settings.codEnabled && (
                    <label
                      className={`${styles.paymentOption} ${paymentMethod === "cash_on_delivery" ? styles.paymentOptionActive : ""} ${codDisabled ? styles.optionDisabled : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={paymentMethod === "cash_on_delivery"}
                        disabled={total > settings.codMaxOrderAmount}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className={styles.optionContent}>
                        <span className={styles.optionTitle}>Cash on Delivery (COD)</span>
                        <span className={styles.optionDesc}>
                          {total > settings.codMaxOrderAmount
                            ? `Unavailable for orders over ${formatPrice(settings.codMaxOrderAmount)}. Please choose Online Payment.`
                            : `Pay in cash when order is delivered. Available up to ${formatPrice(settings.codMaxOrderAmount)}.`}
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Bank Transfer */}
                  {settings.bankTransferEnabled && (
                    <label
                      className={`${styles.paymentOption} ${paymentMethod === "bank_transfer" ? styles.paymentOptionActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className={styles.optionContent}>
                        <span className={styles.optionTitle}>Direct Bank Transfer (NEFT/IMPS)</span>
                        <span className={styles.optionDesc}>
                          Order will be processed once wire transfer is verified. Bank details will be shown on confirmation.
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                <div className={styles.notesWrap}>
                  <label htmlFor="input-notes" className={styles.label}>
                    Delivery Instructions / Notes (Optional)
                  </label>
                  <textarea
                    id="input-notes"
                    className={styles.textarea}
                    placeholder="Specific delivery time or landmark instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.stepActions}>
                  <button
                    type="button"
                    className={styles.prevStepBtn}
                    onClick={() => setCurrentStep(1)}
                  >
                    ← Back to Delivery
                  </button>
                  <button
                    type="button"
                    className={styles.nextStepBtn}
                    onClick={() => setCurrentStep(3)}
                    id="checkout-step-2-next"
                  >
                    Review Order →
                  </button>
                </div>
              </section>
            )}

            {/* ── STEP 3: Review & Place Order ─────────────────── */}
            {currentStep === 3 && (
              <section className={styles.stepSection} aria-labelledby="step-3-title">
                <h2 id="step-3-title" className={styles.stepTitle}>
                  3. Review &amp; Place Order
                </h2>

                <div className={styles.reviewBlocks}>
                  {/* Delivery summary block */}
                  <div className={styles.reviewBlock}>
                    <div className={styles.reviewBlockHeader}>
                      <h3 className={styles.reviewBlockTitle}>Shipping Address</h3>
                      <button
                        type="button"
                        className={styles.editStepBtn}
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit
                      </button>
                    </div>
                    <p className={styles.reviewAddressText}>
                      <strong>{shipping.fullName}</strong>
                      <br />
                      {shipping.street}, {shipping.city}, {shipping.state} – {shipping.zipCode}
                      <br />
                      Phone: {shipping.phone}
                    </p>
                  </div>

                  {/* Payment summary block */}
                  <div className={styles.reviewBlock}>
                    <div className={styles.reviewBlockHeader}>
                      <h3 className={styles.reviewBlockTitle}>Payment Method</h3>
                      <button
                        type="button"
                        className={styles.editStepBtn}
                        onClick={() => setCurrentStep(2)}
                      >
                        Edit
                      </button>
                    </div>
                    <p className={styles.reviewPaymentText}>
                      {paymentMethod === "razorpay" && "Online Payment via Razorpay (UPI, Card, Netbanking)"}
                      {paymentMethod === "cash_on_delivery" && "Cash on Delivery (COD)"}
                      {paymentMethod === "bank_transfer" && "Direct Bank Transfer (NEFT / IMPS)"}
                    </p>
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button
                    type="button"
                    className={styles.prevStepBtn}
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Back to Payment
                  </button>
                  <button
                    type="button"
                    className={styles.placeOrderBtn}
                    onClick={handlePlaceOrder}
                    disabled={submitting || blockers.length > 0}
                    aria-busy={submitting}
                    id="checkout-place-order"
                  >
                    {submitting
                      ? "Processing…"
                      : paymentMethod === "razorpay"
                      ? `Pay ${formatPrice(total)}`
                      : `Place Order · ${formatPrice(total)}`}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <aside className={styles.summaryCol} aria-label="Order summary breakdown">
            <div className={styles.summaryCard}>
              <div className={styles.summaryHead}>
                <h2 className={styles.summaryHeading}>Order Summary</h2>
                <button
                  type="button"
                  className={styles.summaryToggle}
                  onClick={() => setSummaryOpen((open) => !open)}
                  aria-expanded={summaryOpen}
                  aria-controls="checkout-summary-body"
                >
                  <span className={styles.summaryToggleTotal}>{formatPrice(total)}</span>
                  <span className={styles.summaryToggleAction}>
                    {summaryOpen ? "Hide" : "Show"}
                  </span>
                  <svg
                    className={`${styles.summaryChevron} ${summaryOpen ? styles.summaryChevronOpen : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div
                id="checkout-summary-body"
                className={`${styles.summaryBody} ${summaryOpen ? "" : styles.summaryBodyCollapsed}`}
              >
              <div className={styles.itemsReviewList}>
                {items.map((item) => (
                  <div key={item.productId} className={styles.summaryItemRow}>
                    <div className={styles.summaryItemInfo}>
                      <span className={styles.summaryItemName}>
                        {item.quantity} × {item.name}
                      </span>
                      {item.itemType === "component" && (
                        <span className={styles.componentTag}>Component</span>
                      )}
                    </div>
                    <span className={styles.summaryItemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.breakdownRows}>
                <div className={styles.breakdownRow}>
                  <span>Subtotal</span>
                  <span className={styles.num}>{formatPrice(subtotal)}</span>
                </div>

                <div className={styles.breakdownRow}>
                  <span>Shipping</span>
                  <span className={styles.num}>
                    {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                  </span>
                </div>

                <div className={styles.breakdownRow}>
                  <span>Included GST ({settings.gstRate}%)</span>
                  <span className={styles.num}>{formatPrice(tax)}</span>
                </div>

                <div className={`${styles.breakdownRow} ${styles.totalBreakdownRow}`}>
                  <span>Total Amount</span>
                  <span className={styles.totalNum}>{formatPrice(total)}</span>
                </div>
              </div>

              <div className={styles.assuranceWrap}>
                <div className={styles.assuranceLine}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Encrypted 256-bit payment transaction</span>
                </div>
                <div className={styles.assuranceLine}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Official manufacturer warranty coverage</span>
                </div>
              </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
