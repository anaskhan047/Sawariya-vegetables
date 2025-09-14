"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface LoaderProps {
  size?: number; // diameter of center circle
  className?: string;
}

// Vegetable icons
const veggies = [
  "https://png.pngtree.com/png-vector/20240625/ourlarge/pngtree-single-red-fresh-tomato-png-image_12847336.png",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3nPCskOU6b174Y2xQH28FED-lT_07gMmPGw&s",
  "https://png.pngtree.com/png-vector/20240625/ourlarge/pngtree-single-red-fresh-tomato-png-image_12847336.png",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3nPCskOU6b174Y2xQH28FED-lT_07gMmPGw&s",
];

export default function OrbitVegetableLoader({ size = 80, className = "" }: LoaderProps) {
  const [rotation, setRotation] = useState(0);

  // continuously rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 2); // rotate 2deg per tick
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, []);

  const radius = size * 1.5; // radius of orbit

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: radius * 2, height: radius * 2 }}>
      {/* Center Circle */}
      <div
        className="rounded-full border-4 border-gray-300 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-600 font-medium text-sm">Loading</span>
      </div>

      {/* Orbiting Vegetables */}
      {veggies.map((veg, index) => {
        const angle = (360 / veggies.length) * index + rotation;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        return (
          <div
            key={index}
            className="absolute"
            style={{ left: `50%`, top: `50%`, transform: `translate(${x}px, ${y}px)` }}
          >
            <Image src={veg} alt="Veggie" width={30} height={30} className="rounded-full shadow-lg" />
          </div>
        );
      })}
    </div>
  );
}
