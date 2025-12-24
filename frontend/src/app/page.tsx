"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { type ProductData } from "@/types/product";
import { Button } from "@/components/ui/button";

// Product data type definition
type Product = Pick<
  ProductData,
  "id" | "name" | "price" | "image_url" | "review_avg" | "review_count"
>;

export default function Home() {
  // State to hold product data
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  // Runs once when component is displayed
  useEffect(() => {
    // Fetch data from products API
    fetch("/api/home")
      .then((res) => res.json()) // Convert to JSON format
      .then((data) => {
        // Update state
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

      <section className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden">
        <Image
          src="/images/main-visual.webp"
          alt="Gear Up for Your Next Adventure"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 drop-shadow-md text-shadow-lg/50">
            Gear Up for Your Next Adventure
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-8 drop-shadow-md text-shadow-lg/50">
            Discover premium outdoor gear for every trail
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-forest-600 hover:bg-forest-700 text-white font-semibold shadow-lg">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      <main className="container mx-auto px-8 pt-8 pb-12 flex flex-col gap-4 max-w-7xl">
        <section>
          <h2>
            <span>Featured</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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
          <h2>
            <span>New Arrivals</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
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
          <h2>
            <span>Best Sellers</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
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
      </main>
    </div>
  );
}
