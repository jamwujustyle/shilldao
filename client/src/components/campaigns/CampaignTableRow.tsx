"use client";

import { Fragment } from "react";
import { CampaignType } from "@/types/campaign";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Heart } from "lucide-react";
import CampaignStatusBadge from "./CampaignStatusBadge";
import CampaignTasksList from "./CampaignTaskList";
import Image from "next/image"; // Import Image component

interface CampaignTableRowProps {
  campaign: CampaignType;
  isExpanded: boolean;
  onRowClick: (id: string | number) => void;
  highlightedCampaignId?: string | number | null;
}

const CampaignTableRow = ({
  campaign,
  isExpanded,
  onRowClick,
  highlightedCampaignId,
}: CampaignTableRowProps) => {
  const isHighlighted = highlightedCampaignId === campaign.id.toString();

  return (
    <Fragment>
      <TableRow
        onClick={() => onRowClick(campaign.id)}
        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
          isHighlighted ? "bg-blue-50 dark:bg-blue-800" : ""
        }`}
      >
        <TableCell>
          {" "}
          {/* Removed whitespace-nowrap */}
          {/* Responsive flex container: stack on mobile, row on sm+ */}
          <div className="w-full flex flex-col items-start sm:flex-row sm:items-center sm:space-x-2">
            {" "}
            {/* Added w-full */}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
            )}
            {/* Responsive margin for image container */}
            <div className="flex-shrink-0 h-10 w-10 mb-2 sm:mb-0 sm:mr-3">
              {campaign.dao?.image ? (
                <Image
                  className="h-10 w-10 rounded-full object-cover"
                  src={campaign.dao.image}
                  alt={`${campaign.dao?.name} logo`}
                  width={40} // Corresponds to w-10 (40px)
                  height={40} // Corresponds to h-10 (40px)
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {campaign.dao?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>
            {/* Text block with flex-wrap for better text flow */}
            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center">
              {campaign.dao?.name && (
                <span className="mr-2">{campaign.dao.name}</span>
              )}
              {campaign.isFromFavoriteDao && (
                <Heart className="h-4 w-4 mr-1 text-red-400 fill-red-400" />
              )}
              Created on{" "}
              {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap hidden sm:table-cell">
          <CampaignStatusBadge status={campaign.status} />
        </TableCell>
        <TableCell className="whitespace-nowrap hidden sm:table-cell">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {campaign.budget.toLocaleString()}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap hidden sm:table-cell">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {campaign.totalTasks ?? "N/A"}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap hidden sm:table-cell">
          <div className="w-full">
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                <div
                  style={{ width: `${campaign.progress}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    campaign.progress >= 75
                      ? "bg-green-500"
                      : campaign.progress >= 50
                      ? "bg-blue-500"
                      : campaign.progress >= 25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {campaign.progress}% Complete
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="p-0 bg-gray-50 dark:bg-gray-800">
            <CampaignTasksList
              campaignId={campaign.id}
              campaignName={campaign.name}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default CampaignTableRow;
