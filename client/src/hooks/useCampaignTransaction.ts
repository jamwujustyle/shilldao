"use client";

import { useState, useEffect } from "react";
import { parseUnits, encodeFunctionData, Hash } from "viem";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useReadContract, // Keep for shillBalance
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
// Removed: import { CampaignFormValues } from "@/types/campaign";

// Define a type for the form data this hook expects
interface CampaignHookFormValues {
  name: string;
  description: string;
  budget: number; // Expect budget as a number
  status: string;
  dao: string;
  // Add any other fields from CampaignZodFormValues if the hook uses them directly
}

 const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;


// SHILL Token contract address on Sepolia
const SHILL_TOKEN_ADDRESS = "0x652159c7f62e9c1613476ca600f3b591dbfc920e" as const;
// DAO contract address where SHILL tokens should be sent
const DAO_CONTRACT_ADDRESS = "0xE5FE82ec6482d0291f22B5269eDBC4a046eEA763" as const;

interface UseCampaignTransactionResult {
  isSending: boolean; // True when sendTransaction is called
  isConfirming: boolean; // True when waiting for transaction receipt
  isConfirmed: boolean; // True when transaction is successfully confirmed
  sendCampaignTransaction: (data: CampaignHookFormValues) => Promise<void>; // Use new type
  shillBalance: bigint | undefined;
  isLoadingBalance: boolean;
}

export const useCampaignTransaction = (
  onTransactionSuccess: (data: CampaignHookFormValues, transactionHash: string) => void // Use new type
): UseCampaignTransactionResult => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

  const [txHash, setTxHash] = useState<Hash | undefined>(undefined);
  const [pendingData, setPendingData] = useState<CampaignHookFormValues | null>(null); // Use new type
  const [hasCalledSuccess, setHasCalledSuccess] = useState(false);

  const {
    sendTransaction,
    isPending: isSendingTransaction // Renamed from isPending for clarity
  } = useSendTransaction();

  const {
    isLoading: isConfirmingTransaction,
    isSuccess: isTransactionConfirmed,
    error: transactionError,
    data: receipt, // get receipt data
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2, // Wait for 2 confirmations
    onReplaced: (replacement) => {
      console.log('[WagmiDebug] Transaction replaced:', replacement);
      // You might want to update txHash here if replacement.reason is 'spedUp'
      // and replacement.transaction.hash is different.
      // For now, just logging.
    },
    query: { enabled: !!txHash && !hasCalledSuccess } // Only enable if txHash is set and success hasn't been called
  });

  // Still useful to show user their balance
  const { data: shillBalance, isLoading: isLoadingBalance } = useReadContract({
    address: SHILL_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Debug: Log changes to useWaitForTransactionReceipt values
  useEffect(() => {
    console.log("[WagmiDebug] useWaitForTransactionReceipt states:", {
      txHash,
      isConfirmingTransaction,
      isTransactionConfirmed,
      transactionError: transactionError?.message,
      hasCalledSuccess,
      receiptStatus: receipt?.status
    });
  }, [txHash, isConfirmingTransaction, isTransactionConfirmed, transactionError, hasCalledSuccess, receipt]);


  // Effect for handling transfer confirmation
  useEffect(() => {
    if (isTransactionConfirmed && txHash && pendingData && !hasCalledSuccess) {
      console.log(`Transaction ${txHash} confirmed by useWaitForTransactionReceipt. Calling onTransactionSuccess.`);
      setHasCalledSuccess(true);
      // Toast for successful on-chain confirmation, backend verification will follow
      toast({
        title: "On-Chain Confirmation Successful",
        description: `Your SHILL token deposit (Tx: ${txHash.substring(0, 10)}...) is confirmed on the blockchain. Verifying with server...`,
      });
      onTransactionSuccess(pendingData, txHash); // This calls createCampaignMutation.mutate
      // Note: The actual "Campaign Created" or "Verification Failed" toast will come from the component using this hook,
      // based on the mutation's result.
      setPendingData(null);
    } else if (transactionError && txHash && !hasCalledSuccess) {
      console.error(`Error confirming transaction ${txHash}:`, transactionError);
      let description = "Could not confirm the transaction on the blockchain.";
      if (transactionError.message.includes("TransactionExecutionError")) {
        description = "The transaction was reverted. Please check your token balance and allowance, and try again.";
      } else if (transactionError.message.includes("TimeoutError")) {
        description = "Confirmation timed out. The transaction might still go through or fail. Please check your wallet activity.";
      }
      toast({
        title: "On-Chain Confirmation Failed",
        description: description,
        variant: "destructive",
      });
      setHasCalledSuccess(true);
      setPendingData(null);
    }
  }, [isTransactionConfirmed, txHash, pendingData, onTransactionSuccess, toast, hasCalledSuccess, transactionError]);

  const sendCampaignTransaction = async (data: CampaignHookFormValues) => { // Use new type
    if (!isConnected || !address) {
      toast({ title: "Wallet Not Connected", description: "Please connect your wallet.", variant: "destructive" });
      return;
    }

    // Reset states for a new transaction attempt
    setTxHash(undefined);
    setPendingData(null);
    setHasCalledSuccess(false);

    // data.budget is now a number, convert to string for parseUnits
    const amountInTokenUnits = parseUnits(String(data.budget), 18);

    if (shillBalance !== undefined && amountInTokenUnits > shillBalance) {
      toast({
        title: "Insufficient SHILL Balance",
        description: `You need ${data.budget} SHILL but only have ${(Number(shillBalance) / 1e18).toFixed(2)} SHILL available.`,
        variant: "destructive",
      });
      return;
    }

    console.log("Preparing SHILL token transfer transaction...");
    setPendingData(data);

    // Inform user about the 2-minute rule before Metamask pops up
    toast({
      title: "Action Required: Approve Transaction",
      description: `Please approve the SHILL token transfer in your wallet. This transaction must be confirmed on the blockchain within 2 minutes for the campaign creation to be valid.`,
      duration: 7000, // Longer duration for this important message
    });

    const transferEncodedData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [DAO_CONTRACT_ADDRESS, amountInTokenUnits],
    });

    sendTransaction(
      {
        to: SHILL_TOKEN_ADDRESS,
        data: transferEncodedData,
        // You could add a gas estimate here if needed, e.g., gas: BigInt(100000)
      },
      {
        onSuccess: (hash) => {
          console.log(`Transfer transaction sent, hash: ${hash}. Waiting for confirmation.`);
          setTxHash(hash);
          toast({
            title: "Transaction Submitted",
            description: `Your SHILL transfer (Tx: ${hash.substring(0,10)}...) has been submitted. Waiting for on-chain confirmation. This may take a moment.`,
          });
        },
        onError: (error) => {
          console.error("Failed to send transaction:", error);
          let friendlyMessage = "An error occurred while sending the transaction.";
          if (error.message.includes("User rejected the request")) {
            friendlyMessage = "Transaction rejected. If this was a mistake, please try again.";
          } else if (error.message.includes("insufficient funds")) {
            friendlyMessage = "Insufficient funds for gas. Please ensure your wallet has enough ETH to cover transaction fees.";
          }
          toast({
            title: "Transaction Submission Failed",
            description: friendlyMessage,
            variant: "destructive",
          });
          setPendingData(null);
        },
      }
    );
  };

  return {
    isSending: isSendingTransaction,
    isConfirming: isConfirmingTransaction,
    isConfirmed: isTransactionConfirmed && hasCalledSuccess, // Make sure success callback was triggered
    sendCampaignTransaction,
    shillBalance,
    isLoadingBalance,
  };
};
