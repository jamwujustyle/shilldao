"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import UnauthorizedAccess from "@/components/layout/UnauthorizaedAccess";
import gradingService from "@/services/grading";

// Import new grading components
import SubmissionStatsCards from "@/components/grading/SubmissionsStatsCards";
import SubmissionFilters from "@/components/grading/SubmissionFilters";
import SubmissionTable from "@/components/grading/SubmissionTable";
import SubmissionCard from "@/components/grading/SubmissionCard";
import SubmissionPagination from "@/components/grading/SubmissionPagination";
import SubmissionDetailDialog from "@/components/grading/SubmissionDetailDialog";

import {
  SubmissionType,
  DetailedUserType,
  SubmissionRequestType,
  PaginatedSubmissionsType,
} from "@/types/grading";
import PageLoader from "@/components/ui/PageLoader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";

const statusStringToInteger = (status: string): string | undefined => {
  switch (status) {
    case "Pending":
      return "1";
    case "Approved":
      return "2";
    case "Rejected":
      return "3";
    default:
      return undefined;
  }
};

const proofTypeStringToInteger = (proofType: string): string | undefined => {
  switch (proofType) {
    case "Text":
      return "1";
    case "Image":
      return "2";
    case "Video":
      return "3";
    default:
      return undefined;
  }
};

const SubmissionsModeration = () => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);
  const { showToast, ToastContainer } = useToast();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: paginatedData,
    isLoading: isLoadingSubmissions,
    error: errorSubmissions,
  } = useQuery<PaginatedSubmissionsType | null, Error>({
    queryKey: [
      "submissionsForModerator",
      filterStatus,
      filterType,
      currentPage,
    ],
    queryFn: async () => {
      const params: { status?: string; proof_type?: string; page?: number } = {
        page: currentPage,
      };
      const numericStatus = statusStringToInteger(filterStatus);
      if (filterStatus !== "all" && numericStatus) {
        params.status = numericStatus;
      }
      const numericProofType = proofTypeStringToInteger(filterType);
      if (filterType !== "all" && numericProofType) {
        params.proof_type = numericProofType;
      }

      const effectiveParams =
        params.status || params.proof_type ? params : { page: currentPage };
      if (
        !params.status &&
        !params.proof_type &&
        Object.keys(effectiveParams).length === 1 &&
        effectiveParams.page === 1
      ) {
        return gradingService.getSubmissionsForModerator();
      }
      return gradingService.getSubmissionsForModerator(effectiveParams);
    },
  });
  const totalCount = [
    paginatedData?.approvedSubmissions || 0,
    paginatedData?.pendingSubmissions || 0,
    paginatedData?.rejectedSubmissions || 0,
  ].reduce((acc, value) => acc + value, 0);
  const submissions = useMemo(
    () => paginatedData?.results || [],
    [paginatedData]
  );
  const totalPages = useMemo(() => Math.ceil(totalCount / 10), [totalCount]); // Assuming page size 10
  const hasNextPage = useMemo(() => !!paginatedData?.next, [paginatedData]);
  const hasPreviousPage = useMemo(
    () => !!paginatedData?.previous,
    [paginatedData]
  );

  const {
    data: selectedSubmission,
    // isLoading: isLoadingSelectedSubmission, // This is not directly used for page-level loading indicator
    // error: errorSelectedSubmission, // This error is handled by the dialog or toast
  } = useQuery<(DetailedUserType & SubmissionType) | null, Error>({
    queryKey: ["submissionDetail", selectedSubmissionId],
    queryFn: async (): Promise<(DetailedUserType & SubmissionType) | null> => {
      if (!selectedSubmissionId) return null;
      const result = await gradingService.gradeSubmission(selectedSubmissionId);
      return result as (DetailedUserType & SubmissionType) | null;
    },
    enabled: !!selectedSubmissionId,
  });

  const updateSubmissionMutation = useMutation<
    SubmissionType | SubmissionRequestType,
    Error,
    { id: number; data: SubmissionRequestType }
  >({
    mutationFn: async ({ id, data }) => {
      const result = await gradingService.gradeSubmission(id, data);
      if (result === null) {
        throw new Error("Failed to update submission, received null response.");
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "submissionsForModerator",
          filterStatus,
          filterType,
          currentPage,
        ],
      });
      if (selectedSubmissionId) {
        queryClient.invalidateQueries({
          queryKey: ["submissionDetail", selectedSubmissionId],
        });
      }
      setDetailsVisible(false);
      setSelectedSubmissionId(null);
      setFeedback("");
      if (variables?.data?.status === 2) {
        showToast("Submission approved successfully!", "success");
      } else if (variables?.data?.status === 3) {
        showToast("Submission rejected successfully!", "success");
      } else {
        showToast("Submission updated successfully!", "success");
      }
    },
    onError: (error) => {
      showToast(error.message || "Failed to update submission.", "error");
    },
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSelectSubmission = (submission: SubmissionType) => {
    setSelectedSubmissionId(submission.id);
    setFeedback(submission.feedback || "");
    setDetailsVisible(true);
  };

  const handleApprove = () => {
    if (!selectedSubmissionId) return;
    updateSubmissionMutation.mutate({
      id: selectedSubmissionId,
      data: { id: selectedSubmissionId, status: 2, feedback },
    });
  };

  const handleReject = () => {
    if (!selectedSubmissionId) return;
    updateSubmissionMutation.mutate({
      id: selectedSubmissionId,
      data: { id: selectedSubmissionId, status: 3, feedback },
    });
  };

  if (role !== "Moderator") {
    return <UnauthorizedAccess />;
  }

  if (isLoadingSubmissions && submissions.length === 0 && currentPage === 1) {
    // Show PageLoader only on initial load
    return (
      <div className="relative p-6 text-black dark:text-gray-200">
        <PageLoader />
      </div>
    );
  }

  if (errorSubmissions && submissions.length === 0) {
    return (
      <ErrorMessage
        message="Error loading submissions"
        details={errorSubmissions.message}
      />
    );
  }

  return (
    <div className="relative p-6 text-black dark:text-gray-200">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Submissions Moderation</h1>
        <SubmissionFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
        />
      </div>

      <SubmissionStatsCards
        pendingCount={paginatedData?.pendingSubmissions}
        approvedCount={paginatedData?.approvedSubmissions}
        rejectedCount={paginatedData?.rejectedSubmissions}
        totalCount={totalCount}
      />

      <div>
        <Card className="hidden sm:block">
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              Review and moderate user task submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SubmissionTable
              submissions={submissions}
              onSelectSubmission={handleSelectSubmission}
              isLoading={isLoadingSubmissions && submissions.length > 0} // Show loading in table only if there's already data
            />
          </CardContent>
        </Card>

        <div className="block sm:hidden space-y-4">
          {isLoadingSubmissions && submissions.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-center text-gray-500 dark:text-gray-400">
                Loading submissions...
              </CardContent>
            </Card>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-center text-gray-500 dark:text-gray-400">
                No submissions found.
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission: SubmissionType) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onSelectSubmission={handleSelectSubmission}
              />
            ))
          )}
        </div>
      </div>

      <SubmissionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={handlePageChange}
        isLoading={isLoadingSubmissions}
      />

      <SubmissionDetailDialog
        open={detailsVisible}
        onOpenChange={setDetailsVisible}
        selectedSubmission={selectedSubmission || null}
        feedback={feedback}
        setFeedback={setFeedback}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default SubmissionsModeration;
