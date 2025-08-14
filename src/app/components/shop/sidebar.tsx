"use client";
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
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
  onClose?: () => void;
};

export default function ShopSidebar({ onClose }: ShopSidebarProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

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

  return (
    <aside className="w-64 h-screen sticky top-0 left-0 bg-[var(--background-color)] border-r border-[var(--border-color)] p-4 space-y-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-[var(--primary-color)]">Filters</h2>

      {/* Filters Sections */}
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

      <FilterSection title="Weight (KG)">
        {["0-1 KG", "1-5 KG", "5+ KG"].map((weight) => (
          <label key={weight} className="flex items-center space-x-2 text-[var(--text-light)]">
            <input type="checkbox" /> <span>{weight}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Customer Rating">
        <div className="flex space-x-1 text-lg">{renderStars()}</div>
        <p className="text-sm text-[var(--text-light)] mt-1">Selected: {selectedRating} Stars</p>
      </FilterSection>

      <FilterSection title="Discount">
        {["10% or more", "25% or more", "50% or more"].map((discount) => (
          <label key={discount} className="flex items-center space-x-2 text-[var(--text-light)]">
            <input type="checkbox" /> <span>{discount}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Area Availability">
        {["Local", "Nationwide", "International"].map((area) => (
          <label key={area} className="flex items-center space-x-2 text-[var(--text-light)]">
            <input type="checkbox" /> <span>{area}</span>
          </label>
        ))}
      </FilterSection>

      {/* Seasonal Delights */}
      <div className="bg-[var(--secondary-color)]/10 p-4 rounded-lg text-center">
        <h3 className="font-semibold text-[var(--primary-color)]">Seasonal Delights!</h3>
        <p className="text-sm text-[var(--text-light)]">
          Discover fresh seasonal produce at amazing prices. Limited time offer!
        </p>
        <button className="mt-3 bg-[var(--primary-color)] text-white px-4 py-2 rounded">
          Shop Now
        </button>
      </div>

      {/* Apply Filters */}
      <button
        onClick={onClose}
        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
      >
        Apply Filters
      </button>
    </aside>
  );
}
