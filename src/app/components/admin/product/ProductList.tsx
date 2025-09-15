"use client";

import { Product } from "@/app/lib/types";

type Props = {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
};

export default function ProductList({ products, onEdit, onDelete }: Props) {
  return (
    <section className="rounded-xl border bg-white shadow-sm" style={{ borderColor: "var(--border-color)" }}>
      {/* table for larger screens */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm" style={{ color: "var(--text-light)" }}>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Limits</th>
               <th className="p-3">Grade</th>
    <th className="p-3">Popular</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const imageUrl = p.imageData || p.images?.[0]?.url;
              return (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt={p.name} className="h-12 w-12 object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-light)" }}>{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">₹ {p.price.toFixed(2)}</td>
                  <td className="p-3">{p.unit}</td>
                  <td className="p-3">{p.minQty} – {p.maxQty} {p.unit}</td>
                    <td className="p-3">{p.grade}</td>
      <td className="p-3">{p.popular ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {p.stockQty > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{p.stockQty} {p.unit} left</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Out of Stock</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => onEdit(p)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--border-color)" }}>Edit</button>
                      <button onClick={() => onDelete(p.id)} className="px-3 py-1.5 rounded-lg text-white text-sm" style={{ backgroundColor: "var(--secondary-color)" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-sm" style={{ color: "var(--text-light)" }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* cards for smaller screens */}
      <div className="grid gap-4 p-4 lg:hidden">
        {products.map((p) => {
          const imageUrl = p.imageData || p.images?.[0]?.url;
          return (
            <div key={p.id} className="border rounded-lg p-4 bg-white" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {imageUrl ? <img src={imageUrl} alt={p.name} className="h-14 w-14 object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm font-medium">₹ {p.price.toFixed(2)} / {p.unit}</div>
                  <div className="text-xs" style={{ color: "var(--text-light)" }}>Limit: {p.minQty} – {p.maxQty} {p.unit}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stockQty > 0 ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                      {p.stockQty > 0 ? `${p.stockQty} ${p.unit} left` : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => onEdit(p)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border-color)" }}>Edit</button>
                <button onClick={() => onDelete(p.id)} className="flex-1 px-3 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: "var(--secondary-color)" }}>Delete</button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && <div className="text-center text-sm py-8" style={{ color: "var(--text-light)" }}>No products found.</div>}
      </div>
    </section>
  );
}
