// src/app/components/admin/product/ProductForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Product, CATEGORIES } from "@/app/lib/types";

interface Props {
  initial?: Product;
  onSubmit: (data: ProductPayload) => void; // Accept ProductPayload
  onCancel: () => void;
}


// Payload type = partial product with image upload fields
type ProductPayload = Partial<Product> & {
  imageBase64?: string;
  imagesBase64?: string[];
};

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Product["category"]>(initial?.category ?? "Leafy Greens");
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [unit, setUnit] = useState<Product["unit"]>(initial?.unit ?? "kg");
  const [stockQty, setStockQty] = useState<number>(initial?.stockQty ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [minQty, setMinQty] = useState<number>(initial?.minQty ?? (unit === "kg" ? 0.5 : 1));
  const [maxQty, setMaxQty] = useState<number>(initial?.maxQty ?? (unit === "kg" ? 10 : 5));

  // existing images (from backend) we will keep unless user removes
  const [existingImages, setExistingImages] = useState<{ url: string; public_id: string }[]>(initial?.images ?? []);
  // new images as base64 strings (to be uploaded)
  const [newImagesBase64, setNewImagesBase64] = useState<string[]>([]);
  // validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!validate()) return;

    const payload: ProductPayload = {
      id: initial?.id,
      name: name.trim(),
      category,
      price,
      unit,
      stockQty,
      minQty,
      maxQty,
      description: description.trim() || undefined,
      images: existingImages.map(i => ({ url: i.url, public_id: i.public_id })),
    };

    if (newImagesBase64.length === 1) payload.imageBase64 = newImagesBase64[0];
    if (newImagesBase64.length > 1) payload.imagesBase64 = newImagesBase64;

    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl border" style={{ borderColor: "var(--border-color)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{initial ? "Edit Product" : "Add Product"}</h3>
            <button onClick={onCancel} className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: "var(--border-color)" }}>Close</button>
          </div>
        </div>

        <div className="p-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Product Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Product["category"])} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
            {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as Product["unit"])} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }}>
              <option value="kg">kg</option>
              <option value="piece">piece</option>
              <option value="dozen">dozen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Min Limit</label>
            <input type="number" step={unit === "kg" ? "0.1" : "1"} value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
          </div>

          <div>
            <label className="block text-sm mb-1">Max Limit</label>
            <input type="number" step={unit === "kg" ? "0.1" : "1"} value={maxQty} onChange={(e) => setMaxQty(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
            {errors.limit && <p className="text-xs text-red-600 mt-1">{errors.limit}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Stock Quantity ({unit})</label>
            <input type="number" min={0} step={unit === "kg" ? 0.1 : 1} value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
            {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Images</label>
            <div className="flex gap-2 mb-2">
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

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-color)" }} />
          </div>
        </div>

        <div className="p-5 border-t flex gap-2 justify-end" style={{ borderColor: "var(--border-color)" }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: "var(--primary-color)" }}>{initial ? "Save Changes" : "Add Product"}</button>
        </div>
      </div>
    </div>
  );
}
