import { ClerkProvider } from "@clerk/nextjs";
import StoreProvider from "./StoreProvider";
import "./globals.css";
import { SignedOut, SignIn , SignedIn } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedIn>
          <StoreProvider>
            {children} {/* This will render the content of /store/layout.jsx if SignedIn */}
          </StoreProvider>
          </SignedIn>
          <SignedOut>
            {/* This div will only be rendered if the user is signed out */}
            <div className="min-h-screen flex items-center justify-center">
              <SignIn fallbackRedirectUrl="/store" routing="hash" />
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}