"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import campaignService from "@/services/campaign";
import { Suspense } from "react";
import { taskService } from "@/services/task";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/empty-state";

import { Share2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";

import {
  CampaignType,
  PaginatedCampaignsType,
  CampaignOverviewType,
} from "@/types/campaign"; // Import CampaignOverviewType
import { TaskType } from "@/types/task";
import PublicWrapper from "@/components/layout/PublicWrapper";
import CampaignStatsCards from "@/components/campaigns/CampaignStatsCards";
import CampaignFilterBar from "@/components/campaigns/CampaignFilterBar";
import CampaignTable from "@/components/campaigns/CampaignTable";
import CampaignPagination from "@/components/campaigns/CampaignPagination";

const CampaignsPageContent = () => {
  const searchParams = useSearchParams();
  const [filterCampaignStatus, setFilterCampaignStatus] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCampaignId, setExpandedCampaignId] = useState<
    string | number | null
  >(null);
  const [campaignTasks, setCampaignTasks] = useState<{
    [key: string | number]: TaskType[];
  }>({});

  const {
    data: paginatedCampaignData,
    isLoading,
    error,
  } = useQuery<PaginatedCampaignsType, Error>({
    queryKey: ["campaigns", currentPage, filterCampaignStatus], // Add filterCampaignStatus to queryKey
    queryFn: () => {
      let statusValue: number | undefined = undefined;
      if (filterCampaignStatus !== "all") {
        // Map string status to integer value
        switch (filterCampaignStatus) {
          case "Active":
            statusValue = 1;
            break;
          case "Planning":
            statusValue = 2;
            break;
          case "Completed":
            statusValue = 3;
            break;
          case "On Hold":
            statusValue = 4;
            break;
          default:
            statusValue = undefined; // Handle unknown status
        }
      }
      return campaignService.getCampaignStats({
        page: currentPage,
        status: statusValue, // Pass integer status
      });
    },
  });

  const { data: campaignOverviewData } = useQuery<CampaignOverviewType, Error>({
    queryKey: ["campaignOverview"],
    queryFn: () => campaignService.getCampaignOverview(),
  });

  const campaigns = useMemo(
    () => paginatedCampaignData?.results || [],
    [paginatedCampaignData]
  );

  const hasNextPage = useMemo(
    () => !!paginatedCampaignData?.next,
    [paginatedCampaignData]
  );
  const hasPreviousPage = useMemo(
    () => !!paginatedCampaignData?.previous,
    [paginatedCampaignData]
  );

  const handleCampaignExpand = useCallback(
    (campaignId: string | number) => {
      const isCurrentlyExpanded = expandedCampaignId === campaignId;
      if (isCurrentlyExpanded) {
        setExpandedCampaignId(null);
      } else {
        setExpandedCampaignId(campaignId);
        if (!campaignTasks[campaignId]) {
          taskService
            .getTasksByCampaign(campaignId)
            .then((tasks) => {
              if (tasks) {
                setCampaignTasks((prevTasks) => ({
                  ...prevTasks,
                  [campaignId]: tasks,
                }));
              }
            })
            .catch((fetchError) =>
              console.error("Failed to fetch tasks:", fetchError)
            );
        }
      }
    },
    [expandedCampaignId, campaignTasks]
  );

  useEffect(() => {
    const campaignIdFromUrl = searchParams.get("id");
    if (campaignIdFromUrl && campaigns.length > 0) {
      const campaignToExpand = campaigns.find(
        (c: CampaignType) => c.id.toString() === campaignIdFromUrl
      );
      if (
        campaignToExpand &&
        expandedCampaignId !== campaignToExpand.id.toString()
      ) {
        handleCampaignExpand(campaignToExpand.id.toString());
      }
    }
  }, [searchParams, campaigns, expandedCampaignId, handleCampaignExpand]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setCurrentPage(newPage);
      setExpandedCampaignId(null);
      setCampaignTasks({});
    }
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Campaigns...</p>
        </div>
      </div>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <ErrorMessage message="Error loading campaigns" details={error.message} />
    );
  }

  // Remove frontend calculations
  // const activeCampaigns = campaigns.filter(
  //   (campaign: CampaignType) => campaign.status === "Active"
  // ).length;
  // const totalBudget = campaigns.reduce(
  //   (sum, campaign: CampaignType) => sum + (parseFloat(campaign.budget) || 0),
  //   0
  // );

  return (
    <PublicWrapper>
      <div className="p-6 text-black dark:text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <CampaignFilterBar
            filterStatus={filterCampaignStatus}
            onFilterChange={setFilterCampaignStatus}
          />
        </div>

        <CampaignStatsCards
          overviewStats={
            campaignOverviewData || {
              activeCampaigns: 0,
              completedCampaigns: 0,
              totalBudget: 0,
              totalTasks: 0,
            }
          } // Pass the overview data or default
        />

        {campaigns.length === 0 ? (
          <EmptyState
            title="No Campaigns Found"
            message="There are currently no campaigns to display."
            icon={
              <div className="text-center">
                <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 inline-block" />
              </div>
            }
          />
        ) : (
          <>
            <CampaignTable
              campaigns={campaigns}
              expandedCampaignId={expandedCampaignId}
              onCampaignRowClick={handleCampaignExpand}
              highlightedCampaignId={searchParams.get("id")}
            />

            <CampaignPagination
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </PublicWrapper>
  );
};

const CampaignsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignsPageContent />
    </Suspense>
  );
};

export default CampaignsPage;
