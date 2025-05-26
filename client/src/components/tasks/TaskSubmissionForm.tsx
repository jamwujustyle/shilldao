import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskType } from "@/types/task";
import { Upload as LucideUpload, Trash2 as LucideTrash2 } from "lucide-react"; // Renamed imports
import Image from "next/image"; // Import next/image
import { TaskDescriptionDialog } from "./TaskDescriptionDialog"; // Import the new dialog

interface TaskSubmissionFormProps {
  selectedTask: TaskType | null;
  submissionType: 1 | 2 | 3;
  setSubmissionType: (value: 1 | 2 | 3) => void;
  link: string;
  setLink: (value: string) => void;
  proofText: string;
  setProofText: (value: string) => void;
  setProofImage: (file: File | null) => void;
  previewImage: string | null;
  setPreviewImage: (value: string | null) => void;
  setProofVideo: (file: File | null) => void;
  handleSubmit: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  submissionCardRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskSubmissionForm: React.FC<TaskSubmissionFormProps> = ({
  selectedTask,
  submissionType,
  setSubmissionType,
  link,
  setLink,
  proofText,
  setProofText,
  setProofImage,
  previewImage,
  setPreviewImage,
  setProofVideo,
  handleSubmit,
  handleImageChange,
  isSubmitting,
  submissionCardRef,
}) => {
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);

  return (
    <>
      <Card ref={submissionCardRef}>
        <CardHeader>
          <CardTitle>Submit Task</CardTitle>
          <CardDescription>
            {selectedTask
              ? "Provide the required information for the selected task."
              : "Select a task from the list to submit your work."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTask ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div>
                <Label>Selected Task</Label>
                <div className="flex items-center p-2 mt-1 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                  <div className="flex-shrink-0 h-8 w-8 mr-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        {selectedTask.campaign.dao?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black dark:text-white">
                      {selectedTask.type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedTask.campaign.name}
                    </div>
                  </div>
                </div>
                {selectedTask.description && (
                  <>
                    <Label className="mt-4">Description</Label>
                    <div
                      className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:underline"
                      onClick={() => setIsDescriptionDialogOpen(true)}
                    >
                      <div className="h-10 overflow-hidden">
                        {" "}
                        {/* Approx 2 lines for text-sm */}
                        {selectedTask.description}
                      </div>
                      {selectedTask.description.length > 80 && ( // Adjusted threshold
                        <div className="mt-1 text-xs text-blue-500 hover:text-blue-700">
                          (click to read more)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="proofType">Proof Type</Label>
                <Select
                  value={String(submissionType)}
                  onValueChange={(value) => {
                    const numericValue = Number(value) as 1 | 2 | 3;
                    if ([1, 2, 3].includes(numericValue)) {
                      setSubmissionType(numericValue);
                    }
                  }}
                >
                  <SelectTrigger id="proofType">
                    <SelectValue placeholder="Select proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Text</SelectItem>
                    <SelectItem value="2">Image</SelectItem>
                    <SelectItem value="3">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {submissionType === 1 && (
                <div className="space-y-1">
                  <Label htmlFor="proofText">Proof Text</Label>
                  <Textarea
                    id="proofText"
                    rows={4}
                    placeholder="Describe how you completed this task..."
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    required
                  />
                </div>
              )}
              {submissionType === 2 && (
                <div className="space-y-1">
                  <Label htmlFor="proofImageFile">Proof Image</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 cursor-pointer hover:border-muted-foreground/40 transition-colors">
                      {previewImage ? (
                        <div className="relative w-full h-40">
                          <Image
                            src={previewImage}
                            alt="Proof image preview"
                            className="w-full h-full object-contain"
                            layout="fill" // Use layout fill for responsive image
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setPreviewImage(null);
                              setProofImage(null);
                            }}
                          >
                            <LucideTrash2 size={14} />{" "}
                            {/* Use renamed Trash2 */}
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="proofImageFile"
                          className="flex flex-col items-center justify-center w-full h-40 cursor-pointer"
                        >
                          <LucideUpload
                            size={36}
                            className="text-muted-foreground"
                          />{" "}
                          {/* Use renamed Upload */}
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click to upload proof image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or SVG (max. 2MB)
                          </p>
                          <Input
                            id="proofImageFile"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {submissionType === 3 && (
                <div className="space-y-1">
                  <Label htmlFor="proofVideoFile">Proof Video</Label>
                  <Input
                    id="proofVideoFile"
                    type="file"
                    accept=".mp4,.avi,.mov"
                    onChange={(e) =>
                      setProofVideo(e.target.files ? e.target.files[0] : null)
                    }
                  />
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Task"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              <p>Select a task from the list to submit your work</p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedTask && selectedTask.description && (
        <TaskDescriptionDialog
          isOpen={isDescriptionDialogOpen}
          onClose={() => setIsDescriptionDialogOpen(false)}
          title={selectedTask.type}
          description={selectedTask.description}
        />
      )}
    </>
  );
};
