"use client";

import { Fragment } from "react";
import { CampaignType } from "@/types/campaign";
import { ChevronDown, ChevronRight, Heart } from "lucide-react";
import CampaignStatusBadge from "./CampaignStatusBadge";
import CampaignTasksList from "./CampaignTaskList";
import Image from "next/image";

interface CampaignMobileCardProps {
  campaign: CampaignType;
  isExpanded: boolean;
  onCardClick: (id: string | number) => void;
  isHighlighted: boolean;
}

const CampaignMobileCard = ({
  campaign,
  isExpanded,
  onCardClick,
  isHighlighted,
}: CampaignMobileCardProps) => {
  return (
    <Fragment>
      <div
        onClick={() => onCardClick(campaign.id)}
        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          isHighlighted
            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
            : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        }`}
      >
        {/* Header with DAO info and expand button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* DAO Image */}
            <div className="flex-shrink-0">
              {campaign.dao?.image ? (
                <Image
                  className="h-10 w-10 rounded-full object-cover"
                  src={campaign.dao.image}
                  alt={`${campaign.dao?.name} logo`}
                  width={40}
                  height={40}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {campaign.dao?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Campaign Name and DAO */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {campaign.name || "Unnamed Campaign"}
                </h3>
                {campaign.isFromFavoriteDao && (
                  <Heart className="h-4 w-4 text-red-400 fill-red-400 flex-shrink-0" />
                )}
              </div>
              {campaign.dao?.name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {campaign.dao.name}
                </p>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0 ml-2">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Campaign Details */}
        <div className="space-y-3">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <CampaignStatusBadge status={campaign.status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Created{" "}
              {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Budget and Tasks */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Budget
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {campaign.budget.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Tasks
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {campaign.totalTasks ?? "N/A"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {campaign.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  campaign.progress >= 75
                    ? "bg-green-500"
                    : campaign.progress >= 50
                    ? "bg-blue-500"
                    : campaign.progress >= 25
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${campaign.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Tasks Section */}
      {isExpanded && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <CampaignTasksList
            campaignId={campaign.id}
            campaignName={campaign.name}
          />
        </div>
      )}
    </Fragment>
  );
};

export default CampaignMobileCard;
