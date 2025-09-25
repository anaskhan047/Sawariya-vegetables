"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CircularLoader from "../Loader/Loader";

interface Category {
  name: string;
  imageUrl: string;
  _id: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        } else {
          setError("Failed to load categories");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while fetching categories");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams();
    params.set("category", categoryName);
    router.push(`/shop?${params.toString()}`);
  };

  if (loading) return <CircularLoader className="mx-auto" />;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <section className="bg-[var(--background-color)] py-10 max-w-6xl mx-auto">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-8">
          Explore Our Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-6 capitalize">
          {categories.map((category) => (
            <div
              key={category._id}
              onClick={() => handleCategoryClick(category.name)}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--border-color)] hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <div className="relative w-full h-40">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 text-center">
                <h3 className="text-lg font-medium text-[var(--text-color)]">
                  {category.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
