"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import CircularLoader from '../../components/Loader/Loader'
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
  const [fetching, setFetching] = useState(false);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data as Category[]);
      else Swal.fire("Error", "Failed to fetch categories", "error");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong while fetching categories", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire("Warning", "Category name is required", "warning");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("name", name);
    if (file) form.append("image", file);

    const url = editId ? `/api/categories/${editId}` : `/api/categories`;
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: form });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Success", `Category ${editId ? "updated" : "created"} successfully`, "success");
        setName("");
        setFile(null);
        setPreview(null);
        setEditId(null);
        fetchCategories();
      } else {
        Swal.fire("Error", JSON.stringify(data.error), "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          Swal.fire("Deleted!", "Category has been deleted.", "success");
          fetchCategories();
        } else {
          Swal.fire("Error", "Failed to delete category", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
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
          className="px-4 py-2 rounded text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          {loading && <CircularLoader size={30} />}
          {editId ? "Update" : "Create"}
        </button>
      </form>

      {/* Loader while fetching categories */}
      {fetching ? (
        <div className="flex justify-center py-20">
          <CircularLoader size={60} />
        </div>
      ) : (
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
      )}
    </div>
  );
}
