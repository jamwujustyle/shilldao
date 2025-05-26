"use client"

import {createConfig, http} from "wagmi"
import { mainnet, polygon, optimism, arbitrum, sepolia } from "wagmi/chains" // Added sepolia
import { injected, metaMask, coinbaseWallet,walletConnect, safe }from "wagmi/connectors"

// Ensure this environment variable is prefixed with NEXT_PUBLIC_ in your .env file
// e.g., NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
const infuraProjectId = process.env.INFURA_PROJECT_ID;

const WagmiConfig = createConfig({
    chains: [mainnet, polygon, optimism, arbitrum, sepolia], // Added sepolia
    transports: {
        [mainnet.id]: http(infuraProjectId ? `https://mainnet.infura.io/v3/${infuraProjectId}` : undefined),
        [polygon.id]: http(infuraProjectId ? `https://polygon-mainnet.infura.io/v3/${infuraProjectId}` : undefined),
        [optimism.id]: http(infuraProjectId ? `https://optimism-mainnet.infura.io/v3/${infuraProjectId}` : undefined),
        [arbitrum.id]: http(infuraProjectId ? `https://arbitrum-mainnet.infura.io/v3/${infuraProjectId}` : undefined),
        [sepolia.id]: http(infuraProjectId ? `https://sepolia.infura.io/v3/${infuraProjectId}` : undefined) // Added sepolia transport
    },
    connectors: [
        metaMask(),
        coinbaseWallet({
            appName: "ShillDAO",
        }),
        walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
            metadata: {
                name: "ShillDAO",
                description: "ShillDAO Platform",
                url: "http://shilldao.xyz",
                icons: ['http://shilldao.xyz/icon.png']
            }
        }),
        injected(),
        safe()
    ]
})
export const wagmiConfigInstance = WagmiConfig; // Rename export for clarity
export default WagmiConfig; // Keep default export if needed elsewhere, though maybe remove later
