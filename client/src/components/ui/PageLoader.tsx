"use client";

import React from "react";
import AuthWrapper from "@/components/layout/AuthWrapper";

interface PageLoaderProps {
  text?: string;
  minHeight?: string; // e.g., "min-h-[500px]" or "min-h-screen"
}

const PageLoader: React.FC<PageLoaderProps> = ({
  text = "Loading...",
  minHeight = "min-h-[500px]",
}) => {
  return (
    <AuthWrapper>
      <div className={`p-6 flex justify-center items-center ${minHeight}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{text}</p>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default PageLoader;
