"use client";

import Link from "next/link";
import Image from "next/image";

const grades = [
  {
    name: "Standard",
    description: "Affordable everyday essentials with reliable quality.",
    color: "from-gray-100 to-gray-200 border-gray-300",
    image: "/grade/1.jpg", 
    link: "/shop?grade=Standard",
  },
  {
    name: "Silver",
    description: "Better quality products for those who want more value.",
    color: "from-gray-200 to-gray-300 border-gray-400",
    image: "/grade/2.jpg",
    link: "/shop?grade=Silver",
  },
  {
    name: "Gold",
    description: "Premium collection with top-notch quality and features.",
    color: "from-yellow-100 to-yellow-200 border-yellow-400",
    image: "/grade/3.jpg",
    link: "/shop?grade=Gold",
  },
  {
    name: "Premium",
    description: "Exclusive products for the finest experience.",
    color: "from-green-100 to-green-200 border-green-600",
    image: "/grade/4.jpg",
    link: "/shop?grade=Premium",
  },
];

export default function Grade() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16" id="grade">
      <h1
        className="text-4xl font-bold text-center mb-12"
        style={{ color: "var(--primary-color)" }}
      >
        Explore Our Product Grades
      </h1>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {grades.map((grade) => (
          <Link
            key={grade.name}
            href={grade.link}
            className={`group relative border rounded-2xl p-6 shadow-md bg-gradient-to-b ${grade.color} transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl`}
          >
            {/* Grade Image */}
            <div className="w-50 h-50 mx-auto mb-6 relative">
              <Image
                src={grade.image}
                alt={grade.name}
                fill
                className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Content */}
            <h2
              className="text-2xl font-bold mb-3 group-hover:text-green-700 transition-colors"
              style={{ color: "var(--text-color)" }}
            >
              {grade.name}
            </h2>
            <p className="text-sm text-gray-600 group-hover:text-gray-800">
              {grade.description}
            </p>

            {/* Hover overlay glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[rgba(0,0,0,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
