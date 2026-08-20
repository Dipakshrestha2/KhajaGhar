import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "KhajaGhar — Food Delivery in Kathmandu",
    template: "%s | KhajaGhar",
  },
  description:
    "Order delicious food from the best restaurants in Kathmandu. Fast delivery, great prices, amazing taste. Momo, Pizza, Burger, Thakali & more!",
  keywords: [
    "food delivery",
    "Kathmandu",
    "momo",
    "pizza",
    "burger",
    "online food order",
    "KhajaGhar",
  ],
  openGraph: {
    title: "KhajaGhar — Food Delivery in Kathmandu",
    description:
      "Order delicious food from the best restaurants in Kathmandu. Fast delivery, great prices.",
    type: "website",
    locale: "en_US",
    siteName: "KhajaGhar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-surface-50 text-surface-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
