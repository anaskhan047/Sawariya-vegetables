"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import gsap from "gsap";

// Slide item interface
interface SlideItem {
  url: string;
}

export default function HeroSection() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Load slides (local + API)
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();
        setSlides(
          data && data.length > 0
            ? [{ url: "/hero/hero.png" }, ...data.map((item: SlideItem) => ({ url: item.url }))]
            : [{ url: "/hero/hero.png" }]
        );
      } catch (error) {
        setSlides([{ url: "/hero/hero.png" }]);
      }
    };
    fetchHeroImages();
  }, []);

  // GSAP animation for content
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [slides]);

  // Swiper slider settings
  const settings = {
    modules: [Autoplay, EffectFade],
    effect: "fade",
    autoplay: slides.length > 1 ? { delay: 4000 } : false,
    speed: 800,
    slidesPerView: 1,
    slidesPerGroup: 1,
    loop: slides.length > 1,
    fadeEffect: { crossFade: true },
    // arrows: true,
    // pauseOnHover: false,
  };

  return (
    <section className="relative w-full h-[80vh] overflow-hidden">
      {/* Swiper Slider */}
      {slides.length > 0 && (
        <Swiper {...settings} className="h-full">
          {slides.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative h-[80vh]">
                <Image
                  src={img.url}
                  alt={`Hero Slide ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  loading="eager"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Animated Content */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-4"
      >
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
