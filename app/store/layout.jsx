import StoreLayout from "@/components/store/StoreLayout";
import { SignedIn } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "GoCart - Store",
  description: "GoCart - Store",
};

export default function RootStoreLayout({ children }) {
  return (
   
    <SignedIn>
        <StoreLayout>{children}</StoreLayout>
    </SignedIn>
    
  );
}