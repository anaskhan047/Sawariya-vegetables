import ContactBanner from "../components/contact/ContactBAnner";
import ContactInfo from "../components/contact/ContactInfo";

export const metadata = {
  title: "Contact us  - Sawariya Vegetable",
};
export default function Contact () {
    return(
        <>
            <main>
                <ContactBanner />
                <ContactInfo />
            </main>
        </>
    )
}