import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge"; // Corrected import path
import {
  SubmissionType as ActivitySubmissionType,
  ProofType,
} from "@/types/activity";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import Image from "next/image"; // Import Image component

interface ActivitySubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubmission: ActivitySubmissionType | null;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getProofTypeIconAndName = (type: ProofType | string | undefined) => {
  switch (type) {
    case ProofType.Text:
    case "Text":
      return {
        icon: <FileText className="h-5 w-5 mr-2 text-gray-500" />,
        name: "Text Submission",
      };
    case ProofType.Image:
    case "Image":
      return {
        icon: <ImageIcon className="h-5 w-5 mr-2 text-gray-500" />,
        name: "Image Submission",
      };
    case ProofType.Video:
    case "Video":
      return {
        icon: <VideoIcon className="h-5 w-5 mr-2 text-gray-500" />,
        name: "Video Submission",
      };
    default:
      return {
        icon: <FileText className="h-5 w-5 mr-2 text-gray-500" />,
        name: "Submission",
      };
  }
};

export const ActivitySubmissionDetailDialog: React.FC<
  ActivitySubmissionDetailDialogProps
> = ({ open, onOpenChange, selectedSubmission }) => {
  if (!selectedSubmission) return null;

  const { icon: proofIcon, name: proofName } = getProofTypeIconAndName(
    selectedSubmission.proofType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {proofIcon}
            {proofName} Details (ID: #{selectedSubmission.id})
          </DialogTitle>
          <DialogDescription>
            Detailed information about your submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Label className="text-xs text-gray-500">Status</Label>
              <StatusBadge status={selectedSubmission.status} />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Task ID</Label>
              <p className="font-medium text-sm">
                #{selectedSubmission.task.id}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Task Details</Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2 text-sm">
              <p>
                <strong>Description:</strong>{" "}
                {selectedSubmission.task.description}
              </p>
              <p>
                <strong>Type:</strong> {selectedSubmission.task.type}
              </p>
              <p>
                <strong>Base Reward:</strong> {selectedSubmission.task.reward}{" "}
                Tokens
              </p>
              {selectedSubmission.multiplier != null && ( // Check for not null or undefined
                <p>
                  <strong>Multiplier:</strong> x{selectedSubmission.multiplier}
                </p>
              )}
              {selectedSubmission.status === "Approved" && ( // Simplified Earned logic
                <p>
                  <strong>Earned:</strong>{" "}
                  {selectedSubmission.multiplier != null
                    ? parseFloat(selectedSubmission.task.reward) *
                      selectedSubmission.multiplier
                    : selectedSubmission.task.reward}{" "}
                  Tokens
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="submissionLink" className="text-sm font-medium">
              Submission Link
            </Label>
            <a
              id="submissionLink"
              href={selectedSubmission.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center break-all"
            >
              {selectedSubmission.link}
              <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
            </a>
          </div>

          {selectedSubmission.proofType === "Text" &&
            selectedSubmission.proofText && (
              <div>
                <Label htmlFor="proofText" className="text-sm font-medium">
                  Proof Content
                </Label>
                <div
                  id="proofText"
                  className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm whitespace-pre-wrap break-words"
                >
                  {selectedSubmission.proofText}
                </div>
              </div>
            )}

          {selectedSubmission.proofType === "Image" &&
            selectedSubmission.proofImage && (
              <div>
                <Label htmlFor="proofImage" className="text-sm font-medium">
                  Proof Image
                </Label>
                <div className="mt-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Image
                    id="proofImage"
                    src={selectedSubmission.proofImage}
                    alt={`Submission ${selectedSubmission.id} proof`}
                    width={500} // Example width, adjust as needed
                    height={320} // Example height, adjust as needed (matches max-h-80)
                    className="rounded-md w-full object-contain max-h-80"
                  />
                </div>
              </div>
            )}

          {selectedSubmission.proofType === "Video" &&
            selectedSubmission.proofVideo && (
              <div>
                <Label htmlFor="proofVideo" className="text-sm font-medium">
                  Proof Video
                </Label>
                <a
                  id="proofVideo"
                  href={selectedSubmission.proofVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  View Video Proof
                  <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
                </a>
              </div>
            )}

          {selectedSubmission.feedback && (
            <>
              <Separator />
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">
                  Moderator Feedback
                </Label>
                <div
                  id="feedback"
                  className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm whitespace-pre-wrap break-words"
                >
                  {selectedSubmission.feedback}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Submitted On</Label>
              <p className="font-medium">
                {formatDate(selectedSubmission.createdAt)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Reviewed on</Label>
              <p className="font-medium">
                {formatDate(selectedSubmission.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
