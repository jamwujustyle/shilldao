"use client";

import React, { useState, useEffect } from "react";
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
// Switch might not be needed if createDao is not editable, but keeping for consistency if other booleans are added
// import { Switch } from "@/components/ui/switch";
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
// import { useToast } from "@/components/ui/use-toast"; // Old shadcn toast
import { useToast } from "@/components/ui/Toast"; // Correct custom hook
import { DaoRegisterType, DaoType } from "@/types/dao"; // DaoFormValues will be replaced by Zod inferred type
import daoService from "@/services/dao";
import { Upload, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import Image from "next/image"; // Import Image component
// Toast component itself is not directly used here, useToast hook handles rendering
interface EditDaoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  daoToEdit: DaoType | null;
}

// Zod schema for form validation
const editDaoFormSchema = z.object({
  name: z.string(), // Included for type consistency, not actively validated as it's non-editable here
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less.")
    .optional()
    .or(z.literal("")),
  createDao: z.boolean(), // Included for type consistency
  website: z
    .string()
    .url({ message: "Invalid website URL format." })
    .optional()
    .or(z.literal("")),
  network: z.string(), // Included for type consistency
  socialLinks: z
    .object({
      twitter: z
        .string()
        .url({ message: "Invalid Twitter URL format." })
        .optional()
        .or(z.literal("")),
      discord: z
        .string()
        .url({ message: "Invalid Discord URL format." })
        .optional()
        .or(z.literal("")),
      telegram: z
        .string()
        .url({ message: "Invalid Telegram URL format." })
        .optional()
        .or(z.literal("")),
    })
    .optional(),
});

type EditDaoZodFormValues = z.infer<typeof editDaoFormSchema>;

export const EditDaoDialog: React.FC<EditDaoDialogProps> = ({
  isOpen,
  onOpenChange,
  daoToEdit,
}) => {
  const { showToast, ToastContainer } = useToast(); // Use the hook from our Toast.tsx
  const queryClient = useQueryClient();

  const [daoImageFile, setDaoImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const editDaoForm = useForm<EditDaoZodFormValues>({
    resolver: zodResolver(editDaoFormSchema),
    defaultValues: {
      name: "",
      description: "",
      createDao: false,
      website: "",
      network: "",
      socialLinks: {
        twitter: "",
        discord: "",
        telegram: "",
      },
    },
    mode: "onBlur", // Validate on blur
  });

  useEffect(() => {
    if (daoToEdit && isOpen) {
      editDaoForm.reset({
        name: daoToEdit.name,
        description: daoToEdit.description || "",
        createDao: daoToEdit.createDao,
        website: daoToEdit.website || "",
        network: daoToEdit.network?.toString() || "", // Assuming network is a number in DaoType
        socialLinks: {
          twitter: daoToEdit.socialLinks?.twitter || "",
          discord: daoToEdit.socialLinks?.discord || "",
          telegram: daoToEdit.socialLinks?.telegram || "",
        },
      });
      if (daoToEdit.image) {
        setPreviewImage(daoToEdit.image);
      } else {
        setPreviewImage(null);
      }
      setDaoImageFile(null); // Clear any previously selected new file
    }
  }, [daoToEdit, isOpen, editDaoForm]);

  const updateDAOMutation = useMutation<
    DaoType,
    AxiosError<string | Record<string, string | string[]>>,
    { id: number; data: Partial<DaoRegisterType> }
  >({
    mutationFn: ({ id, data }) => daoService.updateDao(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDAOs"] });
      onOpenChange(false); // Close dialog
      // editDaoForm.reset(); // Reset happens on open/daoToEdit change
      // setDaoImageFile(null); // Reset on open/daoToEdit change
      // setPreviewImage(null); // Reset on open/daoToEdit change
      showToast("DAO updated successfully.", "success");
    },
    onError: (error) => {
      const errorData = error.response?.data;
      let errorMessage = error.message; // Default to Axios error message
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === "object") {
        // Check for a 'detail' field first, common in DRF errors
        if ("detail" in errorData && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else {
          // Fallback for other object-based errors (e.g., validation errors)
          const messages = Object.entries(errorData)
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value) ? value.join(", ") : String(value)
                }`
            )
            .join("; ");
          if (messages) errorMessage = messages;
          else errorMessage = "An unexpected error occurred."; // More generic fallback
        }
      }
      showToast(errorMessage, "error");
    },
  });

  const deleteDAOMutation = useMutation<
    void, // No response data expected on successful delete (204 No Content)
    AxiosError<string | Record<string, string | string[]>>,
    number // DAO ID to delete
  >({
    mutationFn: (id) => daoService.deleteDao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDAOs"] });
      queryClient.invalidateQueries({ queryKey: ["daos"] }); // Also invalidate general DAO list if applicable
      onOpenChange(false); // Close dialog
      showToast("DAO deleted successfully.", "success");
    },
    onError: (error) => {
      const errorData = error.response?.data;
      let errorMessage = "Could not delete DAO."; // Default message

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (
        errorData &&
        typeof errorData === "object" &&
        "detail" in errorData
      ) {
        const detail = (errorData as { detail: string }).detail;
        if (
          detail ===
          "DAO cannot be deleted because it has associated campaigns or tasks."
        ) {
          errorMessage = detail; // Use the specific message directly
        } else if (typeof detail === "string") {
          errorMessage = detail;
        } else {
          // Fallback for other object-based errors if 'detail' is not the target string
          const messages = Object.entries(errorData)
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value) ? value.join(", ") : String(value)
                }`
            )
            .join("; ");
          if (messages) errorMessage = messages;
        }
      } else if (errorData && typeof errorData === "object") {
        // Fallback for other object-based errors without 'detail'
        const messages = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${
                Array.isArray(value) ? value.join(", ") : String(value)
              }`
          )
          .join("; ");
        if (messages) errorMessage = messages;
      }
      showToast(errorMessage, "error");
    },
  });

  const handleDeleteDAO = () => {
    if (!daoToEdit) return;
    // For now, directly delete. Confirmation dialog can be added.
    // setShowDeleteConfirm(true); // This would open a confirmation dialog
    deleteDAOMutation.mutate(daoToEdit.id);
  };

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
      // If user cancels file selection, keep existing image or clear if they intended to
      // This part might need refinement based on desired UX for clearing an image
      // For now, if they cancel, we don't change the preview unless it was already null
      if (!previewImage) {
        // if there was no preview, ensure file is also null
        setDaoImageFile(null);
      }
    }
  };

  const onSubmitEditDAO: SubmitHandler<EditDaoZodFormValues> = (data) => {
    if (!daoToEdit) return;

    // Destructure validated data. Zod ensures types are correct.
    const { description, website, socialLinks } = data;

    const cleanedSocialLinks: Record<string, string> = {};
    if (socialLinks) {
      Object.entries(socialLinks).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          cleanedSocialLinks[key] = value.trim();
        }
      });
    }

    const apiData: Partial<DaoRegisterType> = {
      description,
      website,
      socialLinks:
        Object.keys(cleanedSocialLinks).length > 0
          ? cleanedSocialLinks
          : undefined,
    };

    if (daoImageFile) {
      // If a new image file is selected
      apiData.image = daoImageFile;
    } else if (previewImage === null && daoToEdit.image) {
      // If previewImage was explicitly cleared (set to null) and there was an original image
      apiData.image = null; // Send null to indicate image removal
    }
    // If previewImage is not null and matches daoToEdit.image, and no new daoImageFile,
    // then the image is unchanged, so we don't send the image field at all.
    // The backend should not update the image if the field is not present.

    updateDAOMutation.mutate({ id: daoToEdit.id, data: apiData });
  };

  const handleDialogClose = () => {
    // Resetting form and image states is handled by useEffect on 'isOpen' change to false
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <ToastContainer /> {/* Render the ToastContainer here */}
        <DialogHeader>
          <DialogTitle>Edit {daoToEdit?.name || "DAO"}</DialogTitle>
          <DialogDescription>
            Update the details for your DAO.
          </DialogDescription>
        </DialogHeader>
        {daoToEdit && (
          <Form {...editDaoForm}>
            <form
              onSubmit={editDaoForm.handleSubmit(onSubmitEditDAO)}
              className="space-y-6 py-4"
            >
              {/* Non-editable fields shown for context, or omit them */}
              <p className="text-sm">
                <span className="font-semibold">Name:</span> {daoToEdit.name}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={editDaoForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        {" "}
                        {!editDaoForm.formState.errors.description && (
                          <FormLabel>Description</FormLabel>
                        )}{" "}
                        <FormControl>
                          <Textarea
                            placeholder="Describe your DAO"
                            className={`min-h-32 ${
                              editDaoForm.formState.errors.description
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
                  <FormField
                    control={editDaoForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        {" "}
                        {!editDaoForm.formState.errors.website && (
                          <FormLabel>Website</FormLabel>
                        )}{" "}
                        <FormControl>
                          <Input
                            placeholder="https://yourdao.xyz"
                            {...field}
                            className={
                              editDaoForm.formState.errors.website
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
                <div className="space-y-6">
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
                            htmlFor="image-upload-edit-dao"
                            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                          >
                            <Upload
                              size={36}
                              className="text-muted-foreground"
                            />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Click to upload new DAO logo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG or SVG (max. 2MB)
                            </p>
                            <Input
                              id="image-upload-edit-dao"
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
                      Upload a new logo for your DAO (optional)
                    </FormDescription>
                  </FormItem>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-sm font-medium">Social Links</h3>
                <FormField
                  control={editDaoForm.control}
                  name="socialLinks.twitter"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!editDaoForm.formState.errors.socialLinks?.twitter && (
                        <FormLabel>Twitter</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Input
                          placeholder="https://twitter.com/yourdao"
                          {...field}
                          className={
                            editDaoForm.formState.errors.socialLinks?.twitter
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
                  control={editDaoForm.control}
                  name="socialLinks.discord"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!editDaoForm.formState.errors.socialLinks?.discord && (
                        <FormLabel>Discord</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Input
                          placeholder="https://discord.gg/yourdao"
                          {...field}
                          className={
                            editDaoForm.formState.errors.socialLinks?.discord
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
                  control={editDaoForm.control}
                  name="socialLinks.telegram"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      {!editDaoForm.formState.errors.socialLinks?.telegram && (
                        <FormLabel>Telegram</FormLabel>
                      )}{" "}
                      <FormControl>
                        <Input
                          placeholder="https://t.me/yourdao"
                          {...field}
                          className={
                            editDaoForm.formState.errors.socialLinks?.telegram
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
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteDAO}
                  disabled={
                    deleteDAOMutation.isPending || updateDAOMutation.isPending
                  }
                  className="mr-auto" // Push to the left
                >
                  {deleteDAOMutation.isPending ? "Deleting..." : "Delete DAO"}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    updateDAOMutation.isPending || deleteDAOMutation.isPending
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateDAOMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        {/* Basic confirmation dialog example (can be improved with a separate component) */}
        {/*
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the DAO: {daoToEdit?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                if (daoToEdit) deleteDAOMutation.mutate(daoToEdit.id);
                setShowDeleteConfirm(false);
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        */}
      </DialogContent>
    </Dialog>
  );
};
