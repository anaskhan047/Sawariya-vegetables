"use client";

import ProductForm from "@/app/components/admin/product/ProductForm";
import ProductList from "@/app/components/admin/product/ProductList";
import { Product } from "@/app/lib/types";
import { useEffect, useMemo, useState } from "react";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/lib/api/products";

interface Category {
  id: string;
  name: string;
}

// Types
export type ProductPayload = Partial<Omit<Product, "id">> & { id?: string };

// Custom Hook for Products
function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await fetchProducts();
        setProducts(items);
      } catch (err) {
        console.error("Load products failed:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { products, setProducts, loading };
}

// Custom Hook for Categories
function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data: { success: boolean; data: Category[]; error?: string } = await res.json();

        if (data.success) {
          setCategories(data.data.map((c) => c.name));
        } else {
          console.error("Failed to fetch categories:", data.error);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { categories, loading };
}

// Page Component
export default function ProductsPage() {
  const { products, setProducts, loading } = useProducts();
  const { categories, loading: loadingCategories } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"" | Product["category"]>("");

  // Filtering logic
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

  // Handlers
  const onAdd = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const onEdit = (p: Product) => {
    setEditing(p);
    setIsFormOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id)); // optimistic remove

    try {
      await deleteProduct(id);
    } catch (err) {
      console.error("delete failed", err);
      alert("❌ Could not delete product");
      setProducts(prev); // rollback
    }
  };

  const onSubmit = async (data: ProductPayload) => {
    try {
      if (editing) {
        const prev = products;
        setProducts((p) =>
          p.map((x) => (x.id === data.id ? { ...x, ...data } : x))
        );
        try {
          const updated = await updateProduct(data.id!, data);
          setProducts((p) =>
            p.map((x) => (x.id === updated.id ? updated : x))
          );
        } catch (err) {
          console.error("update failed:", err);
          setProducts(prev);
          alert("❌ Could not update product");
        }
      } else {
        const temp = { ...data, id: "TEMP-" + Date.now() } as Product;
        setProducts((p) => [temp, ...p]);

        try {
          const { id, ...rest } = data;
          const payload = id === undefined ? rest : { ...data, id };
          const created = await createProduct(payload as Product);
          setProducts((p) =>
            [created, ...p.filter((x) => x.id !== temp.id)]
          );
        } catch (err) {
          console.error("create failed:", err);
          setProducts((p) => p.filter((x) => x.id !== temp.id));
          alert("❌ Could not create product");
        }
      }

      setIsFormOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("save product failed:", err);
      alert("❌ Could not save product");
    }
  };

  // ===== New: Decrease stock after order =====
  const decreaseStock = async (orderItems: { productId: string; quantity: number }[]) => {
  // Update frontend optimistically
  setProducts((prev: Product[]) =>
    prev.map((p: Product) => {
      const orderedItem = orderItems.find((i) => i.productId === p.id);
      if (orderedItem) {
        const newStock = Math.max(0, (p.stockQty || 0) - orderedItem.quantity);
        return { ...p, stockQty: newStock };
      }
      return p;
    })
  );

  // Update backend in one go
  try {
    await Promise.all(
      orderItems.map(async (item) => {
        const product = await fetchProducts().then((prods) =>
          prods.find((p: Product) => p.id === item.productId)
        );
        if (!product) return;

        const newStock = Math.max(0, (product.stockQty || 0) - item.quantity);

        // Important: update only stockQty field
        await updateProduct(item.productId, { stockQty: newStock });
      })
    );
  } catch (err) {
    console.error("Failed to update stock", err);
    // Optionally, refetch products to ensure frontend matches backend
  }
};



  // ==========================================

  // Example usage after an order (replace this with your actual order placement code)
  // decreaseStock([{ productId: "68ceec644cdeb18e71c44145", quantity: 2 }]);

  // UI
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
          {/* Search */}
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-light)" }}>
              Search (name / description)
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search…"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-light)" }}>
              Category
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as Product["category"] | "")}
              className="w-full rounded-lg border px-3 py-2 capitalize"
              style={{ borderColor: "var(--border-color)" }}
              disabled={loadingCategories}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div className="flex items-end">
            <div
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                background: "var(--accent-color)",
                color: "#1f2937",
                fontWeight: 600,
              }}
            >
              {loading ? "Loading…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
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
