"use client";

import Image from "next/image";
import React, { useState } from "react";

interface Product {
  name: string;
  price: string;
  unit: string;
  image: string;
}

const products: Product[] = [
  {
    name: "Fresh Tomatoes",
    price: "$2.99",
    unit: "KG",
    image: "https://3.imimg.com/data3/KV/TE/MY-4150308/tamato.jpeg",
  },
  {
    name: "Organic Spinach",
    price: "$3.49",
    unit: "Bunch",
    image: "https://www.greendna.in/cdn/shop/files/palak2_1200x1200.jpg?v=1715600291",
  },
  {
    name: "Sweet Apples",
    price: "$4.29",
    unit: "KG",
    image: "https://tiimg.tistatic.com/fp/1/007/491/healthy-nutritious-crunchy-slightly-bitter-taste-fresh-sweet-apple-019.jpg",
  },
  {
    name: "Green Bell Peppers",
    price: "$1.89",
    unit: "Each",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEjYBGn85vkAXQd-iWL-J82LrTP68Ik2MEmQ&s",
  },
  {
    name: "Farm Fresh Eggs",
    price: "$5.99",
    unit: "Dozen",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg63I9VoDOAfoXZv52OLpkap-laNKQyHFLtw&s",
  },
  {
    name: "Russet Potatoes",
    price: "$1.59",
    unit: "KG",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgra_540DpXPr8aYWtvwaRUCvAojGY4W7BLQ&s",
  },
  {
    name: "Avocados",
    price: "$2.50",
    unit: "Each",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjRAhuL8MMIhUrfWqQDE7f6iTwkrqscV7-bg&s",
  },
  {
    name: "Organic Carrots",
    price: "$2.79",
    unit: "Bunch",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbO19EKPDHbGwtfBuMegCjN_HS5ULMvsnm5g&s",
  },
];

export default function ProductGrid() {
  const [quantities, setQuantities] = useState<number[]>(products.map(() => 1));

  const updateQuantity = (index: number, value: number) => {
    setQuantities((prev) =>
      prev.map((q, i) => (i === index ? Math.max(1, q + value) : q))
    );
  };

  return (
    <section className="bg-[var(--background-color)] py-10 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-8">
                    Our Fresh Picks
                </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {products.map((product, index) => (
          <div
            key={index}
            className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative w-full h-48">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-[var(--text-light)] mb-3">
                {product.price} / {product.unit}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <button
                  className="px-2 py-1 border border-[var(--border-color)] rounded"
                  onClick={() => updateQuantity(index, -1)}
                >
                  -
                </button>
                <span className="w-8 text-center">{quantities[index]}</span>
                <button
                  className="px-2 py-1 border border-[var(--border-color)] rounded"
                  onClick={() => updateQuantity(index, 1)}
                >
                  +
                </button>
              </div>
              <button className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-medium py-2 rounded transition-colors duration-200">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
       <button
  className="px-6 py-2 border border-[var(--primary-color)] text-[var(--primary-color)]
             bg-transparent hover:bg-[var(--primary-color)] hover:text-white
             hover:border-[var(--secondary-color)]
             rounded transition-all duration-300 ease-in-out transform hover:scale-105"
>
  View All Products
</button>

      </div>
    </section>
  );
}
