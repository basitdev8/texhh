import type { Metadata } from "next";
import { Outfit, Inter, Fraunces } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechChasers — Curated Premium Electronics",
  description:
    "An editorial gallery of premium electronics, custom PC builds, and considered tech objects. Curated, photographed, and shipped with care.",
  keywords: ["electronics", "PC builder", "premium tech", "gaming", "components", "design"],
  openGraph: {
    title: "TechChasers — Curated Premium Electronics",
    description:
      "An editorial gallery of premium electronics, custom PC builds, and considered tech objects.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${fraunces.variable}`}
    >
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
