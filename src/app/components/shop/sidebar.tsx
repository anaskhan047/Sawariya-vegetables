"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";

type FilterSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const FilterSection = ({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: FilterSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-[var(--border-color)] bg-white/70 p-3 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-color)]">{title}</h3>
          {subtitle ? <p className="text-xs text-[var(--text-light)]">{subtitle}</p> : null}
        </div>
        <span className="text-[var(--text-light)]">{open ? <FiChevronUp /> : <FiChevronDown />}</span>
      </button>

      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </section>
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
  const [selectedRating, setSelectedRating] = useState<string>("all");

  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const gradeParam = searchParams.get("grade");
  const categoryParam = searchParams.get("category");
  const popularParam = searchParams.get("popular");
  const minParam = searchParams.get("minPrice");
  const maxParam = searchParams.get("maxPrice");

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ label: cat.name, value: cat.name })),
    [categories]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768) return;
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Categories API failed: ${res.status} ${text}`);
        }
        const data = await res.json();
        if (data.success && data.data) setCategories(data.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedGrade(gradeParam);
    setSelectedCategory(categoryParam);
    setPopularOnly(popularParam === "true");
    setPriceRange([Number(minParam) || 0, Number(maxParam) || 1000]);
  }, [gradeParam, categoryParam, popularParam, minParam, maxParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/shop?${params.toString()}`);
    if (window.innerWidth < 768) onClose();
  };

  const clearFilters = () => {
    router.push("/shop");
    setSelectedGrade(null);
    setSelectedCategory(null);
    setPopularOnly(false);
    setPriceRange([0, 1000]);
    setSelectedRating("all");
    if (window.innerWidth < 768) onClose();
  };

  return (
    <aside
      ref={ref}
      className="h-full max-h-screen w-full overflow-y-auto overscroll-contain bg-[var(--background-color)] p-3 sm:p-4 md:h-full md:max-h-full md:w-full md:max-w-[320px]"
    >
      <div className="rounded-2xl border border-[var(--border-color)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-color)]">Refine Products</h2>
            <p className="text-xs text-[var(--text-light)]">Choose filters to narrow results</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-light)] hover:bg-slate-100 md:hidden"
            aria-label="Close filters"
          >
            <FiX />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Clear All Filters
          </button>
        </div>

        <div className="space-y-3">
          <FilterSection title="Grade" subtitle="Quality level">
            {GRADES.map((grade) => {
              const active = selectedGrade === grade;
              return (
                <label
                  key={grade}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                    active
                      ? "border-[var(--primary-color)] bg-green-50 text-[var(--text-color)]"
                      : "border-[var(--border-color)] hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="grade"
                    checked={active}
                    onChange={() =>
                      updateParams({
                        grade: active ? null : grade,
                      })
                    }
                    className="h-4 w-4 accent-[var(--primary-color)]"
                  />
                  <span>{grade}</span>
                </label>
              );
            })}
          </FilterSection>

          <FilterSection title="Category" subtitle="Pick one category">
            <select
              value={selectedCategory || ""}
              onChange={(e) => updateParams({ category: e.target.value || null })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary-color)]"
            >
              <option value="">All categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="Price" subtitle="Set your budget">
            <div className="rounded-lg border border-[var(--border-color)] bg-slate-50 p-2.5">
              <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-light)]">
                <span>Min: Rs {priceRange[0]}</span>
                <span>Max: Rs {priceRange[1]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={priceRange[1]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setPriceRange([0, value]);
                  updateParams({ minPrice: "0", maxPrice: value.toString() });
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[var(--primary-color)]"
              />
            </div>
          </FilterSection>

          <FilterSection title="Availability" subtitle="Stock and trending">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border-color)] px-2.5 py-2 text-sm hover:bg-slate-50">
              <span className="text-[var(--text-color)]">Popular picks only</span>
              <input
                type="checkbox"
                checked={popularOnly}
                onChange={() => updateParams({ popular: popularOnly ? null : "true" })}
                className="h-4 w-4 accent-[var(--primary-color)]"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-dashed border-[var(--border-color)] bg-slate-50 px-2.5 py-2 text-sm text-[var(--text-light)]">
              <span>In-stock only</span>
              <input type="checkbox" disabled className="h-4 w-4" />
            </label>
          </FilterSection>

          <FilterSection title="Rating" subtitle="Customer rating filter">
            {["all", "4", "3"].map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-2.5 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === r}
                  onChange={() => setSelectedRating(r)}
                  className="h-4 w-4 accent-[var(--primary-color)]"
                />
                <span className="text-[var(--text-color)]">
                  {r === "all" ? "All ratings" : `${r}+ stars`}
                </span>
              </label>
            ))}
            <p className="text-[11px] text-[var(--text-light)]">Rating filter UI is ready for rating-enabled products.</p>
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}
