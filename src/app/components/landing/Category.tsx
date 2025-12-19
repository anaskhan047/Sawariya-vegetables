"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Category {
  name: string;
  imageUrl: string;
  _id: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  /* =========================
     FETCH WITH CACHE (FAST)
  ========================= */

  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", {
          cache: "force-cache",
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!ignore && data?.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load categories");
      }
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, []);

  /* =========================
     HANDLER
  ========================= */

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const params = new URLSearchParams();
      params.set("category", categoryName);
      router.push(`/shop?${params.toString()}`);
    },
    [router]
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <section className="bg-[var(--background-color)] py-10 max-w-6xl mx-auto">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-8">
          Explore Our Categories
        </h2>

        {/* ERROR */}
        {error && (
          <p className="text-center py-4 text-red-500 text-sm">{error}</p>
        )}

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 capitalize">
          {(categories.length > 0 ? categories : Array.from({ length: 5 })).map(
            (category: any, index) => (
              <div
                key={category?._id || index}
                onClick={() =>
                  category?.name && handleCategoryClick(category.name)
                }
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--border-color)] hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              >
                <div className="relative w-full h-40 bg-gray-100">
                  {category?.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      priority={index < 2} // first images priority
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full animate-pulse bg-gray-200" />
                  )}
                </div>

                <div className="p-3 text-center">
                  <h3 className="text-lg font-medium text-[var(--text-color)]">
                    {category?.name || "Loading..."}
                  </h3>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
