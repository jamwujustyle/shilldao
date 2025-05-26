"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import statsService from "@/services/statsOverview";
import ErrorMessage from "@/components/ui/ErrorMessage"; // Import ErrorMessage
import { StatCards } from "@/components/dashboard/DashboardStatCards";
import { ChartSection } from "@/components/dashboard/DashboardChartSection";
import { TopShillersTable } from "@/components/dashboard/DashboardTopShillersTable";
import { Select, SelectContent } from "@/components/ui/select";
import { SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RewardGraphType } from "@/types/statsOverview";

const Dashboard = () => {
  const [timeFrame, setTimeFrame] = useState("allTime");

  const results = useQueries({
    queries: [
      {
        queryKey: ["statsOverview", timeFrame],
        queryFn: () => statsService.getStats(timeFrame),
      },
      {
        queryKey: ["topShillers"],
        queryFn: statsService.getTopShillers,
      },
      {
        queryKey: ["campaignsGraph"],
        queryFn: statsService.campaignsGraph,
      },
      {
        queryKey: ["rewardsGraph"],
        queryFn: statsService.rewardsGraph,
      },
      {
        queryKey: ["tierGraph"],
        queryFn: statsService.tierGraph,
      },
    ],
  });

  const statsOverviewQuery = results[0];
  const topShillersQuery = results[1];
  const campaignGraphQuery = results[2];
  const rewardsGraphQuery = results[3];
  const tierGraphQuery = results[4];

  // Add loading and error handling using React Query status
  // Consider which queries are essential for the initial dashboard display
  const essentialDataIsLoading =
    statsOverviewQuery.isLoading ||
    topShillersQuery.isLoading ||
    campaignGraphQuery.isLoading ||
    rewardsGraphQuery.isLoading ||
    tierGraphQuery.isLoading;

  const hasOverviewData =
    statsOverviewQuery.data && Object.keys(statsOverviewQuery.data).length > 0;

  if (essentialDataIsLoading && !hasOverviewData) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const essentialDataHasError =
    statsOverviewQuery.isError ||
    topShillersQuery.isError ||
    campaignGraphQuery.isError ||
    rewardsGraphQuery.isError ||
    tierGraphQuery.isError;

  if (essentialDataHasError) {
    return (
      <ErrorMessage
        message="Error loading dashboard data."
        details="Network Error" // Default minHeight will be used
      />
    );
  }
  // Check if data is empty or not available for each chart
  const hasCampaignGraphData =
    campaignGraphQuery.data && campaignGraphQuery.data.length > 0;
  const hasRewardsGraphData =
    rewardsGraphQuery.data && rewardsGraphQuery.data.length > 0;
  const hasTopShillersData =
    topShillersQuery?.data && topShillersQuery?.data.length > 0;
  const hasTierGraphData =
    tierGraphQuery.data && tierGraphQuery.data.length > 0;

  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* Dashboard Header with Time Frame Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black dark:text-white">
          Dashboard
        </h2>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time Frame" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="daily">Daily</SelectItem> */}
            <SelectItem value="allTime">All Time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dashboard Statistics Cards */}
      <StatCards statsOverviewData={statsOverviewQuery.data} />

      {/* Charts */}
      <ChartSection
        campaignData={campaignGraphQuery.data}
        rewardsData={
          rewardsGraphQuery.data?.map((item: RewardGraphType) => ({
            name: item.month,
            rewards: item.rewards,
          })) ?? []
        }
        topShillersData={topShillersQuery.data}
        tierData={tierGraphQuery.data}
        hasCampaignData={hasCampaignGraphData}
        hasRewardsData={hasRewardsGraphData}
        hasTopShillersData={hasTopShillersData}
        hasTierData={hasTierGraphData}
      />

      {/* Shiller Performance Metrics Table */}
      <TopShillersTable
        shillers={topShillersQuery.data}
        hasData={!!hasTopShillersData}
      />
    </div>
  );
};

export default Dashboard;
