import Categories from "./components/landing/Category";
import HeroSection from "./components/landing/HeroSection";
import ProductGrid from "./components/landing/ProductGrd";
import WhyChoose from "./components/landing/WhyChoose";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Categories />
      <ProductGrid />
      <WhyChoose />
    </>
  );
}
