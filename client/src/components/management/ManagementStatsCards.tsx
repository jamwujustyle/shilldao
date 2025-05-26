"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Target, CheckSquare } from "lucide-react"; // Example icons

interface ManagementStatsCardsProps {
  // Define props based on what stats you want to show
  // For example:
  totalDaos: number;
  totalCampaigns: number;
  activeCampaigns: number;
  completedTasks: number;
}

export const ManagementStatsCards: React.FC<ManagementStatsCardsProps> = ({
  totalDaos,
  totalCampaigns,
  activeCampaigns,
  completedTasks,
}) => {
  const stats = [
    {
      title: "Total DAOs",
      value: totalDaos,
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      description: "Number of DAOs managed",
    },
    {
      title: "Total Campaigns",
      value: totalCampaigns,
      icon: <Briefcase className="h-5 w-5 text-muted-foreground" />,
      description: "Total campaigns created",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      icon: <Target className="h-5 w-5 text-muted-foreground" />,
      description: "Campaigns currently running",
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      icon: <CheckSquare className="h-5 w-5 text-muted-foreground" />,
      description: "Tasks completed across all campaigns",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
