"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface HeroImage {
  _id: string;
  url: string;
  public_id: string;
}

export default function HeroImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing images from API
  const fetchImages = async () => {
    try {
      const res = await fetch("/api/hero");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data: HeroImage[] = await res.json();
      setImages(data);
    } catch (error) {
      console.error(error);
      alert("❌ Failed to load images");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Upload image to API
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select an image");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;

        const res = await fetch("/api/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, section: "hero" }),
        });

        const data = await res.json();
        if (data.success) {
          alert("✅ Image uploaded successfully!");
          setFile(null);
          setPreview(null);
          fetchImages();
        } else {
          alert("❌ Upload failed");
        }
      } catch (error) {
        console.error(error);
        alert("❌ Upload failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete image
  const handleDelete = async (public_id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch("/api/hero", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      const data = await res.json();
      if (data.success) {
        alert("🗑 Image deleted");
        fetchImages();
      } else {
        alert("❌ Delete failed");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Delete failed");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1
        style={{
          color: "var(--primary-color)",
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        🖼 Manage Hero Images
      </h1>

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        style={{
          background: "var(--card-bg)",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: ".5rem",
            color: "var(--text-color)",
          }}
        >
          Select Image:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{
            display: "block",
            marginBottom: "1rem",
            padding: ".4rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
          }}
        />

        {preview && (
          <div style={{ marginBottom: "1rem" }}>
            <Image
              src={preview}
              alt="Preview"
              width={300}
              height={200}
              style={{
                maxWidth: "300px",
                borderRadius: "8px",
                border: "2px solid var(--primary-color)",
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--primary-color)",
            color: "#fff",
            padding: "0.6rem 1.2rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Display Uploaded Images */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {images.map((img) => (
          <div
            key={img._id}
            style={{
              background: "var(--card-bg)",
              padding: "1rem",
              borderRadius: "12px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
              textAlign: "center",
            }}
          >
            <Image
              src={img.url}
              alt="Hero"
              width={300}
              height={150}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: ".5rem",
              }}
            />
            <button
              onClick={() => handleDelete(img.public_id)}
              style={{
                background: "var(--danger-color)",
                color: "#ff0000",
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
