import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Award, CheckCircle, DollarSign } from "lucide-react";

interface TaskStatsCardsProps {
  totalAvailableTasksCount: number;
  totalRewards: number;
  completedTasksCount: number;
  averageReward: number;
}

export const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({
  totalAvailableTasksCount,
  totalRewards,
  completedTasksCount,
  averageReward,
}) => {
  const stats = [
    {
      title: "Available Tasks",
      value: totalAvailableTasksCount,
      icon: <ListChecks className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
      description: "Number of tasks currently available",
    },
    {
      title: "Total Rewards",
      value: totalRewards.toLocaleString(),
      icon: <Award className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
      description: "Total rewards across all tasks ($SHILL Token)",
    },
    {
      title: "Completed Tasks",
      value: completedTasksCount,
      icon: (
        <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      ),
      description: "Number of tasks you have completed",
    },
    {
      title: "Avg. Reward",
      value: `$SHILL ${averageReward.toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
      description: "Average reward per task",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
