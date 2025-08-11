"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DynamicChange() {
  const router = useRouter();
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();
        if (data && data.length > 0) {
          setHeroImage(data[0].url); // First image from API
        }
      } catch (error) {
        console.error("Error fetching hero image:", error);
      }
    };
    fetchHeroImage();
  }, []);

  const sections = [
    {
      title: "Hero Section Image",
      desc: "Change the main banner image displayed to users.",
      img: heroImage,
      onClick: () => {
        router.push("/admin/ui/addHeroImage");
      },
    },
    {
      title: "Homepage Banner",
      desc: "Update promotional banners for homepage.",
      img: null,
      onClick: () => {},
    },
    {
      title: "Product Card Image",
      desc: "Edit default product display image.",
      img: null,
      onClick: () => {},
    },
    {
      title: "Category Thumbnails",
      desc: "Change images shown for categories.",
      img: null,
      onClick: () => {},
    },
    {
      title: "Footer Background",
      desc: "Update footer background gradient or image.",
      img: null,
      onClick: () => {},
    },
    {
      title: "Custom UI Section",
      desc: "Modify other UI elements dynamically.",
      img: null,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background-color)] p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-[var(--primary-color)] mb-6">
        Dynamic Changes – Admin
      </h1>

      {/* Description */}
      <p className="text-[var(--text-light)] mb-8 max-w-2xl">
        Manage dynamic images and UI elements shown on the user side.
        Click a section below to update its content in real-time.
      </p>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <div
            key={index}
            className="border border-[var(--border-color)] rounded-xl shadow-sm hover:shadow-md transition bg-white overflow-hidden"
          >
            {/* Image Preview */}
            <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              {section.img ? (
                <Image
                  width={500}
                  height={300}
                  src={section.img}
                  alt={section.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                "Preview Image"
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">
                {section.title}
              </h2>
              <p className="text-[var(--text-light)] text-sm mt-1 mb-4">
                {section.desc}
              </p>
              <button
                className="px-4 py-2 text-white rounded-md bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] transition"
                onClick={section.onClick}
              >
                Change
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
