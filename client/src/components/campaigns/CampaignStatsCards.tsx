"use client";

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, DollarSign, Target, TrendingUp } from "lucide-react";
import { CampaignOverviewType } from "@/types/campaign"; // Import the new type

interface CampaignStatsCardsProps {
  overviewStats: CampaignOverviewType; // Use the new type
}

const CampaignStatsCards = ({ overviewStats }: CampaignStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Active Campaigns
          </CardTitle>
          <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black dark:text-white">
            {overviewStats.activeCampaigns} {/* Use data from overviewStats */}
          </div>
          <p className="text-xs text-muted-foreground">
            Campaigns currently running
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black dark:text-white">
            {overviewStats.totalBudget.toLocaleString()}{" "}
            {/* Use data from overviewStats */}
          </div>
          <p className="text-xs text-muted-foreground">
            Total budget allocated across all campaigns (Shill Token)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black dark:text-white">
            {overviewStats.totalTasks} {/* Use data from overviewStats */}
          </div>
          <p className="text-xs text-muted-foreground">
            Total tasks across all campaigns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-fow items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Campaigns
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black dark:text-white">
            {overviewStats.completedCampaigns}{" "}
            {/* Use data from overviewStats */}
          </div>
          <p className="text-xs text-muted-foreground">
            Campaigns that have been completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignStatsCards;
