"use client";

import { useEffect, useState, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
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
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popularOnly, setPopularOnly] = useState<boolean>(false);

  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract params safely
  const gradeParam = searchParams.get("grade");
  const categoryParam = searchParams.get("category");
  const popularParam = searchParams.get("popular");

  const handleStarClick = (value: number) => setSelectedRating(value);

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (selectedRating >= i)
        stars.push(
          <FaStar
            key={i}
            className="text-[var(--star-color)] cursor-pointer"
            onClick={() => handleStarClick(i)}
          />
        );
      else if (selectedRating >= i - 0.5)
        stars.push(
          <FaStarHalfAlt
            key={i}
            className="text-[var(--star-color)] cursor-pointer"
            onClick={() => handleStarClick(i - 0.5)}
          />
        );
      else
        stars.push(
          <FaRegStar
            key={i}
            className="text-[var(--star-empty-color)] cursor-pointer"
            onClick={() => handleStarClick(i)}
          />
        );
    }
    return stars;
  };

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
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Initialize selected grade/category from URL
  useEffect(() => {
    setSelectedGrade(gradeParam);
    setSelectedCategory(categoryParam);
    setPopularOnly(popularParam === "true");
  }, [gradeParam, categoryParam, popularParam]);

  const applyGradeFilter = (grade: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedGrade === grade) {
      params.delete("grade");
      setSelectedGrade(null);
    } else {
      params.set("grade", grade);
      setSelectedGrade(grade);
    }
    router.push(`/shop?${params.toString()}`);
    onClose();
  };

  const applyCategoryFilter = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory === category) {
      params.delete("category");
      setSelectedCategory(null);
    } else {
      params.set("category", category);
      setSelectedCategory(category);
    }
    router.push(`/shop?${params.toString()}`);
    onClose();
  };

  const applyPopularFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (popularOnly) {
      params.delete("popular");
      setPopularOnly(false);
    } else {
      params.set("popular", "true");
      setPopularOnly(true);
    }
    router.push(`/shop?${params.toString()}`);
    onClose();
  };

  const clearFilters = () => {
    router.push("/shop");
    setSelectedGrade(null);
    setSelectedCategory(null);
    setSelectedRating(0);
    setPopularOnly(false);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
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

        <h2 className="text-lg font-semibold text-[var(--primary-color)]">
          Filters
        </h2>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
        >
          Clear Filters
        </button>

        {/* Grade Filter */}
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

        {/* Popular Filter */}
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

        {/* Category Filter */}
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

        {/* Price Filter (static for now) */}
        <FilterSection title="Price">
          <input
            type="range"
            min={0}
            max={1000}
            className="w-full accent-[var(--primary-color)]"
          />
          <div className="flex justify-between text-sm text-[var(--text-light)]">
            <span>0</span>
            <span>1000</span>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title="Customer Rating">
          <div className="flex space-x-1 text-lg">{renderStars()}</div>
          <p className="text-sm text-[var(--text-light)] mt-1">
            Selected: {selectedRating} Stars
          </p>
        </FilterSection>
      </aside>
    </>
  );
}
