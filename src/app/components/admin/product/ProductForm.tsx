"use client";

import React, { useState, useEffect } from "react";
import { Product, CATEGORIES } from "@/app/lib/types";

interface FormProps {
  initial?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

export default function ProductForm({ initial, onSubmit, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Product["category"]>(
    initial?.category ?? "Leafy Greens"
  );
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [unit, setUnit] = useState<Product["unit"]>(initial?.unit ?? "kg");
  const [stockQty, setStockQty] = useState<number>(initial?.stockQty ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");

  const [imageData, setImageData] = useState<string | undefined>(
    initial?.imageData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minQty, setMinQty] = useState<number>(initial?.minQty ?? 1);
  const [maxQty, setMaxQty] = useState<number>(initial?.maxQty ?? 5);

  // 🔥 Dynamic limit rules based on unit
  useEffect(() => {
    if (unit === "kg") {
      setMinQty(0.5);
      setMaxQty(10);
    } else if (unit === "piece" || unit === "dozen") {
      setMinQty(1);
      setMaxQty(12);
    } else if (unit === "g") {
      setMinQty(100);
      setMaxQty(1000);
    }
  }, [unit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("File must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product name is required.";
    if (price <= 0) e.price = "Price must be greater than 0.";
    if (minQty <= 0 || maxQty <= 0 || minQty >= maxQty) {
      e.limit = "Enter a valid purchase limit range.";
    }
    if (stockQty < 0) {
      e.stock = "Stock cannot be negative.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const payload: Product = {
      id: initial?.id ?? "NEW",
      name: name.trim(),
      category,
      price: Number(price),
      unit,
      stockQty, // ✅ save stock
      description: description.trim() || undefined,
      imageData,
      minQty,
      maxQty,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl border"
        style={{ borderColor: "var(--border-color)" }}
      >
        {/* Header */}
        <div
          className="p-5 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {initial ? "Edit Product" : "Add Product"}
            </h3>
            <button
              onClick={onCancel}
              className="rounded-lg border px-3 py-1 text-sm"
              style={{ borderColor: "var(--border-color)" }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 grid gap-4 md:grid-cols-2">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Product Name *</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fresh Tomato"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-1">Category *</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Product["category"])
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm mb-1">Price (₹) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            {errors.price && (
              <p className="text-xs text-red-600 mt-1">{errors.price}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm mb-1">Unit</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Product["unit"])}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="piece">piece</option>
              <option value="dozen">dozen</option>
            </select>
          </div>

          {/* Min Qty */}
          <div>
            <label className="block text-sm mb-1">Min Limit</label>
            <input
              type="number"
              step={unit === "kg" ? "0.1" : "1"}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={minQty}
              onChange={(e) => setMinQty(parseFloat(e.target.value))}
            />
          </div>

          {/* Max Qty */}
          <div>
            <label className="block text-sm mb-1">Max Limit</label>
            <input
              type="number"
              step={unit === "kg" ? "0.1" : "1"}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={maxQty}
              onChange={(e) => setMaxQty(parseFloat(e.target.value))}
            />
            {errors.limit && (
              <p className="text-xs text-red-600 mt-1">{errors.limit}</p>
            )}
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm mb-1">
              Stock Quantity ({unit}) *
            </label>
            <input
              type="number"
              min={0}
              step={unit === "kg" ? "0.1" : "1"}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={stockQty}
              onChange={(e) => setStockQty(parseFloat(e.target.value))}
            />
            {errors.stock && (
              <p className="text-xs text-red-600 mt-1">{errors.stock}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Upload Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {imageData && (
              <img
                src={imageData}
                alt="Preview"
                className="mt-2 h-24 w-24 object-cover rounded-lg border"
                style={{ borderColor: "var(--border-color)" }}
              />
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div
          className="p-5 border-t flex gap-2 justify-end"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            {initial ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
