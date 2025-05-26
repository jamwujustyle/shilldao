"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// import AuthWrapper from "@/components/layout/AuthWrapper";

export default function Home() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Track if we're in the process of logging out
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect to dashboard if authenticated and on the homepage
  useEffect(() => {
    // Only redirect to dashboard if user is on the root path
    // This prevents redirecting when user is already on a specific page
    if (token && !isLoggingOut && pathname === "/") {
      const redirectTimer = setTimeout(() => {
        router.push("/dashboard");
      }, 100);

      return () => clearTimeout(redirectTimer);
    }

    // If token disappears (logout), store the current path and set logging out state
    if (!token && !isLoggingOut && pathname !== "/") {
      setIsLoggingOut(true);

      // Reset the logging out state after a delay
      const resetTimer = setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000); // Longer delay to ensure wallet disconnect completes

      return () => clearTimeout(resetTimer);
    }
  }, [token, router, isLoggingOut, pathname]);

  return (
    // <AuthWrapper>
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-2xl font-bold">Welcome to ShillDAO</h1>
        <p className="text-center sm:text-left">
          Connect your wallet to get started.
        </p>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Documentation
        </a>
      </footer>
    </div>
    // </AuthWrapper>
  );
}
