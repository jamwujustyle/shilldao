"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Import Loader2 icon
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel, // Added FormLabel
  FormMessage,
} from "@/components/ui/form";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { CampaignType } from "@/types/campaign"; // Ensured CampaignFormValues is removed
import { DaoType } from "@/types/dao";
import campaignService from "@/services/campaign";
import { AxiosError } from "axios";
import { useAccount } from "wagmi"; // Keep useAccount for isConnected check
import { useCampaignTransaction } from "@/hooks/useCampaignTransaction"; // Import the new hook

interface NewCampaignDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allDAOs: DaoType[];
  // selectedDAOId can be passed if opening dialog from a specific DAO context
  // This helps pre-select the DAO in the form.
  selectedDAOId?: string | null;
}

export const NewCampaignDialog: React.FC<NewCampaignDialogProps> = ({
  isOpen,
  onOpenChange,
  allDAOs,
  selectedDAOId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const campaignFormSchema = z.object({
    name: z.string().min(1, "Campaign Name is required"),
    description: z.string().min(1, "Description is required"),
    budget: z.coerce.number().positive({
      message: "Budget must be a positive number and is required",
    }), // Simplified: coerce to number and check if positive. Empty/invalid strings become NaN, failing positive() check.
    status: z.string().min(1, "Action is required"),
    dao: z.string().min(1, "Associated DAO is required"),
  });

  type CampaignZodFormValues = z.infer<typeof campaignFormSchema>;

  const campaignForm = useForm<CampaignZodFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      budget: 0, // Zod schema will coerce string input to number
      status: "1",
      dao: selectedDAOId || "",
    },
    mode: "onBlur",
  });

  // Get wallet connection status
  const { isConnected } = useAccount(); // Keep useAccount here for button disabled state

  // Callback for when the transaction is successfully confirmed
  const handleTransactionSuccess = (
    data: CampaignZodFormValues, // Use Zod inferred type
    transactionHash: string
  ) => {
    createCampaignMutation.mutate({
      name: data.name,
      description: data.description,
      budget: data.budget, // Already a number due to Zod transform
      status: data.status,
      dao: parseInt(data.dao, 10), // DAO ID is string from form, backend expects number
      transaction_hash: transactionHash,
    });
  };

  const {
    isSending, // True when sendTransaction is called from the hook
    isConfirming, // True when waiting for transaction receipt
    // isConfirmed, // True when transaction is successfully confirmed (can be used if needed)
    sendCampaignTransaction,
  } = useCampaignTransaction(handleTransactionSuccess);

  // Update default DAO if selectedDAOId changes while dialog is open (or on initial open)
  React.useEffect(() => {
    if (selectedDAOId) {
      campaignForm.setValue("dao", selectedDAOId);
    } else {
      // If no specific DAO is selected, clear the field or set to a placeholder if appropriate
      // campaignForm.setValue("dao", "");
    }
  }, [selectedDAOId, campaignForm, isOpen]);

  const createCampaignMutation = useMutation<
    CampaignType,
    AxiosError, // Changed Error to AxiosError for more specific error handling
    {
      name: string;
      description: string;
      budget: number;
      status: string;
      dao: number;
      transaction_hash: string;
    }
  >({
    mutationFn: (campaignData) =>
      campaignService.createCampaignVerified(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCampaigns"] });
      queryClient.invalidateQueries({ queryKey: ["myDAOs"] }); // Campaigns count on DAO might change
      onOpenChange(false);
      campaignForm.reset({
        name: "",
        description: "",
        budget: 0, // Reset budget to number
        status: "1",
        dao: selectedDAOId || "",
      });
      toast({
        title: "Success",
        description: "Campaign created successfully.",
      });
    },
    onError: (
      error: AxiosError<unknown, string | Record<string, string | string[]>>
    ) => {
      const errorData = error.response?.data;
      let errorMessage = error.message;
      if (errorData && typeof errorData === "object") {
        const messages = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
          )
          .join("; ");
        if (messages) errorMessage = messages;
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      }
      toast({
        title: "Error creating campaign",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmitCampaign: SubmitHandler<CampaignZodFormValues> = async (
    data
  ) => {
    // Validations for dao and budget are now handled by Zod.
    // data.budget is already a number.
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a campaign.",
        variant: "destructive",
      });
      return;
    }

    sendCampaignTransaction(data); // Call the function from the custom hook
  };

  const handleDialogClose = () => {
    campaignForm.reset({
      name: "",
      description: "",
      budget: 0, // Reset budget to number
      status: "1",
      dao: selectedDAOId || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new campaign to coordinate tasks and rewards.
          </DialogDescription>
        </DialogHeader>
        <Form {...campaignForm}>
          <form
            onSubmit={campaignForm.handleSubmit(onSubmitCampaign)}
            className="space-y-6 py-4"
          >
            <FormField
              control={campaignForm.control}
              name="name"
              // rules prop removed
              render={({ field }) => (
                <FormItem>
                  {" "}
                  {!campaignForm.formState.errors.name && (
                    <FormLabel>Campaign Name</FormLabel>
                  )}{" "}
                  <FormControl>
                    <Input
                      placeholder="Enter campaign name"
                      {...field}
                      className={
                        campaignForm.formState.errors.name
                          ? "border-red-500"
                          : ""
                      }
                    />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={campaignForm.control}
              name="description"
              // rules prop removed
              render={({ field }) => (
                <FormItem>
                  {" "}
                  {!campaignForm.formState.errors.description && (
                    <FormLabel>Description</FormLabel>
                  )}{" "}
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this campaign aims to achieve"
                      className={`min-h-24 ${
                        campaignForm.formState.errors.description
                          ? "border-red-500"
                          : ""
                      }`}
                      {...field}
                    />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={campaignForm.control}
                name="budget"
                // rules prop removed
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    {!campaignForm.formState.errors.budget && (
                      <FormLabel>Budget (Tokens)</FormLabel>
                    )}{" "}
                    <FormControl>
                      <Input
                        type="text" // Keep as text for Zod string preprocess, Zod handles number conversion
                        placeholder="Token amount"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)} // Ensure string value is passed for Zod
                        value={
                          field.value === 0 &&
                          campaignForm.formState.isSubmitted === false
                            ? ""
                            : String(field.value)
                        } // Display empty for initial 0, else string
                        className={
                          campaignForm.formState.errors.budget
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </FormControl>{" "}
                    <FormMessage />{" "}
                  </FormItem>
                )}
              />
              <FormField
                control={campaignForm.control}
                name="status"
                // rules prop removed
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    {!campaignForm.formState.errors.status && (
                      <FormLabel>Action</FormLabel>
                    )}{" "}
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      {" "}
                      <FormControl>
                        <SelectTrigger
                          className={
                            campaignForm.formState.errors.status
                              ? "border-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>{" "}
                      <SelectContent>
                        {" "}
                        <SelectItem value="1">
                          Launch Immediately
                        </SelectItem>{" "}
                        <SelectItem value="2">Planning</SelectItem>{" "}
                      </SelectContent>{" "}
                    </Select>{" "}
                    <FormMessage />{" "}
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={campaignForm.control}
              name="dao"
              // rules prop removed
              render={({ field }) => (
                <FormItem>
                  {!campaignForm.formState.errors.dao && (
                    <FormLabel>Associated DAO</FormLabel>
                  )}{" "}
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!selectedDAOId}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={
                          campaignForm.formState.errors.dao
                            ? "border-red-500"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select DAO" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allDAOs.map((dao) => (
                        <SelectItem key={dao.id} value={dao.id.toString()}>
                          {dao.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !isConnected || // Disabled if wallet not connected
                  createCampaignMutation.isPending ||
                  isSending || // Use isSending from the hook
                  isConfirming // Use isConfirming from the hook
                }
                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming Transaction...
                  </>
                ) : isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Transaction...
                  </>
                ) : createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </DialogFooter>
            {!isConnected && ( // Conditional message if wallet not connected
              <p className="text-red-500 text-sm text-center mt-2">
                Please connect your wallet to create a campaign.
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
