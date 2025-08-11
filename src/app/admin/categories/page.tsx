"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data as Category[]);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name required");

    setLoading(true);
    const form = new FormData();
    form.append("name", name);
    if (file) form.append("image", file);

    const url = editId ? `/api/categories/${editId}` : `/api/categories`;
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: form });
    const data = await res.json();
    if (data.success) {
      setName("");
      setFile(null);
      setPreview(null);
      setEditId(null);
      fetchCategories();
    } else {
      alert("Error: " + JSON.stringify(data.error));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setName(cat.name);
    setEditId(cat._id);
    setPreview(cat.imageUrl || null);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--root-color)" }}>
        Manage Categories
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded mb-6">
        <input
          type="text"
          placeholder="Category Name"
          className="border p-2 rounded w-full mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          className="mb-2"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
              setPreview(URL.createObjectURL(e.target.files[0]));
            }
          }}
        />
        {preview && (
          <Image
            src={preview}
            alt="Preview"
            width={100}
            height={100}
            className="h-24 w-auto object-cover rounded mb-2"
          />
        )}
        <button
          disabled={loading}
          className="px-4 py-2 rounded text-white"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          {editId ? "Update" : "Create"}
        </button>
      </form>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white shadow rounded p-2 flex flex-col items-center">
            {cat.imageUrl && (
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                width={300}
                height={200}
                className="h-32 w-full object-cover rounded"
              />
            )}
            <p className="mt-2 font-semibold">{cat.name}</p>
            <div className="flex gap-2 mt-2">
              <button
                className="px-2 py-1 bg-yellow-500 text-white rounded"
                onClick={() => handleEdit(cat)}
              >
                Edit
              </button>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleDelete(cat._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
