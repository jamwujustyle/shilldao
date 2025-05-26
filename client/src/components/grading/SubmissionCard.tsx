import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "./StatusBadge";
import { SubmissionType, DetailedUserType } from "@/types/grading";

interface SubmissionCardProps {
  submission: SubmissionType;
  onSelectSubmission: (submission: SubmissionType) => void;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onSelectSubmission,
}) => {
  return (
    <Card
      key={submission.id}
      className="cursor-pointer"
      onClick={() => onSelectSubmission(submission)}
    >
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <StatusBadge status={submission.status} type="status" />
        <StatusBadge status={submission.proofType} type="proofType" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* User Info */}
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage
              src={(submission.user as DetailedUserType).image || undefined}
              alt={submission.user.username || "User"}
            />
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
              {submission.user.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">
              {submission.user.username || "N/A"}
            </div>
            <StatusBadge status={submission.user.tier} type="tier" />
          </div>
        </div>

        {/* Task Details */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div>
            <span className="font-medium">Campaign:</span> {submission.campaign}
          </div>
          <div className="truncate" title={submission.description}>
            <span className="font-medium">Task:</span> {submission.description}
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            {new Date(submission.createdAt).toLocaleDateString()}
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionCard;
