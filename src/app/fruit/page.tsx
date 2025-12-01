export const metadata = {
  title: "Fruits - Sawariya Seasonal Fruits",
    description: "Explore our fresh and organic selection of seasonal fruits delivered to your doorstep.",
    author: "Shri Sawariya Mart"
};
import FruitBanner from "../components/fruit/fruitbanner";
import FruitsPage from "../components/fruit/fruitcard";
export default function Fruit () {
    return(
        <>
            <main>
                <FruitBanner />
                <FruitsPage />
            </main>
        </>
    )
}