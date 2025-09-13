"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Slider from "react-slick";

interface SlideItem {
  url: string;
}

export default function HeroSection() {
  const [slides, setSlides] = useState<SlideItem[]>([]);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();

        if (data && data.length > 0) {
          // Local image + API images
          setSlides([
            { url: "/hero/hero.png" }, 
            ...data.map((item: SlideItem) => ({ url: item.url })),
          ]);
        } else {
          setSlides([{ url: "/hero/hero.png" }]);
        }
      } catch (error) {
        console.error("Error loading hero images:", error);
        setSlides([{ url: "/hero/hero.png" }]);
      }
    };
    fetchHeroImages();
  }, []);

  const settings = {
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: false,
    fade: true,
  };

  return (
    <section className="relative w-full h-[80vh] overflow-hidden">
      {/* Background Slider */}
      {slides.length > 0 && (
        <Slider {...settings} className="h-full">
          {slides.map((img, idx) => (
            <div key={idx} className="relative h-[80vh]">
              <Image
                src={img.url}
                alt={`Hero Slide ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ))}
        </Slider>
      )}

      {/* Fixed Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Farm Fresh to Your Doorstep
        </h1>
        <p className="text-lg md:text-xl mb-6">
          Fresh vegetables and fruits delivered directly from the farm.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition">
            Shop Now
          </button>
          <button className="bg-white hover:bg-gray-100 text-[var(--primary-color)] font-semibold py-3 px-6 rounded-lg shadow-lg transition">
            Check Delivery Area
          </button>
        </div>
      </div>
    </section>
  );
}
