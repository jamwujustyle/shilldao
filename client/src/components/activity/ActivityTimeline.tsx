import React, { useState } from "react"; // Moved React import to the top
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye } from "lucide-react";
import {
  SubmissionType as ActivitySubmissionType,
  ProofType,
  SubmissionStatus,
} from "@/types/activity";
import { StatusBadge } from "./StatusBadge";
import { ActivitySubmissionDetailDialog } from "./ActivitySubmissionDetailDialog"; // Added import

type ActivityTimelineProps = {
  filteredActivities: ActivitySubmissionType[];
  formatDate: (dateString: string) => string;
  getProofTypeIcon: (type: ProofType | string) => React.ReactNode; // Changed JSX.Element to React.ReactNode
};

export const ActivityTimeline = ({
  filteredActivities,
  formatDate,
  getProofTypeIcon,
}: ActivityTimelineProps) => {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] =
    useState<ActivitySubmissionType | null>(null);

  const handleViewDetails = (submission: ActivitySubmissionType) => {
    setSelectedSubmissionForDetail(submission);
    setIsDetailDialogOpen(true);
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>Submission History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredActivities.map((activity: ActivitySubmissionType) => (
              <div
                key={activity.id}
                className="flex flex-col md:flex-row justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* <div className="flex-shrink-0 h-10 w-10 mr-3">
                    {(activity as any).campaign?.dao?.daoImage ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={(activity as any).campaign.dao.daoImage}
                        alt={`${
                          (activity as any).campaign.dao?.daoName || "DAO"
                        } logo`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {(
                            (activity as any).campaign?.dao?.daoName?.charAt(
                              0
                            ) || "?"
                          ).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div> */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-black dark:text-white">
                        Submission #{activity.id}
                      </h4>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 flex items-center">
                        {getProofTypeIcon(activity.proofType)}
                        <span className="ml-1">{activity.proofType}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {activity.createdAt && formatDate(activity.createdAt)}
                      </div>
                      <StatusBadge status={activity.status} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between mt-4 md:mt-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black dark:text-white">
                      {activity.multiplier
                        ? `${activity.multiplier}x multiplier`
                        : "Standard"}
                    </span>
                    {activity.status === SubmissionStatus.Approved && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Earned
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs mt-5"
                    onClick={() => handleViewDetails(activity)}
                  >
                    <span>View Details</span>
                    <Eye className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedSubmissionForDetail && (
        <ActivitySubmissionDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          selectedSubmission={selectedSubmissionForDetail}
        />
      )}
    </>
  );
};
