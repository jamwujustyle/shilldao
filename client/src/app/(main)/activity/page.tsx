"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import PublicWrapper from "@/components/layout/PublicWrapper";
// import AuthWrapper from "@/components/layout/AuthWrapper";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FileText,
  Image as LucideImage, // Renamed to avoid conflict with next/image
  Video,
  Share2, // Import Share2
} from "lucide-react";
import { ActivityStatsCards } from "@/components/activity/ActivityStatsCards";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { ActivityPagination } from "@/components/activity/ActivityPagination";
import { ApprovalPerformance } from "@/components/activity/ApprovalPerformance"; // Added import
import { useQuery } from "@tanstack/react-query";
import submissionsService from "@/services/activity";
import {
  ProofType,
  PaginatedActivityType,
  SubmissionType as ActivitySubmissionType,
  SubmissionsOverviewType,
} from "@/types/activity";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/empty-state"; // Added EmptyState import
import { UserRewards } from "@/components/activity/UserRewards";
import userService from "@/services/user";
import { UserRewardsType } from "@/types/user";

const Activity = () => {
  const [filter, setFilter] = useState("all");
  // const [timeFrame, setTimeFrame] = useState("weekly");
  const [currentPage, setCurrentPage] = useState(1);
  const { token } = useAuth();

  const getStatusFilterValue = (filterKey: string): string | null => {
    switch (filterKey) {
      case "approved":
        return "2";
      case "pending":
        return "1";
      case "rejected":
        return "3";
      case "all":
      default:
        return null;
    }
  };
  const { data: userRewardsData } = useQuery<UserRewardsType[], Error>({
    queryKey: ["userRewards", token],
    queryFn: userService.getUserRewards,
    enabled: !!token,
  });

  const userRewardsMemo = useMemo(
    () => userRewardsData || [], // Return empty array as fallback
    [userRewardsData]
  );

  const {
    data: paginatedActivitiesData,
    error: submissionsHError,
    isLoading: submissionsHLoading,
  } = useQuery<PaginatedActivityType | null, Error>({
    queryKey: ["submissionsHistory", filter, currentPage, token],
    queryFn: () => {
      const statusParam = getStatusFilterValue(filter);
      return submissionsService.getSubmissionsHistory({
        status: statusParam,
        page: currentPage,
      });
    },
    refetchOnWindowFocus: false,
    enabled: !!token,
  });

  const filteredActivities: ActivitySubmissionType[] = useMemo(
    () => paginatedActivitiesData?.results || [],
    [paginatedActivitiesData]
  );
  const totalActivitiesCount = useMemo(
    () => paginatedActivitiesData?.count || 0,
    [paginatedActivitiesData]
  );
  const totalActivityPages = useMemo(
    () => Math.ceil(totalActivitiesCount / 10),
    [totalActivitiesCount]
  ); // Assuming page size 10
  const hasNextActivityPage = useMemo(
    () => !!paginatedActivitiesData?.next,
    [paginatedActivitiesData]
  );
  const hasPreviousActivityPage = useMemo(
    () => !!paginatedActivitiesData?.previous,
    [paginatedActivitiesData]
  );

  const {
    data: submissionsOverview,
    error: submissionsOError,
    isLoading: submissionsOLoading,
  } = useQuery<SubmissionsOverviewType | null, Error>({
    queryKey: ["submissionsOverview", token],
    queryFn: submissionsService.getSubmissionsOverview,
    enabled: !!token,
  });

  const isLoading = token ? submissionsHLoading || submissionsOLoading : false; // Don't show loading if not authenticated

  const handleActivityPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalActivityPages) {
      setCurrentPage(newPage);
    }
  };

  // Render loading state only if authenticated and loading
  if (token && isLoading && filteredActivities.length === 0) {
    return (
      <PublicWrapper>
        <div className="p-6 flex justify-center items-center min-h-[500px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Activity...</p>
          </div>
        </div>
      </PublicWrapper>
    );
  }

  // Render error state only if authenticated and error occurred
  if (
    token &&
    (submissionsHError || submissionsOError) &&
    filteredActivities.length === 0
  ) {
    return (
      <PublicWrapper>
        <ErrorMessage
          message="Error loading activity data"
          details={
            submissionsHError?.message ||
            submissionsOError?.message ||
            "Network Error"
          }
        />
      </PublicWrapper>
    );
  }

  // If loading is complete, no errors, but essential overview data is missing
  // if (
  //   !submissionsOverview &&
  //   !isLoading &&
  //   !submissionsHError &&
  //   !submissionsOError
  // ) {
  //   return (
  //     <AuthWrapper>
  //       {" "}
  //       {/* Keep AuthWrapper for consistent page structure */}
  //       <EmptyState
  //         title="Activity Data Unavailable"
  //         message="Could not load activity overview data at this time."
  //         icon={
  //           <ListX className="h-12 w-12 text-gray-400 dark:text-gray-500" />
  //         }
  //       />
  //     </AuthWrapper>
  //   );
  // }

  const totalSubmissions =
    (submissionsOverview?.approvedSubmissions || 0) +
    (submissionsOverview?.pendingSubmissions || 0) +
    (submissionsOverview?.rejectedSubmissions || 0);

  // Helper function to calculate approval percentage for a specific proof type
  const calculateProofTypeApprovalRate = (
    proofTypeData: { total: number; approved: number } | undefined
  ): number => {
    if (!proofTypeData || proofTypeData.total === 0) {
      return 0;
    }
    return Math.round((proofTypeData.approved / proofTypeData.total) * 100);
  };

  const textApprovalRate = calculateProofTypeApprovalRate(
    submissionsOverview?.textSubmissions
  );
  const imageApprovalRate = calculateProofTypeApprovalRate(
    submissionsOverview?.imageSubmissions
  );
  const videoApprovalRate = calculateProofTypeApprovalRate(
    submissionsOverview?.videoSubmissions
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get icon for proof type
  const getProofTypeIcon = (type: ProofType | string) => {
    switch (type) {
      case ProofType.Text:
        return <FileText className="h-4 w-4" />;
      case ProofType.Image:
        return <LucideImage className="h-4 w-4" />; // Use renamed Lucide Image
      case ProofType.Video:
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <PublicWrapper>
      <div className="flex flex-col space-y-4 p-4">
        {/* Header with filters */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            My Activity
          </h2>
          <div className="flex gap-3 items-center">
            {" "}
            {/* Container for filters */}
            <Select value={filter} onValueChange={(value) => setFilter(value)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 text-black dark:text-gray-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!token ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view your activity.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <ActivityStatsCards
              submissionsOverview={submissionsOverview}
              // timeFrame={timeFrame}
            />
            {filteredActivities.length === 0 &&
            !submissionsHLoading &&
            !submissionsHError ? (
              <EmptyState
                title="No Activities Found"
                message="There are currently no activities to display for the selected filter."
                icon={
                  <div className="text-center">
                    <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 inline-block" />
                  </div>
                }
              />
            ) : (
              <>
                {/* Activity Timeline */}
                <ActivityTimeline
                  filteredActivities={filteredActivities}
                  formatDate={formatDate}
                  getProofTypeIcon={getProofTypeIcon}
                />
                {/* Pagination Controls for Activity List */}
                <ActivityPagination
                  currentPage={currentPage}
                  totalActivityPages={totalActivityPages}
                  handleActivityPageChange={handleActivityPageChange}
                  hasPreviousActivityPage={hasPreviousActivityPage}
                  hasNextActivityPage={hasNextActivityPage}
                  submissionsHLoading={submissionsHLoading}
                />
              </>
            )}
            {/* Approval Rate Summary */}
            <ApprovalPerformance
              submissionsOverview={submissionsOverview}
              totalSubmissions={totalSubmissions}
              textApprovalRate={textApprovalRate}
              imageApprovalRate={imageApprovalRate}
              videoApprovalRate={videoApprovalRate}
            />
            {/* Add the UserRewards component here, right after ApprovalPerformance */}
            <UserRewards rewards={userRewardsMemo} />
          </>
        )}
      </div>
    </PublicWrapper>
  );
};

export default Activity;
