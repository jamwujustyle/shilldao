"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { DaoRegisterType, DaoType } from "@/types/dao"; // Removed DaoFormValues
import daoService from "@/services/dao";
import { Upload, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import Image from "next/image"; // Import Image component

interface NewDaoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // We can add a onSuccess callback if needed after DAO creation
}

export const NewDaoDialog: React.FC<NewDaoDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [daoImageFile, setDaoImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Zod Schema for DAO Form Validation
  const daoFormSchema = z.object({
    name: z.string().min(1, "DAO Name is required"),
    description: z.string().optional(),
    createDao: z.boolean(), // Removed .default(false) - defaultValues in useForm will handle initial value
    website: z.string().url("Invalid website URL").or(z.literal("")).optional(),
    network: z.string().min(1, "Network is required"),
    socialLinks: z
      .object({
        twitter: z
          .string()
          .url("Invalid Twitter URL")
          .or(z.literal(""))
          .optional(),
        discord: z
          .string()
          .url("Invalid Discord URL")
          .or(z.literal(""))
          .optional(),
        telegram: z
          .string()
          .url("Invalid Telegram URL")
          .or(z.literal(""))
          .optional(),
      })
      .optional(),
  });

  // Infer the type from the schema
  type DaoZodFormValues = z.infer<typeof daoFormSchema>;

  const daoForm = useForm<DaoZodFormValues>({
    resolver: zodResolver(daoFormSchema),
    defaultValues: {
      name: "",
      description: "",
      createDao: false,
      website: "",
      network: "", // Ensure this is a string if your SelectItem values are strings
      socialLinks: {
        twitter: "",
        discord: "",
        telegram: "",
      },
    },
    mode: "onBlur", // Validate on blur
  });

  const createDAOMutation = useMutation<DaoType, AxiosError, DaoRegisterType>({
    mutationFn: (daoData: DaoRegisterType) => daoService.registerDao(daoData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDAOs"] });
      onOpenChange(false); // Close dialog
      daoForm.reset();
      setDaoImageFile(null);
      setPreviewImage(null);
      toast({ title: "Success", description: "DAO created successfully." });
    },
    onError: (
      error: AxiosError<unknown, string | Record<string, string | string[]>>
    ) => {
      // Simplified error handling for brevity, can be expanded as in original
      const errorData = error.response?.data;
      let errorMessage = error.message;
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === "object") {
        const messages = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
          )
          .join("; ");
        if (messages) errorMessage = messages;
      }
      toast({
        title: "Error creating DAO",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDaoImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setDaoImageFile(null);
      setPreviewImage(null);
    }
  };

  const onSubmitDAO: SubmitHandler<DaoZodFormValues> = (data) => {
    // Validation is now handled by Zod and react-hook-form.
    // The 'data' object is type-safe and validated.
    const networkValue = parseInt(data.network); // Keep this if backend expects number

    // Clean social links (remove empty ones) before sending to backend
    const cleanedSocialLinks: Record<string, string> = {};
    if (data.socialLinks) {
      Object.entries(data.socialLinks).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          cleanedSocialLinks[key] = value.trim();
        }
      });
    }

    const apiData: DaoRegisterType = {
      name: data.name,
      description: data.description || "", // Ensure description is string
      createDao: data.createDao,
      website: data.website || "", // Ensure website is string
      image: daoImageFile || undefined,
      network: networkValue, // Assuming backend expects number
      socialLinks:
        Object.keys(cleanedSocialLinks).length > 0
          ? cleanedSocialLinks
          : undefined,
    };
    createDAOMutation.mutate(apiData);
  };

  const handleDialogClose = () => {
    daoForm.reset();
    setDaoImageFile(null);
    setPreviewImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New DAO</DialogTitle>
          <DialogDescription>
            Fill in the details to register your DAO.
          </DialogDescription>
        </DialogHeader>
        <Form {...daoForm}>
          <form
            onSubmit={daoForm.handleSubmit(onSubmitDAO)}
            className="space-y-6 py-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={daoForm.control}
                  name="name"
                  // rules prop is no longer needed with Zod resolver
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!daoForm.formState.errors.name && (
                        <FormLabel>DAO Name</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Input
                          placeholder="Enter DAO name"
                          {...field}
                          className={
                            daoForm.formState.errors.name
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
                  control={daoForm.control}
                  name="createDao"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      {" "}
                      <div className="space-y-0.5">
                        <FormLabel>Create DAO?</FormLabel>
                        <FormDescription>
                          Did you use createdao.org?
                        </FormDescription>
                      </div>{" "}
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>{" "}
                    </FormItem>
                  )}
                />
                <FormField
                  control={daoForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!daoForm.formState.errors.website && (
                        <FormLabel>Website</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Input
                          placeholder="https://yourdao.xyz"
                          {...field}
                          className={
                            daoForm.formState.errors.website
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
                  control={daoForm.control}
                  name="network"
                  // rules prop is no longer needed with Zod resolver
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!daoForm.formState.errors.network && (
                        <FormLabel>Network</FormLabel>
                      )}{" "}
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()} // Ensure value is string for Select
                      >
                        {" "}
                        <FormControl>
                          <SelectTrigger
                            className={
                              daoForm.formState.errors.network
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>{" "}
                        <SelectContent>
                          {" "}
                          <SelectItem value="1">Ethereum</SelectItem>{" "}
                          <SelectItem value="2">Polygon</SelectItem>{" "}
                          <SelectItem value="3">Optimism</SelectItem>{" "}
                          <SelectItem value="4">Arbitrum</SelectItem>{" "}
                          <SelectItem value="5">Base</SelectItem>{" "}
                          <SelectItem value="6">Solana</SelectItem>{" "}
                          <SelectItem value="7">NEAR</SelectItem>{" "}
                        </SelectContent>{" "}
                      </Select>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <FormField
                  control={daoForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!daoForm.formState.errors.description && (
                        <FormLabel>Description</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Textarea
                          placeholder="Describe your DAO"
                          className={`min-h-32 ${
                            daoForm.formState.errors.description
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
                <FormItem>
                  <FormLabel>DAO Logo</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-muted-foreground/40 transition-colors h-40">
                      {previewImage ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={previewImage}
                            alt="DAO logo preview"
                            width={200} // Example width
                            height={200} // Example height
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => {
                              setPreviewImage(null);
                              setDaoImageFile(null);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="image-upload-new-dao"
                          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                        >
                          <Upload size={36} className="text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click to upload DAO logo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or SVG (max. 2MB)
                          </p>
                          <Input
                            id="image-upload-new-dao"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a logo for your DAO (optional)
                  </FormDescription>
                </FormItem>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-sm font-medium">Social Links</h3>
              <FormField
                control={daoForm.control}
                name="socialLinks.twitter"
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    {!daoForm.formState.errors.socialLinks?.twitter && (
                      <FormLabel>Twitter</FormLabel>
                    )}{" "}
                    <FormControl>
                      <Input
                        placeholder="https://twitter.com/yourdao"
                        {...field}
                        className={
                          daoForm.formState.errors.socialLinks?.twitter
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
                control={daoForm.control}
                name="socialLinks.discord"
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    {!daoForm.formState.errors.socialLinks?.discord && (
                      <FormLabel>Discord</FormLabel>
                    )}{" "}
                    <FormControl>
                      <Input
                        placeholder="https://discord.gg/yourdao"
                        {...field}
                        className={
                          daoForm.formState.errors.socialLinks?.discord
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
                control={daoForm.control}
                name="socialLinks.telegram"
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    {!daoForm.formState.errors.socialLinks?.telegram && (
                      <FormLabel>Telegram</FormLabel>
                    )}{" "}
                    <FormControl>
                      <Input
                        placeholder="https://t.me/yourdao"
                        {...field}
                        className={
                          daoForm.formState.errors.socialLinks?.telegram
                            ? "border-red-500"
                            : ""
                        }
                      />
                    </FormControl>{" "}
                    <FormMessage />{" "}
                  </FormItem>
                )}
              />
            </div>
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
                disabled={createDAOMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createDAOMutation.isPending ? "Creating..." : "Create DAO"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
