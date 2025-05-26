"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const campaignStatusColors: { [key: string]: string } = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  "On Hold":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface CampaignFilterBarProps {
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

const CampaignFilterBar = ({
  filterStatus,
  onFilterChange,
}: CampaignFilterBarProps) => {
  return (
    <div className="flex gap-3">
      <Select value={filterStatus} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[155px] bg-white dark:bg-gray-700 text-black dark:text-gray-200">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.keys(campaignStatusColors).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CampaignFilterBar;
