import ContactBanner from "../components/contact/ContactBanner";
import ContactInfo from "../components/contact/ContactInfo";

export const metadata = {
  title: "Contact us  - Sawariya Vegetable",
    description: "Get in touch with Sawariya Vegetable for fresh and organic produce delivered to your doorstep.",
    author: "Shri Sawariya Mart"
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
