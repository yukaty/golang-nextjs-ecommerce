import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAuthUser } from "@/lib/auth";
import { CartProvider } from '@/hooks/useCart';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoTrailhead",
  description: "Your trusted source for quality outdoor gear and equipment. Gear up for your next adventure.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get authenticated user information
  const user = await getAuthUser();

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <CartProvider>
          <Header user={user} />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
