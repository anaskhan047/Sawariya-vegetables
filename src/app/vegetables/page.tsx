export const metadata = {
  title: "Vegetables - Sawariya Seasonal Vegetables",
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