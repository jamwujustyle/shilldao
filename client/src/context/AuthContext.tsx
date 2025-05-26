"use client";

import { useAccount, useDisconnect, useConnectorClient } from "wagmi";
import { signMessage } from "@wagmi/core"; // Import signMessage action
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation"; // Import usePathname
import { authService } from "@/services/AuthService";
import Cookies from "js-cookie";
// Remove ethers imports if no longer needed elsewhere
// import { BrowserProvider, Eip1193Provider, JsonRpcSigner } from "ethers";
import { wagmiConfigInstance } from "./wagmiConfig"; // Import wagmi config

interface AuthContextType {
  token: string | null;
  ethAddress: string | null; // Add state for ETH address
  role: string | null;
  login: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setEthAddress: (address: string | null) => void; // Add function to set address
  handleLoginAttempt: () => Promise<void>; // New function to manually initiate login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define AuthProvider component correctly
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Hooks must be called at the top level
  const {
    address: connectedAddress,
    isConnected,
    isDisconnected,
  } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: client } = useConnectorClient(); // Get client for signing

  // State variables must also be at the top level
  const [token, setToken] = useState<string | null>(null);
  const [ethAddress, setEthAddressState] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Removed redirectToDashboard state
  const [justLoggedOut, setJustLoggedOut] = useState(false); // Guard to prevent immediate re-login after logout
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  // Stable function to update address state
  const setEthAddress = useCallback((address: string | null) => {
    console.log("Setting ETH Address in Context:", address);
    setEthAddressState(address);
  }, []); // Empty dependency array means this function reference is stable
  const [role, setRole] = useState<string | null>(null);

  // Define logout with useCallback
  const logout = useCallback(() => {
    console.log("User logging out...");

    // Set guard first to prevent any re-login attempts during logout process
    setJustLoggedOut(true);

    // Clear all auth state
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    Cookies.remove("refreshToken");
    setRole(null);
    setToken(null);
    setEthAddress(null);
    setIsLoggingIn(false);

    // Disconnect wallet immediately
    if (disconnect) {
      console.log("AuthContext: Calling disconnect()...");
      disconnect();
    } else {
      console.log("AuthContext: disconnect() function not available.");
    }

    // Navigate immediately after clearing state and initiating disconnect
    console.log(
      "AuthContext: Logout complete. User will remain on the current page."
    );
    // router.push("/dashboard"); // Removed redirection

    // Removed timeouts
  }, [disconnect, setEthAddress]); // Removed router dependency

  // Define login with useCallback
  const login = useCallback(
    async (walletAddress: string, signature: string, message: string) => {
      console.log("Attempting login via AuthContext...");
      // Check isLoggingIn state *before* setting it
      if (isLoggingIn) {
        console.log("Login already in progress, skipping.");
        return;
      }
      setIsLoggingIn(true); // Set logging in state
      try {
        const { access, refresh, role } = await authService.verify(
          walletAddress,
          signature,
          message
        );
        // Log received tokens
        console.log("AuthContext: Verification successful. Received tokens:", {
          access: !!access,
          refresh: !!refresh,
          role: !!role,
        });

        localStorage.setItem("token", access);
        Cookies.set("refreshToken", refresh, { expires: 7 });
        setToken(access);
        setRole(role);
        localStorage.setItem("role", role);
        setEthAddress(walletAddress); // Use stable setter
        console.log(
          "AuthContext: Verification successful. Setting state and redirecting..."
        );

        // Retrieve the stored redirect path, default to dashboard if none
        const redirectPath =
          localStorage.getItem("redirectPath") || "/dashboard";
        localStorage.removeItem("redirectPath"); // Clear the stored path

        console.log(`AuthContext: Redirecting to ${redirectPath}`);
        router.push(redirectPath);
      } catch (error) {
        // Log the specific error
        console.error(
          "AuthContext: Login function failed after verify call:",
          error
        );
        logout(); // Call stable logout on failure
      } finally {
        setIsLoggingIn(false); // Reset logging in state regardless of outcome
      }
    },
    [logout, isLoggingIn, setEthAddress, setIsLoggingIn, router] // Added router dependency
  );

  // Define refreshToken with useCallback
  const refreshToken = useCallback(async () => {
    console.log("Attempting token refresh...");
    try {
      const refresh = Cookies.get("refreshToken");
      if (!refresh) {
        console.log("No refresh token found.");
        throw new Error("No refresh found");
      }
      const { access } = await authService.refresh(refresh);
      localStorage.setItem("token", access);
      Cookies.set("refreshToken", refresh, { expires: 7 });
      setToken(access);
      console.log("Token refreshed successfully.");
    } catch (error) {
      console.error("Error refreshing token: ", error);
      logout(); // Call stable logout
    }
  }, [logout]);

  // Define handleLoginAttempt with useCallback
  const handleLoginAttempt = useCallback(async () => {
    if (justLoggedOut) {
      console.log(
        "AuthContext: Skipping login attempt due to justLoggedOut guard."
      );
      return;
    }
    console.log("AuthContext: Checking conditions for login attempt...", {
      isConnected,
      hasAddress: !!connectedAddress,
      hasClient: !!client,
      hasToken: !!token,
      isLoggingIn,
    });

    if (isConnected && connectedAddress && client && !token && !isLoggingIn) {
      console.log("AuthContext: Conditions met, attempting login sequence...");
      localStorage.setItem("redirectPath", pathname);
      console.log(`AuthContext: Stored redirect path: ${pathname}`);

      try {
        console.log(`AuthContext: Getting nonce for ${connectedAddress}`);
        const nonceResponse = await authService.getNonce(connectedAddress);
        const message = `Welcome to ShillDAO!

Please sign this message to verify your wallet ownership. This signature will not trigger any blockchain transaction or cost any gas fees.

Verification Details:
- Nonce: ${nonceResponse.nonce}
- Time: ${nonceResponse.timestamp}

This is a one-time security step to protect your account.`;
        console.log("AuthContext: Generated message for signing:", message);

        const signature = await signMessage(wagmiConfigInstance, { message });
        console.log(
          "AuthContext: Signature obtained, calling login function..."
        );
        await login(connectedAddress, signature, message);
      } catch (err) {
        console.error(
          "AuthContext: Authentication sequence failed during nonce/sign:",
          err
        );
        logout(); // Call stable logout on failure
      }
    } else {
      let reason = "";
      if (justLoggedOut) reason += "User just logged out. ";
      else if (!isConnected) reason += "Wallet not connected. ";
      else if (!connectedAddress)
        reason += "Address not available after connection. ";
      else if (!client) reason += "Client not available after connection. ";

      if (token) reason += "User already has a token (logged in). ";
      if (isLoggingIn) reason += "Login process already in progress. ";

      if (reason) {
        console.log(
          `AuthContext: Login attempt skipped. Conditions not met: ${reason.trim()}`
        );
      } else if (
        !(isConnected && connectedAddress && client && !token && !isLoggingIn)
      ) {
        console.log(
          "AuthContext: Login attempt skipped. General conditions not met.",
          {
            isConnected,
            connectedAddress: !!connectedAddress,
            client: !!client,
            token: !!token,
            isLoggingIn,
          }
        );
      }
    }
  }, [
    isConnected,
    connectedAddress,
    client,
    token,
    isLoggingIn,
    login,
    logout,
    justLoggedOut,
    pathname,
  ]);

  // Effect to load token from storage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (stored) {
      console.log("Loaded token from storage.");
      setToken(stored);
    }
    if (storedRole) {
      setRole(storedRole);
    }
  }, []); // Runs only once on mount

  // Effect to sync address and handle disconnects
  useEffect(() => {
    console.log("useAccount state changed:", {
      connectedAddress,
      isConnected,
      isDisconnected,
      justLoggedOut,
    });

    // Skip this effect entirely if we just logged out
    if (justLoggedOut) {
      console.log(
        "AuthContext Sync Effect: Skipping due to justLoggedOut guard."
      );
      return;
    }

    if (isConnected && connectedAddress) {
      // Only set address if it's different to avoid potential loops if logout causes address change
      if (connectedAddress !== ethAddress) {
        setEthAddress(connectedAddress);
      }
    } else if (isDisconnected) {
      // If disconnected, ensure full logout state only if not already logged out
      // Check token/address existence *before* calling logout to prevent potential loops if logout was already called
      if (token || ethAddress) {
        console.log(
          "AuthContext Sync Effect: Detected disconnect while logged in, calling logout."
        );
        logout();
      } else {
        console.log(
          "AuthContext Sync Effect: Detected disconnect, already logged out."
        );
      }
    }
  }, [
    connectedAddress,
    isConnected,
    isDisconnected,
    setEthAddress,
    logout,
    token,
    ethAddress,
    justLoggedOut,
  ]);

  // Effect to reset justLoggedOut after disconnect
  useEffect(() => {
    if (!isConnected && justLoggedOut) {
      // Reset the guard once wallet is fully disconnected
      setJustLoggedOut(false);
    }
  }, [isConnected, justLoggedOut]);

  // Context value includes stable functions
  const contextValue = {
    token,
    ethAddress,
    login,
    logout,
    refreshToken,
    setEthAddress, // Provide the stable setter if needed externally
    role,
    handleLoginAttempt, // Expose the manual login initiation function
  };

  // Return the Provider JSX element
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
