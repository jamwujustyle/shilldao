import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SubmissionsOverviewType } from "@/types/activity";

type ApprovalPerformanceProps = {
  submissionsOverview: SubmissionsOverviewType | null | undefined;
  totalSubmissions: number;
  textApprovalRate: number;
  imageApprovalRate: number;
  videoApprovalRate: number;
};

export const ApprovalPerformance = ({
  submissionsOverview,
  totalSubmissions,
  textApprovalRate,
  imageApprovalRate,
  videoApprovalRate,
}: ApprovalPerformanceProps) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Approval Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Overall Approval Rate
              </span>
              <span className="text-sm font-medium text-black dark:text-white">
                {totalSubmissions > 0
                  ? `${Math.round(
                      ((submissionsOverview?.approvedSubmissions || 0) /
                        totalSubmissions) *
                        100
                    )}%`
                  : "0%"}
              </span>
            </div>
            <Progress
              value={
                totalSubmissions > 0
                  ? ((submissionsOverview?.approvedSubmissions || 0) /
                      totalSubmissions) *
                    100
                  : 0
              }
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Text Submissions
                </span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {textApprovalRate}%
                </span>
              </div>
              <Progress value={textApprovalRate} className="h-2" />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Image Submissions
                </span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {imageApprovalRate}%
                </span>
              </div>
              <Progress value={imageApprovalRate} className="h-2" />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Video Submissions
                </span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {videoApprovalRate}%
                </span>
              </div>
              <Progress value={videoApprovalRate} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
