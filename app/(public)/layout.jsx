"use client"
import { ClerkProvider } from "@clerk/nextjs";
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }) {

    return (
        <ClerkProvider>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </ClerkProvider>
    );
}
