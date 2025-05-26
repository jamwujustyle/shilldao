"use client";
import { useAccount, useDisconnect } from "wagmi"; // Import useAccount
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeProvider"; // Import useTheme hook
import WalletConnectModal from "@/components/auth/WalletConnectModal";
import SettingsModal from "@/components/modals/SettingsModal";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"; // Import icons
import { User as DefaultAvatarIcon, Wallet } from "lucide-react"; // Import DefaultAvatarIcon and Wallet icon
import { useQuery } from "@tanstack/react-query";
import userService from "@/services/user";
import { UserType } from "@/types/user";
import { Bars3Icon } from "@heroicons/react/24/outline"; // Import hamburger icon
import { Button } from "@/components/ui/button"; // Import Button component
import Image from "next/image"; // Import Image component

// Define props type for Header
type HeaderProps = {
  onToggleSidebar: () => void; // Function to toggle sidebar visibility
};

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { token, logout, handleLoginAttempt } = useAuth(); // Get token, handleLoginAttempt, and ethAddress from auth context
  const { address: wagmiAddress, isConnected } = useAccount(); // Get wagmi's connected address and status
  const { disconnect } = useDisconnect();
  const { theme, toggleTheme } = useTheme();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Remove local dark mode state and logic
  const settingsButtonRef = useRef<HTMLDivElement>(null); // Ref for the settings button

  // Effect to automatically close the modal once authentication is successful
  useEffect(() => {
    // If the modal is currently shown AND a token appears (meaning login was successful)
    if (showModal && token) {
      console.log("Header: Token detected, closing WalletConnectModal.");
      setShowModal(false); // Close the modal automatically
    }
  }, [token, showModal]); // Run when token or showModal changes

  useEffect(() => {
    setMounted(true);
  }, []);

  // Remove local toggleDarkMode function and useEffect

  const { data: user } = useQuery<UserType | null, Error>({
    queryKey: ["user-me"],
    queryFn: userService.getUser,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: 1000 * 60 * 10, // Garbage collected after 10 minutes of inactivity
    refetchOnMount: false, // Prevent refetching just because component mounted/re-rendered
    refetchOnWindowFocus: false, // Prevent refetching when window gains focus
    refetchOnReconnect: false, // Prevent refetching when network reconnects
    enabled: !!token, // Only run the query if the token exists
  });

  const handleSettingsClick = () => {
    // Toggle the state instead of just setting it to true
    setShowSettingsModal((prev) => !prev);
  };

  const handleSignOut = () => {
    disconnect?.();
    logout();
  };

  return (
    // Added dark mode background
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 border-b border-gray-200 dark:border-gray-700">
      {/* Added dark mode text color */}
      <div className="flex items-center text-gray-500 dark:text-gray-400 px-4 md:px-6 py-3">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          onClick={onToggleSidebar}
          // Added dark mode hover/text styles
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        {/* Right-side icons - Added ml-auto to push to the right and mr-6 to move it left a bit */}
        <div className="ml-auto mr-10 flex items-center space-x-2 md:space-x-4">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle Dark Mode"
          >
            {mounted &&
              (theme === "dark" ? (
                <SunIcon className="h-5 w-5 text-yellow-500" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ))}
          </button>

          {/* Conditional Rendering based on Authentication */}
          {token && user ? ( // User is fully authenticated
            <>
              {/* Avatar and name */}
              <div className="relative">
                <div
                  className="flex items-center space-x-2 p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 transform transition-all duration-200 group ml-2"
                  onClick={handleSettingsClick}
                  ref={settingsButtonRef}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 overflow-hidden">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <DefaultAvatarIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden md:inline text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {user.username}
                  </span>
                </div>
                <SettingsModal
                  isOpen={showSettingsModal}
                  onClose={() => setShowSettingsModal(false)}
                  onSignOut={handleSignOut}
                  triggerRef={settingsButtonRef}
                />
              </div>
            </>
          ) : isConnected && wagmiAddress ? ( // Wallet connected, but not authenticated with backend
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">
                  {`${wagmiAddress.substring(0, 6)}...${wagmiAddress.substring(
                    wagmiAddress.length - 4
                  )}`}
                </span>
              </div>
              <Button
                onClick={handleLoginAttempt} // Call handleLoginAttempt from AuthContext
                variant="outline"
                className="text-sm border-primary-500 text-primary-500 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-gray-700"
              >
                Authenticate
              </Button>
            </div>
          ) : (
            // Not connected, not authenticated
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="text-sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {showModal && !isConnected && (
        <WalletConnectModal onClose={() => setShowModal(false)} />
      )}
      {/* Only show WalletConnectModal if it's meant to be shown AND wallet is not yet connected */}
    </header>
  );
};

export default Header;
