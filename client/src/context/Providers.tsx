"use client";

import { WagmiConfig } from "wagmi"; // Remove createConfig, mainnet, http imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeProvider"; // Import the new ThemeProvider
import { wagmiConfigInstance } from "./wagmiConfig"; // Import the configured instance
import { useToast as useCustomToast } from "@/components/ui/Toast"; // Import your custom useToast

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const { ToastContainer: CustomToastContainer } = useCustomToast(); // Get the ToastContainer from your custom hook

  return (
    // Wrap everything with ThemeProvider
    <ThemeProvider>
      {/* Use the imported config instance */}
      <WagmiConfig config={wagmiConfigInstance}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
            <CustomToastContainer />{" "}
            {/* Render your custom ToastContainer here */}
          </AuthProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ThemeProvider>
  );
}
