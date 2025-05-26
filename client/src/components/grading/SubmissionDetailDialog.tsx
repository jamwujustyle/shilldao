import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { SubmissionType, DetailedUserType } from "@/types/grading";
import Image from "next/image"; // Import Image component

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubmission: (DetailedUserType & SubmissionType) | null;
  feedback: string;
  setFeedback: (feedback: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

const SubmissionDetailDialog: React.FC<SubmissionDetailDialogProps> = ({
  open,
  onOpenChange,
  selectedSubmission,
  feedback,
  setFeedback,
  onApprove,
  onReject,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  if (!selectedSubmission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>
            Review submission and provide feedback
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2 w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="proof">Proof</TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="space-y-4 w-full overflow-hidden h-80 overflow-y-auto"
          >
            <div className="flex justify-between items-center mt-2">
              <StatusBadge
                status={selectedSubmission.proofType}
                type="proofType"
              />
              <StatusBadge status={selectedSubmission.status} type="status" />
            </div>

            <div>
              <Label className="text-sm text-gray-500">Campaign</Label>
              <div className="text-sm font-medium">
                {selectedSubmission.campaign}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Task Description</Label>
              <div
                className="text-sm font-medium w-full min-w-0 max-h-32 overflow-y-auto"
                style={{ overflowWrap: "anywhere" }}
              >
                {selectedSubmission.description}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Submission Date</Label>
              <div className="text-sm font-medium">
                {new Date(selectedSubmission.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Link</Label>
              <div className="flex items-center text-sm font-medium">
                <a
                  href={selectedSubmission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  {selectedSubmission.link.substring(0, 30)}
                  {selectedSubmission.link.length > 30 ? "..." : ""}
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-4 h-80 overflow-y-auto">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-3">
                <AvatarImage
                  src={
                    (selectedSubmission.user as DetailedUserType).image ||
                    undefined
                  }
                  alt={selectedSubmission.user.username || "User"}
                />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-lg">
                  {selectedSubmission.user.username?.charAt(0).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {selectedSubmission.user.username || "N/A"}
                </div>
                <StatusBadge
                  status={selectedSubmission.user.tier}
                  type="tier"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500">ETH Address</Label>
              <div
                className="text-sm font-medium"
                style={{ overflowWrap: "anywhere" }}
              >
                {(selectedSubmission.user as DetailedUserType).ethAddress ||
                  "N/A"}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Past Performance</Label>
              <div className="flex items-center mt-1">
                <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm mr-3">
                  {(selectedSubmission.user as DetailedUserType).approved ?? 0}{" "}
                  approved
                </span>
                <ThumbsDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm">
                  {(selectedSubmission.user as DetailedUserType).rejected ?? 0}{" "}
                  rejected
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proof" className="space-y-4 h-80 overflow-y-auto">
            {selectedSubmission.proofType === "Text" &&
              selectedSubmission.proofText && (
                <div>
                  <Label className="text-sm text-gray-500">Proof Text</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm whitespace-pre-wrap">
                    {selectedSubmission.proofText}
                  </div>
                </div>
              )}

            {selectedSubmission.proofType === "Image" &&
              selectedSubmission.proofImage && (
                <div>
                  <Label className="text-sm text-gray-500">Proof Image</Label>
                  <div className="mt-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Image
                      src={selectedSubmission.proofImage}
                      alt="Submission proof"
                      width={500} // Example width
                      height={240} // Example height (matches max-h-60)
                      className="rounded-md w-full object-cover max-h-60 cursor-pointer"
                      onClick={() => setImageModalOpen(true)}
                    />
                  </div>
                </div>
              )}

            {imageModalOpen && selectedSubmission.proofImage && (
              <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Proof Image</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <Image
                      src={selectedSubmission.proofImage}
                      alt="Submission proof enlarged"
                      width={1200} // Larger width for modal
                      height={800} // Larger height for modal
                      className="rounded-md w-full h-auto object-contain"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setImageModalOpen(false)}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {selectedSubmission.proofType === "Video" &&
              selectedSubmission.proofVideo && (
                <div>
                  <Label className="text-sm text-gray-500">Proof Video</Label>
                  <div className="mt-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <a
                      href={selectedSubmission.proofVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Video Proof
                    </a>
                  </div>
                </div>
              )}
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the user"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          {selectedSubmission?.status === "Pending" && (
            <>
              <Button
                variant="destructive"
                onClick={onReject}
                className="flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={onApprove}
                className="flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          {selectedSubmission?.status !== "Pending" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionDetailDialog;
