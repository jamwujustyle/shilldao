import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Users, Share2, TrendingUp, Award, LucideIcon } from "lucide-react";
import React from "react";
import { StatsOverview } from "@/types/statsOverview";
interface StatContentProps {
  value: React.ReactNode;
  note?: string;
}

// Define the StatContent component
const StatContent: React.FC<StatContentProps> = ({ value, note }) => {
  const hasData = value !== null && value !== undefined;

  return hasData ? (
    <>
      <div className="text-2xl font-bold text-black dark:text-white">
        {value}
      </div>
      {note && <div className="text-xs text-muted-foreground mt-1">{note}</div>}
    </>
  ) : (
    <div className="text-sm text-gray-400">No data available</div>
  );
};

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  value: React.ReactNode;
  note?: string;
  children?: React.ReactNode;
}

// Single StatCard component to avoid repetition
const StatCard: React.FC<StatCardProps> = ({
  title,
  icon: Icon,
  value,
  note,
  children,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <StatContent value={value} note={note} />
        {children}
      </CardContent>
    </Card>
  );
};

interface StatCardsProps {
  statsOverviewData: StatsOverview | undefined;
}

// Main StatCards component that uses the data from props
const StatCards: React.FC<StatCardsProps> = ({ statsOverviewData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Active Shillers"
        icon={Users}
        value={statsOverviewData?.activeShillers || "0"}
        note="Number of shillers currently active in campaigns"
      />

      <StatCard
        title="Active Campaigns"
        icon={Share2}
        value={statsOverviewData?.totalCampaigns || "0"}
        note="Campaigns currently running"
      />

      <StatCard
        title="Available Tasks"
        icon={TrendingUp}
        value={statsOverviewData?.totalTasks || "0"}
        note="Tasks available for shillers to complete"
      />

      <StatCard
        title="SHILL Token Price" // Updated title
        icon={Award}
        value={"$" + statsOverviewData?.shillPriceUsd || "0"} // Use USD price, similar to ethPrice
      >
        <div className="text-xs text-muted-foreground mt-1">
          Current price of the SHILL token in USD
        </div>
      </StatCard>
    </div>
  );
};

export { StatCards, StatCard, StatContent };
