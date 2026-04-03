"use client";

import Image from "next/image";
import Link from "next/link";

const grades = [
  {
    name: "Standard",
    description: "Affordable everyday essentials with reliable quality.",
    color: "from-slate-100 to-slate-200 border-slate-300",
    accent: "bg-slate-700",
    image: "/grade/1.jpg",
    link: "/shop?grade=Standard",
  },
  {
    name: "Silver",
    description: "Balanced quality and value for smarter daily shopping.",
    color: "from-zinc-100 to-zinc-200 border-zinc-300",
    accent: "bg-zinc-700",
    image: "/grade/2.jpg",
    link: "/shop?grade=Silver",
  },
  {
    name: "Gold",
    description: "Premium picks with richer freshness and better finish.",
    color: "from-amber-100 to-yellow-200 border-amber-300",
    accent: "bg-amber-600",
    image: "/grade/3.jpg",
    link: "/shop?grade=Gold",
  },
  {
    name: "Premium",
    description: "Our finest selection curated for the best experience.",
    color: "from-emerald-100 to-lime-100 border-emerald-300",
    accent: "bg-emerald-600",
    image: "/grade/4.jpg",
    link: "/shop?grade=Premium",
  },
];

export default function Grade() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-3 py-10 sm:px-5 sm:py-14 md:py-16" id="grade">
      <div className="absolute inset-x-0 top-6 -z-10 mx-auto h-32 w-[92%] rounded-3xl bg-gradient-to-r from-emerald-100 via-amber-50 to-cyan-100 blur-2xl" />

      <div className="mb-8 text-center sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Quality Tiers</p>
        <h1
          className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-4xl"
          style={{ fontFamily: '"Poppins", "Segoe UI", sans-serif' }}
        >
          Explore Our Product Grades
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Choose the grade that matches your budget and preference. Every tier is curated for freshness and consistency.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {grades.map((grade) => (
          <Link
            key={grade.name}
            href={grade.link}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.16)] sm:p-4 ${grade.color}`}
          >
            <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/60 sm:mb-4">
              <Image
                src={grade.image}
                alt={grade.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={grade.name === "Standard" || grade.name === "Silver"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent opacity-70" />
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow ${grade.accent}`}
              >
                {grade.name}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{grade.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs text-slate-700 sm:text-sm">{grade.description}</p>

            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 sm:mt-4 sm:text-xs">
              Shop this grade
              <span aria-hidden>›</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
