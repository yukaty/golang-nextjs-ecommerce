"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { ProductListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, RotateCcw, Headphones, Mail, ArrowRight } from "lucide-react";

export default function Home() {
  const [featured, setFeatured] = useState<ProductListItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductListItem[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        setFeatured(data.featured);
        setNewArrivals(data.newArrivals);
        setBestSellers(data.bestSellers);
      })
      .catch((err) => console.error("Failed to load product data.", err));
  }, []);

  const searchParams = useSearchParams();
  const message = searchParams.get("registered")
    ? "Registration completed successfully."
    : searchParams.get("logged-in")
    ? "You have been logged in."
    : searchParams.get("logged-out")
    ? "You have been logged out."
    : searchParams.get("submitted")
    ? "Your inquiry has been submitted. We will respond shortly."
    : null;

  return (
    <div className="min-h-screen font-(family-name:--font-inter)">
      {message && (
        <div className="bg-green-100 text-green-800 p-3 text-center shadow-md">
          {message}
        </div>
      )}

      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[75vh] overflow-hidden">
        <Image
          src="/images/main-visual.webp"
          alt="Gear Up for Your Next Adventure"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl px-4">
            Gear Up for Your<br className="sm:hidden" /> Next Adventure
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 drop-shadow-lg px-4 max-w-3xl font-light">
            Premium outdoor gear for adventurers
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-forest-600 hover:bg-forest-700 text-white font-semibold shadow-2xl text-lg px-8 py-6">
              Explore Collection
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-stone-100 border-y border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Free Shipping</h3>
                <p className="text-sm text-stone-600">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Easy Returns</h3>
                <p className="text-sm text-stone-600">60-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Expert Support</h3>
                <p className="text-sm text-stone-600">7 days a week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex flex-col gap-12 sm:gap-16 max-w-7xl">
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-6 sm:mb-8 text-center md:text-left">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {featured.slice(0, 3).map((item) => (
              <ProductCard
                key={`featured-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                imageSize={400}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-6 sm:mb-8 text-center md:text-left">
            New Arrivals
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 4).map((item) => (
              <ProductCard
                key={`new-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                rating={item.review_avg ?? 0}
                reviewCount={item.review_count ?? 0}
                showCartButton
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-6 sm:mb-8 text-center md:text-left">
            Best Sellers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.slice(0, 4).map((item) => (
              <ProductCard
                key={`best-seller-${item.id}`}
                id={item.id.toString()}
                title={item.name}
                price={item.price}
                imageUrl={item.image_url ?? undefined}
                rating={item.review_avg ?? 0}
                reviewCount={item.review_count ?? 0}
                showCartButton
              />
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-linear-to-br from-forest-700 to-forest-800 rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 mb-4 sm:mb-6">
              <Mail className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Join the Adventure
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-stone-100 px-4">
              Get exclusive access to new gear, trail guides, and outdoor tips
            </p>
            <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto px-4 sm:px-0">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white text-stone-900 border-0 h-11 sm:h-12"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-terra-600 hover:bg-terra-700 text-white font-semibold px-6 sm:px-8 h-11 sm:h-12"
              >
                Subscribe
              </Button>
            </form>
            <p className="text-xs sm:text-sm text-stone-300 mt-3 sm:mt-4">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
