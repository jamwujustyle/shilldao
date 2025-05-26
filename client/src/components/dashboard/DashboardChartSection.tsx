"use client";
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  EmptyLineChart,
  EmptyBarChart,
  EmptyPieChart,
} from "@/components/ui/empty-state";
import React, { useState, useEffect } from "react";

// Colors for the tier distribution chart
const COLORS = ["#FF8042", "#FFBB28", "#00C49F", "#0088FE", "#8884d8"];

interface CampaignActivityData {
  name: string;
  tasks: number;
  submissions: number;
}

interface RewardsDistributionData {
  name: string;
  rewards: number;
}

interface TopShillerData {
  id: number; // Corrected id type to number
  image: string | null;
  username: string | null;
  approvedSubmissionsCount: number;
  approvalRate: number;
  tier: string;
  growth: number | null;
}

interface TierData {
  name: string;
  value: number;
}

interface ChartProps<T> {
  data: T[] | null | undefined;
  hasData: boolean;
}

// Campaign Activity Chart Component
const CampaignActivityChart: React.FC<ChartProps<CampaignActivityData>> = ({
  data,
  hasData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Activity</CardTitle>
        <CardDescription>
          Task capacity vs. approved submissions over time
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data ?? []} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend layout="horizontal" align="center" verticalAlign="top" />
              <Line
                type="monotone"
                dataKey="tasks"
                name="Task Capacity"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                name="Approved Submissions"
                stroke="#82ca9d"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyLineChart height="100%" />
        )}
      </CardContent>
    </Card>
  );
};

// Rewards Distribution Chart Component
const RewardsDistributionChart: React.FC<
  ChartProps<RewardsDistributionData>
> = ({ data, hasData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards Distribution</CardTitle>
        <CardDescription>Total rewards paid over time</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data ?? []} // Use nullish coalescing for data
              margin={{ bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend
                verticalAlign="top"
                align="center"
                wrapperStyle={{ marginTop: 1 }}
              />
              <Bar dataKey="rewards" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyBarChart height="100%" />
        )}
      </CardContent>
    </Card>
  );
};

// Top Shillers Performance Chart Component
const TopShillersPerformanceChart: React.FC<ChartProps<TopShillerData>> = ({
  data,
  hasData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Shillers Performance</CardTitle>
        <CardDescription>By approval count and rate</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data ?? []}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="username"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Approved Tasks") return value;
                  if (name === "Approval Rate") return `${value}%`;
                  return value;
                }}
              />
              <Legend verticalAlign="top" align="center" />
              <Bar
                yAxisId="left"
                dataKey="approvedSubmissionsCount"
                fill="#8884d8"
                name="Approved Tasks"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="approvalRate"
                stroke="#ff7300"
                name="Approval Rate"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyBarChart height="100%" />
        )}
      </CardContent>
    </Card>
  );
};

// User Tier Distribution Chart Component
const UserTierDistributionChart: React.FC<ChartProps<TierData>> = ({
  data,
  hasData,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint is 768px. Labels will be hidden below this.
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Tier Distribution</CardTitle>
        <CardDescription>Shillers by tier level</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data ?? []}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={
                  isMobile
                    ? undefined
                    : (entry: TierData) => `${entry.name}: ${entry.value}`
                }
              >
                {(data ?? []).map((entry: TierData, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyPieChart height="100%" />
        )}
      </CardContent>
    </Card>
  );
};

interface ChartSectionProps {
  campaignData: CampaignActivityData[] | null | undefined;
  rewardsData: RewardsDistributionData[] | null | undefined;
  topShillersData: TopShillerData[] | null | undefined;
  tierData: TierData[] | null | undefined;
  hasCampaignData: boolean | undefined;
  hasRewardsData: boolean | null | undefined;
  hasTopShillersData: boolean | undefined;
  hasTierData: boolean | null | undefined;
}

// Main Chart Section Component
const ChartSection: React.FC<ChartSectionProps> = ({
  campaignData,
  rewardsData,
  topShillersData,
  tierData,
  hasCampaignData,
  hasRewardsData,
  hasTopShillersData,
  hasTierData,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampaignActivityChart
          data={campaignData}
          hasData={!!hasCampaignData}
        />
        <RewardsDistributionChart
          data={rewardsData}
          hasData={!!hasRewardsData}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopShillersPerformanceChart
          data={topShillersData}
          hasData={!!hasTopShillersData}
        />
        <UserTierDistributionChart data={tierData} hasData={!!hasTierData} />
      </div>
    </div>
  );
};

export {
  ChartSection,
  CampaignActivityChart,
  RewardsDistributionChart,
  TopShillersPerformanceChart,
  UserTierDistributionChart,
};
