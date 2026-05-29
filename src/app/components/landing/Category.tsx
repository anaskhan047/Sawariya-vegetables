"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Category {
  name: string;
  imageUrl: string;
  _id: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "force-cache" });
        if (!res.ok) return;

        const data = await res.json();
        if (!ignore && data?.success && Array.isArray(data.data)) {
          setCategories(data.data as Category[]);
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

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const params = new URLSearchParams();
      params.set("category", categoryName);
      router.push(`/shop?${params.toString()}`);
    },
    [router]
  );

  const cardItems = categories.length > 0 ? categories : Array.from({ length: 6 });

  return (
    <section className="relative mx-auto my-8 w-full max-w-7xl px-3 py-8 sm:px-5 md:py-12">
      <div className="absolute inset-x-0 top-8 -z-10 mx-auto h-40 w-[92%] rounded-3xl bg-gradient-to-r from-emerald-100 via-lime-50 to-cyan-100 blur-2xl" />

      <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Shop By Collection</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-4xl" style={{ fontFamily: '"Poppins", "Segoe UI", sans-serif' }}>
            Explore Fresh Categories
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            Handpicked sections for your daily essentials. Tap any category to jump directly into filtered products.
          </p>
        </div>

        <button
          onClick={() => router.push("/shop")}
          className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          View Full Shop
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cardItems.map((category, index) => {
          const isLoaded = typeof category === "object" && category !== null && "name" in category;
          const cat = isLoaded ? (category as Category) : null;
          const imageUrl =
            cat && typeof cat.imageUrl === "string" ? cat.imageUrl.trim() : "";
          const hasImageSrc = imageUrl.length > 0;

          return (
            <motion.button
              key={cat?._id ?? `placeholder-${index}`}
              type="button"
              onClick={() => {
                if (!isLoaded || !cat) return;
                handleCategoryClick(cat.name);
              }}
              whileHover={isLoaded ? { y: -6, scale: 1.01 } : {}}
              whileTap={isLoaded ? { scale: 0.985 } : {}}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.2) }}
              className={`group relative overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                isLoaded
                  ? "border-slate-200 bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="relative h-32 w-full overflow-hidden sm:h-36 lg:h-40">
                {isLoaded && hasImageSrc ? (
                  <>
                    <Image
                      src={imageUrl}
                      alt={cat?.name ?? "Category"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      priority={index < 4}
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
                  </>
                ) : isLoaded ? (
                  <>
                    <div
                      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-200 via-lime-100 to-cyan-100 text-4xl font-extrabold text-emerald-800/35 transition duration-500 group-hover:scale-105"
                      aria-hidden
                    >
                      {(cat?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
                  </>
                ) : (
                  <div className="h-full w-full animate-pulse bg-slate-200" />
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3">
                <p
                  className={`line-clamp-2 text-sm font-semibold sm:text-base ${isLoaded ? "text-white" : "text-slate-500"}`}
                  style={{ fontFamily: '"Poppins", "Segoe UI", sans-serif' }}
                >
                  {isLoaded && cat ? cat.name : "Loading..."}
                </p>
                <span className={`mt-1 inline-block text-[11px] font-medium ${isLoaded ? "text-emerald-100" : "text-slate-400"}`}>
                  {isLoaded ? "Tap to explore" : "Please wait"}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
