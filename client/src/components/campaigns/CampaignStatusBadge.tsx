"use client";

import { campaignStatusColors } from "./CampaignFilterBar";

interface CampaignStatusBadgeProps {
  status: string;
}
const CampaignStatusBadge = ({ status }: CampaignStatusBadgeProps) => {
  const colorClass =
    campaignStatusColors[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default CampaignStatusBadge;
