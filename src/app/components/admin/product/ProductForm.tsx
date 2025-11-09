// src/app/components/admin/product/ProductForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/app/lib/types";

interface Props {
  initial?: Product;
  onSubmit: (data: ProductPayload) => void;
  onCancel: () => void;
}

type ProductPayload = Partial<Product> & {
  imageBase64?: string;
  imagesBase64?: string[];
};

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [marketPrice, setMarketPrice] = useState<number>(initial?.marketPrice ?? 0);
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [unit, setUnit] = useState<Product["unit"]>(initial?.unit ?? "kg");
  const [stockQty, setStockQty] = useState<number>(initial?.stockQty ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [minQty, setMinQty] = useState<number>(initial?.minQty ?? (unit === "kg" ? 0.5 : 1));
  const [maxQty, setMaxQty] = useState<number>(initial?.maxQty ?? (unit === "kg" ? 10 : 5));
  const [existingImages, setExistingImages] = useState<{ url: string; public_id: string }[]>(initial?.images ?? []);
  const [newImagesBase64, setNewImagesBase64] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [grade, setGrade] = useState<Product["grade"]>(initial?.grade ?? "Standard");
  const [popular, setPopular] = useState<boolean>(initial?.popular ?? false);
  const [inHindi, setInHindi] = useState(initial?.inHindi ?? "");

  // --- TAGS ---
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  useEffect(() => {
    // when initial changes (editing), sync tags
    setTags(initial?.tags ?? []);
  }, [initial]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) {
      setTagInput("");
      return;
    }
    // prevent duplicate (case-insensitive)
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((s) => [t, ...s]);
    setTagInput("");
  };

  const removeTag = (idx: number) => {
    setTags((s) => s.filter((_, i) => i !== idx));
  };
  // ---------------

  // --- MOBILE VH FIX: set --vh (to handle mobile keyboard / address bar resizing) ---
  useEffect(() => {
    function setVhVar() {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    }
    setVhVar();
    window.addEventListener("resize", setVhVar);
    return () => window.removeEventListener("resize", setVhVar);
  }, []);

  // Keep proper min/max when unit changes
  useEffect(() => {
    if (unit === "kg") {
      if (minQty < 0.1) setMinQty(0.5);
      if (maxQty < 1) setMaxQty(10);
    } else {
      if (minQty < 1) setMinQty(1);
      if (maxQty < 1) setMaxQty(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  interface Category {
    id: string;
    name: string;
  }

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data: { success: boolean; data: Category[]; error?: string } = await res.json();

        if (data?.success) {
          const names = data.data.map((c: Category) => c.name);
          setCategories(names);

          if (!initial?.category && names.length > 0) {
            setCategory(names[0]);
          }
        } else {
          console.error("Failed to fetch categories", data?.error);
        }
      } catch (err) {
        console.error("Error fetching categories", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [initial]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be < 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      setNewImagesBase64(prev => [...prev, data]);
    };
    reader.readAsDataURL(file);
  }

  function removeExisting(public_id: string) {
    setExistingImages(prev => prev.filter(i => i.public_id !== public_id));
  }

  function removeNew(base64: string) {
    setNewImagesBase64(prev => prev.filter(b => b !== base64));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name required";
    if (price <= 0) e.price = "Price must be > 0";
    if (minQty <= 0 || maxQty <= 0 || minQty > maxQty) e.limit = "Invalid min/max";
    if (stockQty < 0) e.stock = "Stock must be >= 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    try {
      if (!validate()) return;

      const payload: ProductPayload = {
        id: initial?.id,
        name: name.trim(),
        inHindi: inHindi.trim() || undefined,
        category,
        marketPrice,
        price,
        unit,
        stockQty,
        minQty,
        maxQty,
        description: description.trim() || undefined,
        images: existingImages.map(i => ({ url: i.url, public_id: i.public_id })),
        grade,
        popular,
        // include tags
        tags: tags.length ? tags : undefined,
      };

      if (newImagesBase64.length === 1) payload.imageBase64 = newImagesBase64[0];
      if (newImagesBase64.length > 1) payload.imagesBase64 = newImagesBase64;

      onSubmit(payload);
    } catch (error) {
      console.error("ProductForm submit error:", error);
    }
  }

  return (
    <div className="fixed inset-1 z-50 flex items-end md:items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* modal container */}
      <div
        className="relative w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl border flex flex-col min-h-0"
        style={{
          borderColor: "var(--border-color)",
          maxHeight: "calc(var(--vh, 1vh) * 100 - 3.5rem)",
        }}
      >
        {/* header (sticky) */}
        <div
          className="p-5 border-b sticky top-0 bg-white z-20"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{initial ? "Edit Product" : "Add Product"}</h3>
            <button
              onClick={onCancel}
              className="rounded-lg border px-3 py-1 text-sm"
              style={{ borderColor: "var(--border-color)" }}
            >
              Close
            </button>
          </div>
        </div>

        {/* body */}
        <div
          className="p-5 grid gap-4 md:grid-cols-2 flex-1 overflow-y-auto min-h-0 pb-20"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Product Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Hindi Name</label>
            <input
              value={inHindi}
              onChange={(e) => setInHindi(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 capitalize"
              style={{ borderColor: "var(--border-color)" }}
              disabled={loadingCategories}
            >
              {loadingCategories ? <option>Loading...</option> : categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Market Price */}
          <div>
            <label className="block text-sm mb-1">Market Price (₹)</label>
            <input
              type="number"
              min="0"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />

            {errors.marketPrice && <p className="text-xs text-red-600 mt-1">{errors.marketPrice}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm mb-1">Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
            {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Product["unit"])}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <option value="kg">kg</option>
              <option value="piece">piece</option>
              <option value="dozen">dozen</option>
            </select>
          </div>

          {/* Min / Max */}
          <div>
            <label className="block text-sm mb-1">Min Limit</label>
            <input
              type="number"
              step={unit === "kg" ? 0.1 : 1}
              value={minQty}
              onChange={(e) => setMinQty(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max Limit</label>
            <input
              type="number"
              step={unit === "kg" ? 0.1 : 1}
              value={maxQty}
              onChange={(e) => setMaxQty(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
            {errors.limit && <p className="text-xs text-red-600 mt-1">{errors.limit}</p>}
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm mb-1">Stock Quantity ({unit})</label>
            <input
              type="number"
              min={0}
              step={unit === "kg" ? 0.1 : 1}
              value={stockQty}
              onChange={(e) => setStockQty(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
            {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as Product["grade"])}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <option value="Premium">Premium</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Popular</label>
            <select
              value={popular ? "true" : "false"}
              onChange={(e) => setPopular(e.target.value === "true")}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Images</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {existingImages.map(img => (
                <div key={img.public_id} className="relative">
                  <img src={img.url} alt="" className="h-20 w-20 object-cover rounded" />
                  <button onClick={() => removeExisting(img.public_id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-xs">✕</button>
                </div>
              ))}
              {newImagesBase64.map(b64 => (
                <div key={b64} className="relative">
                  <img src={b64} alt="" className="h-20 w-20 object-cover rounded" />
                  <button onClick={() => removeNew(b64)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-xs">✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleFile} />
          </div>

          {/* Tags UI */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Tags (press Enter or Add)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded p-2"
                placeholder="e.g. aalu, आलू, potato"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button type="button" onClick={addTag} className="px-3 py-2 border rounded">Add</button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-full border flex items-center gap-2">
                  <span className="text-sm">{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="text-xs leading-none px-1"
                    aria-label={`Remove tag ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length === 0 && <div className="text-sm text-gray-500">No tags yet</div>}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
          </div>
        </div>

        {/* footer (sticky) */}
        <div className="p-5 border-t sticky bottom-0 bg-white z-20" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
              Cancel
            </button>
            <button onClick={submit} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: "var(--primary-color)" }}>
              {initial ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
