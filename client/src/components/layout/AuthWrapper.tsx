"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import UnauthorizedAccess from "@/components/layout/UnauthorizaedAccess"; // Corrected import name if typo was fixed, using provided name

type AuthWrapperProps = {
  children: ReactNode;
};

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { token } = useAuth(); // ethAddress not needed here for this logic
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Still return null or a minimal loader during SSR or before client check
    return null;
  }

  if (!token) {
    // If not authenticated on the client, show the unauthorized message
    return (
      <UnauthorizedAccess
        title="Authentication Required"
        description="Please connect your wallet to access this page."
        showApplyButton={false}
        variant="authentication" // Add variant prop
      />
    );
  }

  // If authenticated, render children
  return <>{children}</>; // Using React.Fragment for clarity, or just children
};

export default AuthWrapper;
