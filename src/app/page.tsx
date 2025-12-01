import { auth } from "firebase-admin";
import AboutUs from "./components/landing/About";
import Categories from "./components/landing/Category";
import Grade from "./components/landing/Grade";
import HeroSection from "./components/landing/HeroSection";
import ProductGrid from "./components/landing/ProductGrd";
import Testimonials from "./components/landing/Testimonials";
import WhyChoose from "./components/landing/WhyChoose";
const metadata = {
  title: "Shri Sawariya Mart",
  description: "Fresh and organic vegetables delivered to your doorstep",
  author: "Shri Sawariya Mart"
};
export default function Home() {
  return (
    <>
      <HeroSection />
      <Categories />
      <AboutUs />
      <Grade />
      <ProductGrid />
      <WhyChoose />
      <Testimonials />
    </>
  );
}
