"use client";

import Image from "next/image";
import React from "react";

interface Category {
    name: string;
    image: string;
}

const categories: Category[] = [
    {
        name: "Hearts",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQLywGgUG2owJEBT-eiqKVaHc12YiUruQFTw&s",
    },
    {
        name: "Vegetables",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBLv2-WncuU4dh_m0qMTvjaMpnWFeokkaR8xPoB1obhNMGlY8&s",
    },
    {
        name: "Organic Items",
        image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTdeJ6T0nIxEvq89BrevGcwx-ohqz9vPW7AJ2wU5bJZd-9neVb1zSwdBWP-F0q5ET-kRboSTYpD7c91roLNBz-7UL6pdCNRUiplgrWckUi5teJyvgTLpEL0O4A",
    },
    {
        name: "Seasonal Specials",
        image: "https://res.cloudinary.com/hz3gmuqw6/image/upload/c_fill,q_30,w_750/f_auto/12-seasonal-summer-vegetables-you-should-be-cooking-with-now-phpwt6INE",
    },
    {
        name: "Offers",
        image: "https://cdn1.vectorstock.com/i/1000x1000/88/10/discount-sale-poster-with-fresh-vegetable-vector-13778810.jpg",
    },
];

export default function Categories() {
    return (
        <section className="bg-[var(--background-color)] py-10 max-w-6xl mx-auto">
            <div className="container mx-auto px-4">
                <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-8">
                    Explore Our Categories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-sm border border-[var(--border-color)] hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                        >
                            <div className="relative w-full h-40">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-3 text-center">
                                <h3 className="text-lg font-medium text-[var(--text-color)]">
                                    {category.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
