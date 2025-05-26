import React from "react";
import { BarChart, ChartPieIcon, LineChartIcon } from "lucide-react";

type EmptyStateProps = {
  type?: "chart" | "table" | "pie" | "general";
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  height?: string;
};

export const EmptyState = ({
  type = "general",
  title = "No data available",
  message = "there's no data to display at the moment",
  icon,
  height = "100%",
}: EmptyStateProps) => {
  const getDefaultIcon = () => {
    switch (type) {
      case "chart":
        return (
          <LineChartIcon className="h-12 w-12 text-gray-300 dark:-text-gray-600" />
        );
      case "pie":
        return (
          <ChartPieIcon className="h-12 w-12 text-gray-300 dark:-text-gray-600" />
        );
      case "table":
        return (
          <BarChart className="h-12 w-12 text-gray-300 dark:-text-gray-600" />
        );
      default:
        return (
          <BarChart className="h-12 w-12 text-gray-300 dark:-text-gray-600" />
        );
    }
  };
  return (
    <div
      className="flex flex-col items-center justify-center w-full"
      style={{ height }}
    >
      <div className="text-center p-6">
        {icon || getDefaultIcon()}
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          {" "}
          {title}{" "}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {" "}
          {message}{" "}
        </p>
      </div>
    </div>
  );
};

const EmptyLineChart = ({ height = "100%" }: { height?: string }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full bg-gray-50 dark:bg-gray-800/20 rounded-md border border dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <EmptyState type="chart" message="No activity data available yet" />
      </div>
    </div>
  );
};
const EmptyBarChart = ({ height = "100%" }: { height?: string }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full bg-gray-50 dark:bg-gray-800/20 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <EmptyState type="chart" message="No data available for this period" />
      </div>
    </div>
  );
};
const EmptyPieChart = ({ height = "100%" }: { height?: string }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full bg-gray-50 dark:bg-gray-800/20 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <EmptyState type="pie" message="No distribution data available" />
      </div>
    </div>
  );
};

const EmptyTable = ({ height = "100%" }: { height?: string }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full bg-gray-50 dark:bg-gray-800/20 rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <EmptyState type="table" message="No records available yet" />
      </div>
    </div>
  );
};

export { EmptyLineChart, EmptyBarChart, EmptyPieChart, EmptyTable };
