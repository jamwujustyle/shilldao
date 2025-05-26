import React from "react";
import { type WalletName, mapConnectorToWalletIcon } from "../../utils/wallet"; // Adjusted import path
import PropTypes from "prop-types";
import Image from "next/image"; // Import Image component

interface WalletIconProps {
  name: string;
  className?: string; // Allow passing className for styling
}

export const WalletIcon: React.FC<WalletIconProps> = ({
  name,
  className = "w-6 h-6 mr-3",
}) => {
  // Default className
  const walletName = mapConnectorToWalletIcon(name);

  const getIconPath = (walletName: WalletName): string => {
    switch (walletName) {
      case "MetaMask":
        return "/wallets/metamask-icon.svg";
      case "WalletConnect":
        return "/wallets/walletconnect-icon.svg";
      case "Coinbase Wallet":
        return "/wallets/coinbase-icon.svg";
      case "Brave Wallet":
        return "/wallets/brave-icon.svg";
      case "Ledger":
        return "/wallets/ledger-icon.svg";
      case "Rabby Wallet":
        return "/wallets/rabby-icon.svg";
      case "Trust Wallet":
        return "/wallets/trustwallet-icon.svg";
      case "OKX Wallet":
        return "/wallets/okx-icon.svg";
      case "Safe":
        // Use Trust Wallet icon for Safe as requested by user
        return "/wallets/trustwallet-icon.svg";
      case "Injected":
      case "Browser Wallet": // Group Browser Wallet with default
      default:
        return "/wallets/browser-wallet-dark.svg";
    }
  };

  return (
    <Image
      src={getIconPath(walletName)}
      alt={`${name} icon`}
      width={24} // Corresponds to w-6 (24px)
      height={24} // Corresponds to h-6 (24px)
      // Use width/height from className if provided, otherwise default
      // width={24} // Controlled by className now
      // height={24} // Controlled by className now
      className={className} // Apply className here
    />
  );
};

WalletIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string, // Add prop type for className
};

// Optional: Add default props if needed, though handled in destructuring now
// WalletIcon.defaultProps = {
//   className: "w-6 h-6 mr-3",
// };
