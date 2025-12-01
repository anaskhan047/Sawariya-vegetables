export const metadata = {
  title: "Vegetables - Sawariya Seasonal Vegetables",
    description: "Discover our fresh and organic selection of seasonal vegetables delivered to your doorstep.",
    author: "Shri Sawariya Mart"
};
import VegeBanner from "../components/vegetables/Vegesbanner";
import VegetablePage from "../components/vegetables/vegesGrid";
export default function Vegetable () {
    return(
        <>
            <main>
                <VegeBanner />
                <VegetablePage />
            </main>
        </>
    )
}