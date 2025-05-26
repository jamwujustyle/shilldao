import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionsOverviewType } from "@/types/activity";
import { FileText, CheckCircle, Clock, Percent } from "lucide-react";

type ActivityStatsCardsProps = {
  submissionsOverview: SubmissionsOverviewType | null | undefined;
  // timeFrame: string;
};

export const ActivityStatsCards = ({
  submissionsOverview,
}: // timeFrame,
ActivityStatsCardsProps) => {
  const totalSubmissions =
    (submissionsOverview?.approvedSubmissions || 0) +
    (submissionsOverview?.pendingSubmissions || 0) +
    (submissionsOverview?.rejectedSubmissions || 0);

  const stats = [
    {
      title: "Total Submissions",
      value: totalSubmissions || "0",
      icon: <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
      description: "Total number of submissions",
    },
    {
      title: "Approved",
      value: submissionsOverview?.approvedSubmissions || "0",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      description: "Number of approved submissions",
    },
    {
      title: "Pending",
      value: submissionsOverview?.pendingSubmissions || "0",
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      description: "Number of pending submissions",
    },
    {
      title: "Approval Rate",
      value: `${
        totalSubmissions > 0
          ? Math.round(
              ((submissionsOverview?.approvedSubmissions ?? 0) /
                totalSubmissions) *
                100
            )
          : "0"
      }%`,
      icon: <Percent className="h-4 w-4 text-purple-500" />,
      description: "Percentage of submissions that were approved",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
