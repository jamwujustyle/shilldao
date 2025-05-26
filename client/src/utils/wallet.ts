export type WalletName =
  | 'MetaMask'
  | 'WalletConnect'
  | 'Coinbase Wallet'
  | 'Brave Wallet'
  | 'Ledger'
  | 'Rabby Wallet'
  | 'Trust Wallet'
  | 'OKX Wallet'
  | 'Browser Wallet'
  | 'Injected'
  | 'Safe';

export const mapConnectorToWalletIcon = (connectorName: string): WalletName => {
  // Normalize common variations
  const lowerCaseName = connectorName.toLowerCase();
  if (lowerCaseName.includes('metamask')) return 'MetaMask';
  if (lowerCaseName.includes('walletconnect')) return 'WalletConnect';
  if (lowerCaseName.includes('coinbase')) return 'Coinbase Wallet'; // Catch 'Coinbase Wallet SDK' etc.
  if (lowerCaseName.includes('brave')) return 'Brave Wallet';
  if (lowerCaseName.includes('ledger')) return 'Ledger';
  if (lowerCaseName.includes('rabby')) return 'Rabby Wallet';
  if (lowerCaseName.includes('trust')) return 'Trust Wallet';
  if (lowerCaseName.includes('okx')) return 'OKX Wallet';
  if (lowerCaseName.includes('safe')) return 'Safe';
  if (lowerCaseName.includes('injected')) return 'Injected'; // Keep injected separate if needed

  // Fallback based on exact match or default
  switch (connectorName) {
    case 'MetaMask':
      return 'MetaMask';
    case 'WalletConnect':
      return 'WalletConnect';
    case 'Coinbase Wallet':
      return 'Coinbase Wallet';
    case 'Brave Wallet':
      return 'Brave Wallet';
    case 'Ledger':
      return 'Ledger';
    case 'Rabby Wallet':
      return 'Rabby Wallet';
    case 'Trust Wallet':
      return 'Trust Wallet';
    case 'OKX Wallet':
      return 'OKX Wallet';
    case 'Safe':
      return 'Safe';
    case 'Injected':
       return 'Injected'; // Explicitly return Injected if matched exactly
    default:
      // If it's not any known specific wallet, but might be injected, treat as Browser Wallet
      return 'Browser Wallet';
  }
};
