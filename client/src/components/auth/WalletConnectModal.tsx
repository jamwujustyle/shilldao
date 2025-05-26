"use client";

import { useConnect, Connector } from "wagmi";
import { WalletIcon } from "../icons/WalletIcon";
import React, { useEffect } from "react";

interface WalletConnectModalProps {
  onClose?: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  onClose = () => {},
}) => {
  const { connect, connectors, status, variables } = useConnect();

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleConnect = async (connector: Connector) => {
    try {
      console.log(`Attempting to connect with ${connector.name}...`);
      await connect({ connector });
      console.log(`Connection attempt with ${connector.name} finished.`);
      // await handleLoginAttempt(); // Decouple: Login attempt will be handled separately
      onClose(); // Close the modal after successful connection
    } catch (error) {
      console.error(`Connection failed for ${connector.name}`, error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose} // Close when backdrop is clicked
      // Removed inline opacity style
    >
      {" "}
      {/* Changed opacity to 50% */}
      <div
        className="bg-gray-900 rounded-lg w-full max-w-md p-6 text-center relative"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none "
          aria-label="Close"
        >
          &times;
        </button>
        {/* Logo and Title */}
        <div className="mb-6">
          <div className="flex justify-center mb-2">
            <div className="text-yellow-400 text-2xl">●</div>
          </div>
          <h2 className="text-white text-2xl font-bold tracking-wide">
            SHILLDAO
          </h2>
        </div>
        {/* Connect instructions */}
        <p className="text-gray-400 mb-4">Connect your wallet to continue</p>

        {/* Wallet options */}
        <div className="space-y-3 ">
          {connectors.map((connector) => {
            const isConnectingThis =
              status === "pending" &&
              variables?.connector &&
              "id" in variables.connector &&
              variables.connector.id === connector.id;

            return (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isConnectingThis}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <WalletIcon name={connector.name} />
                <span className="flex-grow text-left ">
                  Connect with {connector.name}
                </span>
                {isConnectingThis && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
