"use client";

"use client";

import Head from "next/head";
// Removed Layout import
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserType } from "@/types/user";
import userService from "@/services/user";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useToast } from "@/components/ui/Toast"; // Import useToast
import Image from "next/image";

export default function SettingsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient(); // Get query client instance
  const { showToast, ToastContainer } = useToast(); // Use the hook
  const [username, setUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<UserType | null, Error>({
    queryKey: ["user-me"],
    queryFn: userService.getUser,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: 1000 * 60 * 10,
    enabled: !!token, // Only run query if token exists
    refetchOnMount: false, // Prevent refetching just because component mounted/re-rendered
    refetchOnWindowFocus: false, // Prevent refetching when window gains focus
    refetchOnReconnect: false, // Prevent refetching when network reconnects
  });

  // Update local username state when user data loads or changes
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  // --- Mutations ---
  const updateUsernameMutation = useMutation({
    // Pass only the string to the service function
    mutationFn: (newUsername: string) =>
      userService.updateUsername(newUsername),
    onSuccess: () => {
      // Invalidate and refetch user data to show the updated username
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      showToast("Username updated successfully", "success"); // Show success toast
    },
    onError: (error) => {
      showToast(`Error updating username: ${error.message}`, "error"); // Show error toast
    },
  });

  const updateUserImageMutation = useMutation({
    mutationFn: (formData: FormData) => userService.updateUserImage(formData),
    onSuccess: () => {
      // Invalidate and refetch user data to show the updated image
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
      showToast("User image updated successfully", "success"); // Show success toast
    },
    onError: (error) => {
      showToast(`Error updating user image: ${error.message}`, "error"); // Show error toast
    },
  });

  const removeUserImage = useMutation({
    mutationFn: () => userService.removeUserImage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      showToast("User image removed successfully", "success"); // Show success toast
    },
    onError: (error) => {
      showToast(`Error removing user image: ${error.message}`, "error"); // Show error toast
    },
  });

  // --- Handlers ---
  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleUsernameSave = () => {
    if (username.trim() && username !== user?.username) {
      updateUsernameMutation.mutate(username.trim());
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Automatically upload when file is selected
      const formData = new FormData();
      formData.append("image", file);
      updateUserImageMutation.mutate(formData);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click(); // Trigger hidden file input click
  };

  // Handle Remove button - Placeholder, needs API endpoint if required
  const handleRemoveImage = () => {
    removeUserImage.mutate();
  };

  if (!token) {
    // Added a slightly better loading state
    return (
      // Removed Layout wrapper
      <div className="flex justify-center items-center min-h-screen">
        Loading authentication...
      </div>
    );
  }

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground text-gray-500 dark:text-gray-400">
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 bg-white dark:bg-gray-900">
        Error loading user data: {error.message}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings · Shillers</title>
      </Head>

      <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {" "}
        {/* Applied dark theme background and text */}
        <ToastContainer /> {/* Render the Toast Container */}
        {/* Profile Settings Header */}
        <div className="flex items-center mb-8">
          {" "}
          {/* Increased bottom margin */}
          <UserCircleIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400 mr-4" />{" "}
          {/* Adjusted icon color and size, margin */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {" "}
            {/* Adjusted text size */}
            Profile Settings
          </h1>
        </div>
        {/* Profile Settings Content */}
        <div className="space-y-8">
          {" "}
          {/* Increased spacing between cards */}
          {/* Personal Information Card */}
          <div className="bg-gray-50 dark:bg-gray-800 shadow-xl rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            {" "}
            {/* Enhanced card styling */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {" "}
              {/* Adjusted text size and margin */}
              Personal Information
            </h3>
            {/* Username */}
            <div className="mb-6">
              {" "}
              {/* Increased bottom margin */}
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Username
              </label>
              <div className="flex flex-col sm:flex-row items-center">
                {" "}
                {/* Ensured items-center for alignment */}
                <input
                  type="text"
                  id="username"
                  className="flex-grow text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-lg p-3 shadow-sm mb-3 sm:mb-0 sm:mr-4" /* Adjusted padding, margin, rounded-lg */
                  value={username} // Controlled component
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  disabled={updateUsernameMutation.isPending}
                />
                <button
                  onClick={handleUsernameSave}
                  className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" /* Enhanced button styling */
                  disabled={
                    updateUsernameMutation.isPending ||
                    username === user?.username ||
                    !username.trim()
                  }
                >
                  {updateUsernameMutation.isPending
                    ? "Saving..."
                    : "Save Username"}
                </button>
              </div>
            </div>
          </div>
          {/* Profile Picture Card */}
          <div className="bg-gray-50 dark:bg-gray-800 shadow-xl rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            {" "}
            {/* Enhanced card styling */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {" "}
              {/* Adjusted text size and margin */}
              Profile Picture
            </h3>
            {/* Stack vertically on mobile, row on sm+ */}
            <div className="flex flex-col md:flex-row md:items-center">
              {" "}
              {/* Adjusted for better alignment */}
              <div className="mb-6 md:mb-0 md:mr-8 flex-shrink-0">
                {" "}
                {/* Adjusted margin */}
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto md:mx-0 border-2 border-gray-300 dark:border-gray-600">
                  {" "}
                  {/* Larger avatar, border */}
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt="User Avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" /> /* Larger default icon */
                  )}
                </div>
              </div>
              <div className="text-center md:text-left flex-grow">
                {" "}
                {/* Adjusted text alignment */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {" "}
                  {/* Adjusted margin */}
                  Upload a new profile picture. JPG, JPEG, or PNG. Max size 1MB.
                  {updateUserImageMutation.isPending && (
                    <span className="text-indigo-500 dark:text-indigo-400 ml-2">
                      Uploading...
                    </span>
                  )}
                  {updateUserImageMutation.isError && (
                    <span className="text-red-500 dark:text-red-400 ml-2">
                      Upload failed! Please try again.
                    </span>
                  )}
                </p>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/gif" // Keep gif if supported, else remove
                  style={{ display: "none" }}
                  disabled={updateUserImageMutation.isPending}
                />
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  {" "}
                  {/* Adjusted spacing */}
                  <button
                    onClick={handleUploadButtonClick}
                    className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" /* Enhanced button styling */
                    disabled={updateUserImageMutation.isPending}
                  >
                    {updateUserImageMutation.isPending
                      ? "Uploading..."
                      : "Choose Image"}
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors" /* Enhanced button styling for remove */
                    disabled={
                      !user?.image ||
                      removeUserImage.isPending ||
                      updateUserImageMutation.isPending
                    }
                  >
                    {removeUserImage.isPending ? "Removing..." : "Remove Image"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
