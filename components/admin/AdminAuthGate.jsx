"use client"
import { useAuth, SignInButton } from "@clerk/nextjs";
import Loading from "../Loading";

export default function AdminAuthGate({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait for Clerk to initialize to avoid race conditions or hydration mismatches
  if (!isLoaded) return <Loading />;

  return (
    <>
      {isSignedIn ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="mb-4 text-slate-600">You must be signed in to access the admin area.</p>
            <SignInButton mode="modal" fallbackRedirectUrl="/admin">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                Sign in to Admin
              </button>
            </SignInButton>
          </div>
        </div>
      )}
    </>
  );
}
