import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type: "status" | "proofType" | "tier";
}

// Define color and name mappings within the component or import from a shared constants file
const submissionStatusColors: { [key: string]: string } = {
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Default: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", // Added default
};

const proofTypeColors: { [key: string]: string } = {
  Text: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Image: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Default: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const userTierColors: { [key: string]: string } = {
  Bronze: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200",
  Silver: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  Gold: "bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200",
  Platinum: "bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-200",
  Diamond: "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200",
  Default: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const userTierNames: { [key: string]: string } = {
  Bronze: "Bronze",
  Silver: "Silver",
  Gold: "Gold",
  Platinum: "Platinum",
  Diamond: "Diamond",
  Default: "Unknown Tier",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let className = "";
  let text = status;

  switch (type) {
    case "status":
      className =
        submissionStatusColors[status] || submissionStatusColors.Default;
      break;
    case "proofType":
      className = proofTypeColors[status] || proofTypeColors.Default;
      break;
    case "tier":
      className = userTierColors[status] || userTierColors.Default;
      text = userTierNames[status] || userTierNames.Default;
      break;
    default:
      className = proofTypeColors.Default;
  }

  return (
    <Badge variant="outline" className={className}>
      {text}
    </Badge>
  );
};

export default StatusBadge;
