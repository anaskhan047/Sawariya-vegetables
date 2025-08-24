"use client";

import ProductForm from "@/app/components/admin/product/ProductForm";
import ProductList from "@/app/components/admin/product/ProductList";
import { readProducts, writeProducts } from "@/app/lib/storage";
import { CATEGORIES, Product } from "@/app/lib/types";
import { useEffect, useMemo, useState } from "react";

const uid = () => "PRD" + Math.floor(1000 + Math.random() * 9000).toString();

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"" | Product["category"]>("");

  useEffect(() => {
    // load from storage (seed once if empty)
    const loaded = readProducts();
    setProducts(loaded);
  }, []);

  useEffect(() => {
    // persist on change
    writeProducts(products);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = cat ? p.category === cat : true;
      const matchesQ =
        q.trim() === ""
          ? true
          : [p.name, p.description ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase());
      return matchesCat && matchesQ;
    });
  }, [products, q, cat]);

  const onAdd = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const onEdit = (p: Product) => {
    setEditing(p);
    setIsFormOpen(true);
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const onSubmit = (data: Product) => {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } else {
      setProducts((prev) => [{ ...data, id: uid() }, ...prev]);
    }
    setIsFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
          Product Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            + Add Product
          </button>
          <button
            onClick={() => {
              setQ("");
              setCat("");
            }}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border-color)" }}
          >
            Clear Filters
          </button>
        </div>
      </header>

      {/* Filters */}
      <section
        className="rounded-xl p-4 border bg-white shadow-sm"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-light)" }}>
              Search (name / SKU / description)
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search…"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-light)" }}>
              Category
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as Product["category"] | "")}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                background: "var(--accent-color)",
                color: "#1f2937",
                fontWeight: 600,
              }}
            >
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <ProductList products={filtered} onEdit={onEdit} onDelete={onDelete} />

      {/* Drawer / Modal Form */}
      {isFormOpen && (
        <ProductForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onCancel={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
