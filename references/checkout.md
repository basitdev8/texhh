You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
checkout-block.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardHeader,
CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import {
CreditCard,
Truck,
Shield,
MapPin,
User,
Mail,
Phone,
Lock,
Calendar,
ShoppingBag,
Check,
ChevronLeft,
Percent,
X,
Tag,
Wallet,
Smartphone,
Building2,
Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";

interface OrderItem {
id: string;
name: string;
price: number;
originalPrice?: number;
image: string;
quantity: number;
discount?: number;
}

interface CheckoutSummary {
subtotal: number;
discount: number;
shipping: number;
tax: number;
total: number;
}

interface ShippingAddress {
firstName: string;
lastName: string;
email: string;
phone: string;
address: string;
city: string;
state: string;
zipCode: string;
country: string;
}

interface PaymentMethod {
cardNumber: string;
expiryMonth: string;
expiryYear: string;
cvv: string;
nameOnCard: string;
}

export default function Checkout() {
const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [currentStep, setCurrentStep] = useState<number>(1);
const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
});
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  nameOnCard: "",
});
const [selectedPaymentType, setSelectedPaymentType] =
  useState<string>("card");
const [sameAsShipping, setSameAsShipping] = useState<boolean>(true);
const [savePaymentMethod, setSavePaymentMethod] = useState<boolean>(false);
const [appliedPromo, setAppliedPromo] = useState<string>("SAVE10");
const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

const sampleOrderItems: OrderItem[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    price: 89.99,
    originalPrice: 129.99,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1165&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quantity: 2,
    discount: 31,
  },
  {
    id: "2",
    name: "Minimalist Desk Lamp",
    price: 45.99,
    image:
      "https://images.unsplash.com/photo-1617363020293-62faac14783d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quantity: 1,
  },
  {
    id: "3",
    name: "Organic Coffee Beans",
    price: 24.99,
    originalPrice: 29.99,
    image:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
    quantity: 3,
    discount: 17,
  },
];

const shippingMethods = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 9.99,
    time: "5-7 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 19.99,
    time: "2-3 business days",
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    price: 39.99,
    time: "Next business day",
  },
];

const [selectedShipping, setSelectedShipping] = useState("standard");

useEffect(() => {
  const loadCheckout = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setOrderItems(sampleOrderItems);
    setIsLoading(false);
  };

  loadCheckout();
}, []);

const calculateSummary = (): CheckoutSummary => {
  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = appliedPromo === "SAVE10" ? subtotal * 0.1 : 0;
  const shipping =
    selectedShipping === "standard"
      ? 9.99
      : selectedShipping === "express"
      ? 19.99
      : 39.99;
  const tax = (subtotal - discount) * 0.08; // 8% tax
  const total = subtotal - discount + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
  };
};

const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
  setShippingAddress((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handlePaymentChange = (field: keyof PaymentMethod, value: string) => {
  setPaymentMethod((prev) => ({
    ...prev,
    [field]: value,
  }));
};
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(
        shippingAddress.firstName &&
        shippingAddress.lastName &&
        shippingAddress.email &&
        shippingAddress.address &&
        shippingAddress.city &&
        shippingAddress.state &&
        shippingAddress.zipCode
      );
    case 2:
      if (selectedPaymentType === "card") {
        return !!(
          paymentMethod.cardNumber &&
          paymentMethod.expiryMonth &&
          paymentMethod.expiryYear &&
          paymentMethod.cvv &&
          paymentMethod.nameOnCard
        );
      }
      // For other payment methods, we just need them to be selected
      return !!selectedPaymentType;
    case 3:
      return agreeToTerms;
    default:
      return false;
  }
};

const nextStep = () => {
  if (validateStep(currentStep)) {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }
};

const prevStep = () => {
  setCurrentStep((prev) => Math.max(prev - 1, 1));
};

const removePromo = () => {
  setAppliedPromo("");
};

const summary = calculateSummary();

const CheckoutSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 flex flex-col gap-6">
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

const OrderSummaryCard = () => (
  <Card className="flex flex-col gap-5">
    <CardHeader>
      <h3 className="font-semibold flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" />
        Order Summary
      </h3>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {/* Order Items */}
      <div className="flex flex-col gap-4">
        {orderItems.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-md"
              />
              <Badge
                size="sm"
                className="absolute -top-1 -right-1 text-xs min-w-5 h-5 flex items-center justify-center"
              >
                {item.quantity}
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">${item.price}</span>
                {item.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${item.originalPrice}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm font-semibold">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      {/* Applied Promo */}
      {appliedPromo && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-ele border border-green-200">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {appliedPromo}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removePromo}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}{" "}
      {/* Pricing Breakdown */}
      <div className="flex flex-col gap-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>
        {summary.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${summary.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>${summary.shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>${summary.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg border-t pt-2">
          <span>Total</span>
          <span>${summary.total.toFixed(2)}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

if (isLoading) {
  return (
    <div className="w-full mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-32" />
      </div>
      <CheckoutSkeleton />
    </div>
  );
}

return (
  <div className="w-full mx-auto p-6 flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-4 flex-col">
        {" "}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cart
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Checkout
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete your purchase securely
          </p>
        </div>
      </div>
      <Badge variant="secondary" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        SSL Secured
      </Badge>
    </div>{" "}
    {/* Progress Steps */}
    <div className="flex items-center justify-start gap-4 sm:gap-6 py-4">
      {[
        { step: 1, label: "Shipping", icon: Truck },
        { step: 2, label: "Payment", icon: CreditCard },
        { step: 3, label: "Review", icon: Check },
      ].map(({ step, label, icon: Icon }, index) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                currentStep >= step
                  ? "bg-primary border-primary text-white"
                  : "border-border text-muted-foreground"
              )}
            >
              {currentStep > step ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium hidden sm:block",
                currentStep >= step
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {index < 2 && (
            <div
              className={cn(
                "w-8 h-0.5",
                currentStep > step
                  ? "bg-primary"
                  : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Step 1: Shipping Information */}
        {currentStep === 1 && (
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">First Name *</Label>{" "}
                  <Input
                    id="firstName"
                    size="lg"
                    placeholder="John"
                    value={shippingAddress.firstName}
                    onChange={(e) =>
                      handleAddressChange("firstName", e.target.value)
                    }
                    leftIcon={<User className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Last Name *</Label>{" "}
                  <Input
                    id="lastName"
                    size="lg"
                    placeholder="Doe"
                    value={shippingAddress.lastName}
                    onChange={(e) =>
                      handleAddressChange("lastName", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email *</Label>{" "}
                  <Input
                    id="email"
                    size="lg"
                    type="email"
                    placeholder="john@example.com"
                    value={shippingAddress.email}
                    onChange={(e) =>
                      handleAddressChange("email", e.target.value)
                    }
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>{" "}
                  <Input
                    id="phone"
                    size="lg"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      handleAddressChange("phone", e.target.value)
                    }
                    leftIcon={<Phone className="h-4 w-4" />}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address *</Label>{" "}
                <Input
                  id="address"
                  size="lg"
                  placeholder="123 Main Street"
                  value={shippingAddress.address}
                  onChange={(e) =>
                    handleAddressChange("address", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City *</Label>{" "}
                  <Input
                    id="city"
                    size="lg"
                    placeholder="New York"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={shippingAddress.state}
                    onValueChange={(value) =>
                      handleAddressChange("state", value)
                    }
                  >
                    <SelectTrigger className="text-sm" size={"lg"}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>{" "}
                  <Input
                    id="zipCode"
                    size="lg"
                    placeholder="10001"
                    value={shippingAddress.zipCode}
                    onChange={(e) =>
                      handleAddressChange("zipCode", e.target.value)
                    }
                  />
                </div>
              </div>{" "}
              {/* Shipping Methods */}
              <div className="flex flex-col gap-3 border-t pt-4">
                <Label>Shipping Method</Label>
                <div className="flex flex-col gap-4">
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "p-3 border rounded-ele cursor-pointer transition-colors",
                        selectedShipping === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      )}
                      onClick={() => setSelectedShipping(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border-2 transition-colors",
                              selectedShipping === method.id
                                ? "border-primary bg-primary"
                                : "border-border"
                            )}
                          />
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.time}
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold">${method.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={nextStep}
                disabled={!validateStep(1)}
                className="ml-auto"
                size="lg"
              >
                Continue to Payment
              </Button>
            </CardFooter>
          </Card>
        )}{" "}
        {/* Step 2: Payment Information */}
        {currentStep === 2 && (
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Payment Method Selection */}
              <div className="flex flex-col gap-4">
                <Label className="text-base font-medium">
                  Choose Payment Method
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Credit/Debit Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("card")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-xs text-muted-foreground">
                        Visa, Mastercard, Amex
                      </div>
                    </div>
                  </button>

                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("paypal")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "paypal"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">PayPal</div>
                      <div className="text-xs text-muted-foreground">
                        Fast & secure
                      </div>
                    </div>
                  </button>

                  {/* Apple Pay */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("apple-pay")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "apple-pay"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Smartphone className="h-5 w-5 text-gray-800" />
                    <div>
                      <div className="font-medium">Apple Pay</div>
                      <div className="text-xs text-muted-foreground">
                        Touch ID or Face ID
                      </div>
                    </div>
                  </button>

                  {/* Google Pay */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("google-pay")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "google-pay"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Google Pay</div>
                      <div className="text-xs text-muted-foreground">
                        One-tap checkout
                      </div>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("bank-transfer")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "bank-transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Building2 className="h-5 w-5 text-blue-800" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-xs text-muted-foreground">
                        Direct bank payment
                      </div>
                    </div>
                  </button>

                  {/* Buy Now Pay Later */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType("bnpl")}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-ele transition-colors text-left",
                      selectedPaymentType === "bnpl"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Buy Now Pay Later</div>
                      <div className="text-xs text-muted-foreground">
                        Split into 4 payments
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Credit Card Form - Only show when card is selected */}
              {selectedPaymentType === "card" && (
                <div className="flex flex-col gap-4 border-t pt-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nameOnCard">Name on Card *</Label>{" "}
                    <Input
                      id="nameOnCard"
                      size="lg"
                      placeholder="John Doe"
                      value={paymentMethod.nameOnCard}
                      onChange={(e) =>
                        handlePaymentChange("nameOnCard", e.target.value)
                      }
                      leftIcon={<User className="h-4 w-4" />}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cardNumber">Card Number *</Label>{" "}
                    <Input
                      id="cardNumber"
                      size="lg"
                      placeholder="1234 5678 9012 3456"
                      value={paymentMethod.cardNumber}
                      onChange={(e) =>
                        handlePaymentChange("cardNumber", e.target.value)
                      }
                      leftIcon={<CreditCard className="h-4 w-4" />}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="expiryMonth">Month *</Label>
                      <Select
                        value={paymentMethod.expiryMonth}
                        onValueChange={(value) =>
                          handlePaymentChange("expiryMonth", value)
                        }
                      >
                        <SelectTrigger className="text-sm" size={"lg"}>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem
                              key={i + 1}
                              value={String(i + 1).padStart(2, "0")}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="expiryYear">Year *</Label>
                      <Select
                        value={paymentMethod.expiryYear}
                        onValueChange={(value) =>
                          handlePaymentChange("expiryYear", value)
                        }
                      >
                        <SelectTrigger className="text-sm" size={"lg"}>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem
                              key={2024 + i}
                              value={String(2024 + i)}
                            >
                              {2024 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cvv">CVV *</Label>{" "}
                      <Input
                        id="cvv"
                        size="lg"
                        placeholder="123"
                        maxLength={4}
                        value={paymentMethod.cvv}
                        onChange={(e) =>
                          handlePaymentChange("cvv", e.target.value)
                        }
                        leftIcon={<Lock className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Info */}
              {selectedPaymentType === "paypal" && (
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-ele p-4">
                    <div className="flex items-start gap-3">
                      <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          PayPal Payment
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You'll be redirected to PayPal to complete your
                          payment securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Apple Pay Info */}
              {selectedPaymentType === "apple-pay" && (
                <div className="border-t pt-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-ele p-4">
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-gray-800 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Apple Pay
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          Use Touch ID or Face ID to pay with your default
                          card.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Pay Info */}
              {selectedPaymentType === "google-pay" && (
                <div className="border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-ele p-4">
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">
                          Google Pay
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          Complete your purchase with one tap using Google
                          Pay.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Info */}
              {selectedPaymentType === "bank-transfer" && (
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-ele p-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-800 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Bank Transfer
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          We'll provide bank details after you place your
                          order. Payment processing may take 1-3 business
                          days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buy Now Pay Later Info */}
              {selectedPaymentType === "bnpl" && (
                <div className="border-t pt-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-ele p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-900">
                          Buy Now Pay Later
                        </h4>{" "}
                        <p className="text-sm text-purple-700 mt-1">
                          Split your ${summary.total.toFixed(2)} purchase into
                          4 interest-free payments of $
                          {(summary.total / 4).toFixed(2)}.
                        </p>
                        <div className="mt-2 text-xs text-purple-600">
                          • Pay ${(summary.total / 4).toFixed(2)} today • Then
                          ${(summary.total / 4).toFixed(2)} every 2 weeks • No
                          interest, no fees when you pay on time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Payment Method - Only for card payments */}
              {selectedPaymentType === "card" && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <Checkbox
                    id="savePayment"
                    checked={savePaymentMethod}
                    onCheckedChange={(checked) =>
                      setSavePaymentMethod(checked === true)
                    }
                  />
                  <Label htmlFor="savePayment" className="text-sm">
                    Save payment method for future purchases
                  </Label>
                </div>
              )}
            </CardContent>{" "}
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!validateStep(2)}
                size="lg"
              >
                Review Order
              </Button>
            </CardFooter>
          </Card>
        )}
        {/* Step 3: Review Order */}
        {currentStep === 3 && (
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Check className="h-5 w-5" />
                Review Your Order
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Shipping Address Review */}
              <div className="flex flex-col gap-2">
                <h3 className="font-medium">Shipping Address</h3>
                <div className="text-sm text-muted-foreground p-3 bg-accent rounded-ele">
                  <p>
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </p>
                  <p>{shippingAddress.address}</p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.zipCode}
                  </p>
                  <p>{shippingAddress.email}</p>
                </div>
              </div>{" "}
              {/* Payment Method Review */}
              <div className="flex flex-col gap-2">
                <h3 className="font-medium">Payment Method</h3>
                <div className="text-sm text-muted-foreground p-3 bg-accent rounded-ele">
                  {selectedPaymentType === "card" && (
                    <>
                      <p>
                        **** **** **** {paymentMethod.cardNumber.slice(-4)}
                      </p>
                      <p>{paymentMethod.nameOnCard}</p>
                    </>
                  )}
                  {selectedPaymentType === "paypal" && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span>PayPal</span>
                    </div>
                  )}
                  {selectedPaymentType === "apple-pay" && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-800" />
                      <span>Apple Pay</span>
                    </div>
                  )}
                  {selectedPaymentType === "google-pay" && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span>Google Pay</span>
                    </div>
                  )}
                  {selectedPaymentType === "bank-transfer" && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-800" />
                      <span>Bank Transfer</span>
                    </div>
                  )}
                  {selectedPaymentType === "bnpl" && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>
                        Buy Now Pay Later (4 payments of $
                        {(summary.total / 4).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>{" "}
              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 border-t pt-4">
                <Checkbox
                  id="agreeTerms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) =>
                    setAgreeToTerms(checked === true)
                  }
                />
                <Label
                  htmlFor="agreeTerms"
                  className="text-sm leading-relaxed"
                >
                  I agree to the{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Terms of Service
                  </Button>{" "}
                  and{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Privacy Policy
                  </Button>
                </Label>
              </div>
            </CardContent>{" "}
            <CardFooter className="flex justify-between">
              {" "}
              <Button
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>{" "}
              <Button
                disabled={!validateStep(3)}
                size="lg"
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Complete Order ${summary.total.toFixed(2)}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="flex flex-col gap-4">
        <OrderSummaryCard />

        {/* Security Badge */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Secure & Encrypted</div>
                <div className="text-muted-foreground">
                  Your data is protected with SSL encryption
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
}

export { Checkout };

demo.tsx
import { Checkout } from "@/components/ui/checkout-block";

export default function DemoOne() {
  return <Checkout />;
}

```

Copy-paste these files for dependencies:
```tsx
preetsuthar17/card
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative rounded-card bg-card text-card-foreground transition-all duration-300 ease-out overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-border",
        outline:
          "border-2 border-border  hover:border-primary/30",
        ghost: "border-transparent hover:bg-accent ",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground leading-relaxed",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
```
```tsx
preetsuthar17/label
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
  optional?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    { className, variant, size, required, optional, children, ...props },
    ref,
  ) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {required && (
          <span
            className="text-destructive ml-1"
            aria-label="required"
          >
            *
          </span>
        )}
        {optional && !required && (
          <span className="text-muted-foreground ml-1 font-normal">
            (optional)
          </span>
        )}
      </label>
    );
  },
);

Label.displayName = "Label";

export { Label, labelVariants };
```
```tsx
preetsuthar17/input
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, X } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-ele border border-border bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm/2",
  {
    variants: {
      variant: {
        default: "border-border",
        destructive:
          "border-destructive focus-visible:ring-destructive",
        ghost:
          "border-transparent bg-accent focus-visible:bg-input focus-visible:border-border",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = "text",
      leftIcon,
      rightIcon,
      error,
      clearable,
      onClear,
      value,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(
      props.defaultValue || "",
    );
    
    // Create internal ref if no ref is provided
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;

    const inputVariant = error ? "destructive" : variant;
    const isPassword = type === "password";
    const actualType = isPassword && showPassword ? "text" : type;

    // Determine if this is a controlled component
    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;
    const showClearButton =
      clearable && inputValue && String(inputValue).length > 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      props.onChange?.(e);
    };

    const handleClear = () => {
      // Get reference to the input element
      const inputElement = typeof inputRef === 'function' ? null : inputRef?.current;
      
      if (inputElement) {
        // Set the input's value directly
        inputElement.value = "";
        
        // Create a proper synthetic event
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: inputElement
        });
        
        // Dispatch the event to trigger onChange handlers
        inputElement.dispatchEvent(event);
      }

      // Update internal state for uncontrolled components
      if (!isControlled) {
        setInternalValue("");
      }
      
      // Call the onClear callback
      onClear?.();
      
      // Create synthetic React event for onChange
      if (props.onChange) {
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLInputElement>;
        
        props.onChange(syntheticEvent);
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 z-10">
            {leftIcon}
          </div>
        )}

        <input
          type={actualType}
          className={cn(
            inputVariants({ variant: inputVariant, size, className }),
            leftIcon && "pl-10",
            (rightIcon || isPassword || showClearButton) && "pr-10"
          )}
          ref={inputRef}
          {...(isControlled
            ? { value: inputValue }
            : { defaultValue: props.defaultValue })}
          onChange={handleInputChange}
          {...(({ defaultValue, ...rest }) => rest)(props)}
        />

        {/* Right side icons container */}
        {(rightIcon || isPassword || showClearButton) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {/* Custom right icon */}
            {rightIcon && (
              <div className="text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
                {rightIcon}
              </div>
            )}

            {/* Clear button */}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
                tabIndex={-1}
              >
                <X />
              </button>
            )}

            {/* Password visibility toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
```
```tsx
preetsuthar17/select
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type LucideIcon, ChevronDown, Check } from "lucide-react";
import { motion } from "motion/react";

const selectTriggerVariants = cva(
  "flex h-9 w-full items-center justify-between gap-3 rounded-ele border border-border bg-background px-3 py-2 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border border-border bg-input",
  {
    variants: {
      variant: {
        default:
          "hover:bg-accent hover:text-accent-foreground shadow-sm/2",
        outline: "border-2 hover:border-ring shadow-sm/2",
        ghost:
          "border-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 p-2 text-xs gap-2",
        default: "h-9 p-3 gap-3",
        lg: "h-10 p-4 text-base gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const selectContentVariants = cva(
  "relative z-50 max-h-[300px] min-w-[8rem] overflow-hidden rounded-ele border border-border bg-background text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      position: {
        popper:
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        "item-aligned": "",
      },
    },
    defaultVariants: {
      position: "popper",
    },
  }
);

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value> & {
    placeholder?: string;
  }
>(({ className, placeholder, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={cn("text-sm select-none", className)}
    placeholder={
      placeholder && (
        <span className="text-muted-foreground select-none">
          {placeholder}
        </span>
      )
    }
    {...props}
  />
));
SelectValue.displayName = SelectPrimitive.Value.displayName;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  icon?: LucideIcon;
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    { className, children, variant, size, icon: Icon, placeholder, ...props },
    ref
  ) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "group",
        selectTriggerVariants({ variant, size }),
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Icon && (
          <Icon
            size={16}
            className="shrink-0 text-muted-foreground"
          />
        )}
        <span className="truncate">{children}</span>
      </div>{" "}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          size={16}
          className="opacity-50 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(selectContentVariants({ position }), className)}
      position={position}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-2 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
            position === "popper" &&
              "h-fit w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </motion.div>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold text-muted-foreground",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  icon?: LucideIcon;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, icon: Icon, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:text-muted-foreground",
      className
    )}
    {...props}
  >
    <motion.div
      className="flex w-full items-center gap-2"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.1 }}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </motion.div>
    <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          <Check size={16} />
        </motion.div>
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  selectTriggerVariants,
};
```
```tsx
preetsuthar17/button
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ele text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-sm/2",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-sm/2",
        outline:
          "border border-border text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring shadow-sm/2",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        link: "text-secondary-foreground underline-offset-4 hover:underline focus-visible:ring-ring",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type CustomButtonProps = Omit<
  ButtonProps,
  keyof React.ComponentProps<"button">
>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && leftIcon}
        {children}
        {rightIcon && !loading && rightIcon}
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
```
```tsx
preetsuthar17/checkbox
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary bg-accent text-foreground  focus-visible:ring-offset-background focus-visible:ring-offset-2 transition-colors shadow-sm/2",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  label?: string;
  description?: string;
  error?: string;
}

const CheckboxRoot = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, label, description, error, id, ...props }, ref) => {
  const checkboxId = id || React.useId();
  const iconSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;

  // Custom SVG check path for drawing animation
  const checkPath = "M3 6l3 3 6-6";
  const minusPath = "M3 6h8";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          className={cn(checkboxVariants({ size }), className)}
          {...props}
        >
          <CheckboxPrimitive.Indicator asChild>
            <div className="flex items-center justify-center text-current">
              <AnimatePresence mode="wait">
                {props.checked === "indeterminate" ? (
                  <motion.svg
                    key="indeterminate"
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 14 14"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.path
                      d={minusPath}
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="check"
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 14 14"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.path
                      d={checkPath}
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                        delay: 0.1,
                      }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {(label || description) && (
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  "text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground peer-disabled:opacity-70">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive ml-6">
          {error}
        </p>
      )}
    </div>
  );
});

CheckboxRoot.displayName = "Checkbox";

// Simple wrapper that maintains the same API
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>((props, ref) => <CheckboxRoot ref={ref} {...props} />);

Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants, type CheckboxProps };
```
```tsx
preetsuthar17/skeleton
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva(
  "animate-pulse rounded-card bg-accent",
  {
    variants: {
      variant: {
        default: "bg-accent",
        secondary: "bg-accent/20",
        text: "bg-accent rounded-md",
        circle: "rounded-full",
        avatar: "rounded-full bg-accent",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-10",
        "2xl": "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Custom width for the skeleton
   */
  width?: string | number;
  /**
   * Custom height for the skeleton
   */
  height?: string | number;
  /**
   * Animation speed in seconds
   */
  duration?: number;
  /**
   * Whether to show shimmer effect
   */
  shimmer?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant,
      size,
      width,
      height,
      duration = 2,
      shimmer = true,
      style,
      ...props
    },
    ref,
  ) => {
    const customStyle = {
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      animationDuration: `${duration}s`,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant, size }),
          shimmer && "relative overflow-hidden",
          shimmer &&
            "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
          className,
        )}
        style={customStyle}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton components for common use cases
const SkeletonText = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant">
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="text"
    className={cn("w-full", className)}
    {...props}
  />
));
SkeletonText.displayName = "SkeletonText";

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant">
>(({ className, size = "default", ...props }, ref) => {
  const avatarSizeMap = {
    sm: "w-8 h-8",
    default: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20",
  };
  const avatarSize =
    avatarSizeMap[size as keyof typeof avatarSizeMap] || "w-10 h-10";

  return (
    <Skeleton
      ref={ref}
      variant="avatar"
      className={cn(avatarSize, className)}
      {...props}
    />
  );
});
SkeletonAvatar.displayName = "SkeletonAvatar";

const SkeletonButton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant">
>(({ className, size = "default", ...props }, ref) => {
  const buttonHeight: Record<string, string> = {
    sm: "h-8",
    default: "h-10",
    lg: "h-11",
    xl: "h-12",
    "2xl": "h-14",
  };
  const selectedHeight = buttonHeight[size as string] || "h-10";

  return (
    <Skeleton
      ref={ref}
      className={cn(selectedHeight, "w-20 rounded-card", className)}
      {...props}
    />
  );
});
SkeletonButton.displayName = "SkeletonButton";

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant"> & {
    showImage?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
  }
>(
  (
    {
      className,
      showImage = true,
      showHeader = true,
      showFooter = true,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card border bg-card p-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      {showImage && (
        <Skeleton className="w-full h-48 rounded-none rounded-t-xl" />
      )}
      <div className="p-6 space-y-4">
        {showHeader && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        {showFooter && (
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        )}
      </div>
    </div>
  ),
);
SkeletonCard.displayName = "SkeletonCard";

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  skeletonVariants,
};
```

Install NPM dependencies:
```bash
lucide-react, class-variance-authority, motion, @radix-ui/react-select, @radix-ui/react-slot, @radix-ui/react-checkbox
```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --hu-font-geist: var(--font-geist);
  --hu-font-jetbrains: var(--font-jetbrains-mono);
  --radius: 8px;
  --card-radius: 10px;
  --hu-background: 0, 0%, 100%;
  --hu-foreground: 0, 0%, 14%;
  --hu-card: 0, 0%, 99%;
  --hu-card-foreground: 0, 0%, 14%;
  --hu-primary: 235, 100%, 60%;
  --hu-primary-foreground: 0, 0%, 98%;
  --hu-secondary: 0, 0%, 97%;
  --hu-secondary-foreground: 0, 0%, 20%;
  --hu-muted: 0, 0%, 97%;
  --hu-muted-foreground: 0, 0%, 56%;
  --hu-accent: 0, 0%, 96%;
  --hu-accent-foreground: 0, 0%, 20%;
  --hu-destructive: 9, 96%, 47%;
  --hu-destructive-foreground: 0, 0%, 98%;
  --hu-border: 0, 0%, 92%;
  --hu-input: 0, 0%, 100%;
  --hu-ring: 0, 0%, 71%;
  --color-fd-background: hsl(var(--hu-background));
  --color-fd-card: hsl(var(--hu-background));
}

.dark {
  --hu-background: 0, 0%, 7%;
  --hu-foreground: 0, 0%, 100%;
  --hu-card: 0, 0%, 9%;
  --hu-card-foreground: 0, 0%, 100%;
  --hu-primary: 235, 100%, 60%;
  --hu-primary-foreground: 0, 0%, 98%;
  --hu-secondary: 0, 0%, 15%;
  --hu-secondary-foreground: 0, 0%, 100%;
  --hu-muted: 0, 0%, 15%;
  --hu-muted-foreground: 0, 0%, 71%;
  --hu-accent: 0, 0%, 15%;
  --hu-accent-foreground: 0, 0%, 100%;
  --hu-destructive: 0, 84%, 50%;
  --hu-destructive-foreground: 0, 0%, 98%;
  --hu-border: 0, 0%, 100%, 10%;
  --hu-input: 0, 0%, 100%, 5%;
  --hu-ring: 0, 0%, 56%;
  --color-fd-background: hsl(var(--hu-background));
  --color-fd-card: hsl(var(--hu-background));
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
