import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "اتصل بنا",
  description: "تواصل مع فريق رحيق.",
};

export default function ContactPage() {
  return <ContactClient />;
}
