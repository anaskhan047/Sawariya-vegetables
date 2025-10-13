"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Slide item interface
interface SlideItem {
  url: string;
}

interface Area {
  _id: string;
  name: string;
  pincode: string;
}

export default function HeroSection() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showAreas, setShowAreas] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
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

  // Load delivery areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("/api/delivery-area");
        const data = await res.json();
        if (res.ok) setAreas(data);
      } catch (err) {
        console.error("Failed to fetch delivery areas", err);
      }
    };
    fetchAreas();
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
        <div className="flex flex-col items-center gap-4 relative">
          <button
            onClick={() => router.push('/shop')}
            className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors duration-300"
          >
            Shop Now
          </button>

          <div className="relative w-full">
            <button
              onClick={() => setShowAreas(!showAreas)}
              className="bg-white hover:bg-gray-100 text-[var(--primary-color)] font-semibold py-3 px-6 rounded-lg shadow-lg transition w-full"
            >
              {showAreas ? "Hide Delivery Areas" : "Check Delivery Area"}
            </button>

            <AnimatePresence>
              {showAreas && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg p-4 text-gray-800 h-40 overflow-y-auto z-50"
                >
                  <h3 className="font-semibold mb-2 text-[var(--primary-color)]">
                    Available Areas
                  </h3>
                  {areas.length > 0 ? (
                    <ul className="space-y-2 text-left">
                      {areas.map((area) => (
                        <li
                          key={area._id}
                          className="px-3 py-2 border-b last:border-none text-sm"
                        >
                          {area.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No areas available.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </section>
  );
}
