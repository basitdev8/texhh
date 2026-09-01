import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TechChasers — Precision Electronics & PC Parts",
    template: "%s | TechChasers",
  },
  description:
    "Shop premium electronics, flagship smartphones, laptops, custom PC components, and build compatible systems with confidence.",
  keywords: ["electronics", "smartphones", "laptops", "PC builder", "PC components", "TechChasers"],
  openGraph: {
    title: "TechChasers — Precision Electronics & PC Parts",
    description:
      "Shop premium electronics, flagship smartphones, laptops, custom PC components, and build compatible systems with confidence.",
    type: "website",
    url: SITE_URL,
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
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${inter.variable}`}
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
