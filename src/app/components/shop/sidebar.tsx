"use client";
import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

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

export default function ShopSidebar({ isOpen, onClose }: ShopSidebarProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleStarClick = (value: number) => setSelectedRating(value);

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (selectedRating >= i) {
        stars.push(
          <FaStar
            key={i}
            className="text-[var(--star-color)] cursor-pointer"
            onClick={() => handleStarClick(i)}
          />
        );
      } else if (selectedRating >= i - 0.5) {
        stars.push(
          <FaStarHalfAlt
            key={i}
            className="text-[var(--star-color)] cursor-pointer"
            onClick={() => handleStarClick(i - 0.5)}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            className="text-[var(--star-empty-color)] cursor-pointer"
            onClick={() => handleStarClick(i)}
          />
        );
      }
    }
    return stars;
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          } md:hidden`}
      />

      <aside
        ref={ref}
        className={`fixed top-15 left-0 h-full w-64 bg-[var(--background-color)] z-50 p-4 space-y-4 transform transition-transform duration-300 md:relative md:translate-x-0 overflow-y-auto ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Close Button for mobile */}
        <div className="flex justify-end md:hidden">
          <button onClick={onClose} className="text-gray-600 text-xl">
            <FiX />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-[var(--primary-color)] ">Filters</h2>

        <FilterSection title="Availability">
          {["Available Today", "All Products"].map((item) => (
            <label key={item} className="flex items-center space-x-2 text-[var(--text-light)]">
              <input type="radio" name="availability" /> <span>{item}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="Category">
          {["Vegetables", "Fruits", "Dairy"].map((cat) => (
            <label key={cat} className="flex items-center space-x-2 text-[var(--text-light)]">
              <input type="checkbox" /> <span>{cat}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="Price">
          <input type="range" min={0} max={1000} className="w-full accent-[var(--primary-color)]" />
          <div className="flex justify-between text-sm text-[var(--text-light)]">
            <span>0</span>
            <span>1000</span>
          </div>
        </FilterSection>

        <FilterSection title="Customer Rating">
          <div className="flex space-x-1 text-lg">{renderStars()}</div>
          <p className="text-sm text-[var(--text-light)] mt-1">Selected: {selectedRating} Stars</p>
        </FilterSection>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Apply Filters
        </button>
      </aside>
    </>
  );
}
