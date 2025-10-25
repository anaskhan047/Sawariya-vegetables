"use client";

import { useEffect, useState, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

const FilterSection = ({ title, children }: FilterSectionProps) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-[var(--border-color)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 font-medium text-[var(--text-color)]"
      >
        {title}
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
};

type ShopSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const GRADES = ["Standard", "Silver", "Gold", "Premium"];

export default function ShopSidebar({ isOpen, onClose }: ShopSidebarProps) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popularOnly, setPopularOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const gradeParam = searchParams.get("grade");
  const categoryParam = searchParams.get("category");
  const popularParam = searchParams.get("popular");
  const minParam = searchParams.get("minPrice");
  const maxParam = searchParams.get("maxPrice");

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success && data.data) setCategories(data.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Initialize from URL
  useEffect(() => {
    setSelectedGrade(gradeParam);
    setSelectedCategory(categoryParam);
    setPopularOnly(popularParam === "true");
    setPriceRange([
      Number(minParam) || 0,
      Number(maxParam) || 1000,
    ]);
  }, [gradeParam, categoryParam, popularParam, minParam, maxParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/shop?${params.toString()}`);
    onClose();
  };

  const applyGradeFilter = (grade: string) => {
    updateParams({
      grade: selectedGrade === grade ? null : grade,
    });
  };

  const applyCategoryFilter = (category: string) => {
    updateParams({
      category: selectedCategory === category ? null : category,
    });
  };

  const applyPopularFilter = () => {
    updateParams({
      popular: popularOnly ? null : "true",
    });
  };

  const applyPriceFilter = (min: number, max: number) => {
    updateParams({
      minPrice: min.toString(),
      maxPrice: max.toString(),
    });
  };

  const clearFilters = () => {
    router.push("/shop");
    setSelectedGrade(null);
    setSelectedCategory(null);
    setPopularOnly(false);
    setPriceRange([0, 1000]);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } md:hidden`}
      />

      <aside
        ref={ref}
        className={`md:sticky md:top-16 fixed top-16 left-0 h-full w-64 bg-[var(--background-color)] z-50 p-4 space-y-4 transform transition-transform duration-300 md:relative md:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end md:hidden">
          <button onClick={onClose} className="text-gray-600 text-xl">
            <FiX />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-[var(--primary-color)]">Filters</h2>

        <button
          onClick={clearFilters}
          className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
        >
          Clear Filters
        </button>

        <FilterSection title="Grade">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => applyGradeFilter(grade)}
              className={`w-full text-left px-2 py-1 rounded ${
                selectedGrade === grade
                  ? "bg-green-600 text-white"
                  : "text-[var(--text-light)] hover:bg-gray-200"
              }`}
            >
              {grade}
            </button>
          ))}
        </FilterSection>

        <FilterSection title="Popular">
          <button
            onClick={applyPopularFilter}
            className={`w-full text-left px-2 py-1 rounded ${
              popularOnly
                ? "bg-green-600 text-white"
                : "text-[var(--text-light)] hover:bg-gray-200"
            }`}
          >
            Show Popular Only
          </button>
        </FilterSection>

        <FilterSection title="Category">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => applyCategoryFilter(cat.name)}
              className={`w-full text-left px-2 py-1 rounded ${
                selectedCategory === cat.name
                  ? "bg-green-600 text-white"
                  : "text-[var(--text-light)] hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </FilterSection>

        {/* ✅ Working Price Filter */}
        <FilterSection title="Price">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={priceRange[1]}
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([Number(e.target.value), priceRange[1]])
              }
              className="w-20 border p-1 rounded text-sm"
            />
            <span>-</span>
            <input
              type="number"
              min={priceRange[0]}
              max={2000}
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              className="w-20 border p-1 rounded text-sm"
            />
          </div>

          <button
            onClick={() => applyPriceFilter(priceRange[0], priceRange[1])}
            className="w-full mt-2 bg-green-600 text-white py-1 rounded hover:bg-green-700"
          >
            Apply Price
          </button>
        </FilterSection>
      </aside>
    </>
  );
}
