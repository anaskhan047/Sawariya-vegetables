import Categories from "./components/landing/Category";
import Grade from "./components/landing/Grade";
import HeroSection from "./components/landing/HeroSection";
import ProductGrid from "./components/landing/ProductGrd";
import Testimonials from "./components/landing/Testimonials";
import WhyChoose from "./components/landing/WhyChoose";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Categories />
      <Grade />
      <ProductGrid />
      <WhyChoose />
      <Testimonials />
    </>
  );
}
