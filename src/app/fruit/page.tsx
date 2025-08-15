export const metadata = {
  title: "Fruits - Sawariya Seasonal Fruits",
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