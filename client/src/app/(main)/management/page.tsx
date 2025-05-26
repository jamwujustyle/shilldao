"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext"; // Add this import
import ErrorMessage from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import PublicWrapper from "@/components/layout/PublicWrapper";
import { ManagementStatsCards } from "@/components/management/ManagementStatsCards";
import { ManagementList } from "@/components/management/ManagementList";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { NewDaoDialog } from "@/components/management/dialogs/NewDaoDialog";
import { EditDaoDialog } from "@/components/management/dialogs/EditDaoDialog";
import { NewCampaignDialog } from "@/components/management/dialogs/NewCampaignDialog";
import { NewTaskDialog } from "@/components/management/dialogs/NewTaskDialog";
import UnauthorizedAccess from "@/components/layout/UnauthorizaedAccess"; // Add this import

import daoService from "@/services/dao";
import campaignService from "@/services/campaign";

import { DaoType } from "@/types/dao";
import { CampaignType } from "@/types/campaign";

import { PlusCircle, ListX } from "lucide-react";

// Define a type for what is being displayed (DAOs or Campaigns)
type DisplayItemType = "DAOs" | "Campaigns";

const ManagementPage = () => {
  const { token } = useAuth(); // Add auth hook
  const [displayType, setDisplayType] = useState<DisplayItemType>("DAOs");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Dialog states
  const [isNewDAODialogOpen, setIsNewDAODialogOpen] = useState(false);
  const [isEditDAODialogOpen, setIsEditDAODialogOpen] = useState(false);
  const [isNewCampaignDialogOpen, setIsNewCampaignDialogOpen] = useState(false);
  const [selectedDAO, setSelectedDAO] = useState<DaoType | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignType | null>(
    null
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Add state for showing auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- Data Fetching ---
  const {
    data: myDAOsData,
    isLoading: isLoadingDAOs,
    error: daoError,
  } = useQuery<DaoType[], Error>({
    queryKey: ["myDAOs"],
    queryFn: () => daoService.getMyDaos(),
    refetchOnWindowFocus: false,
    enabled: !!token, // Only fetch if authenticated
  });
  const allDAOs = useMemo(() => myDAOsData || [], [myDAOsData]);

  const {
    data: myCampaignsData,
    isLoading: isLoadingCampaigns,
    error: campaignError,
  } = useQuery<CampaignType[], Error>({
    queryKey: ["myCampaigns"],
    queryFn: () => campaignService.getMyCampaigns(),
    refetchOnWindowFocus: false,
    enabled: !!token, // Only fetch if authenticated
  });
  const allCampaigns = useMemo(() => myCampaignsData || [], [myCampaignsData]);

  // --- Helper function to check auth before action ---
  const requireAuth = (action: () => void) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

  // --- Memoized Paginated Data ---
  const paginatedItems = useMemo(() => {
    const sourceData = displayType === "DAOs" ? allDAOs : allCampaigns;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sourceData.slice(startIndex, endIndex);
  }, [displayType, allDAOs, allCampaigns, currentPage, itemsPerPage]);

  const totalItemsCount = useMemo(() => {
    return displayType === "DAOs" ? allDAOs.length : allCampaigns.length;
  }, [displayType, allDAOs, allCampaigns]);

  const totalPages = useMemo(
    () => Math.ceil(totalItemsCount / itemsPerPage),
    [totalItemsCount, itemsPerPage]
  );
  const hasNextPage = useMemo(
    () => currentPage < totalPages,
    [currentPage, totalPages]
  );
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  const isLoading = displayType === "DAOs" ? isLoadingDAOs : isLoadingCampaigns;
  const currentError = displayType === "DAOs" ? daoError : campaignError;

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Dialog Open Handlers (modified to use requireAuth) ---
  const openNewCampaignDialog = (dao?: DaoType) => {
    requireAuth(() => {
      setSelectedDAO(dao || null);
      setIsNewCampaignDialogOpen(true);
    });
  };

  const openNewTaskDialog = (campaign: CampaignType) => {
    requireAuth(() => {
      setSelectedCampaign(campaign);
      setIsTaskDialogOpen(true);
    });
  };

  const openEditDAODialog = (dao: DaoType) => {
    requireAuth(() => {
      setSelectedDAO(dao);
      setIsEditDAODialogOpen(true);
    });
  };

  // --- Render Logic ---
  if (token && isLoading && paginatedItems.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Loading Management Data...
          </p>
        </div>
      </div>
    );
  }

  if (token && currentError && paginatedItems.length === 0) {
    return (
      <ErrorMessage
        message={`Error loading ${displayType}`}
        details={currentError.message}
      />
    );
  }

  // Dummy data for stats and performance
  const managementStats = {
    totalDaos: allDAOs.length,
    totalCampaigns: allCampaigns.length,
    activeCampaigns: allCampaigns.filter((c) => c.status === "Active").length,
    completedTasks: 0,
  };

  return (
    <PublicWrapper>
      <div className="flex flex-col space-y-4 p-4">
        {/* Header with filters and actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Management Overview
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-center">
            <Button
              onClick={() => requireAuth(() => setIsNewDAODialogOpen(true))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle size={16} className="mr-2" /> New DAO
            </Button>
            <Button
              onClick={() =>
                requireAuth(() => setIsNewCampaignDialogOpen(true))
              }
              variant="outline"
              disabled={!!token && allDAOs.length === 0} // Only disable if authenticated and no DAOs
            >
              <PlusCircle size={16} className="mr-2" /> New Campaign
            </Button>
          </div>
        </div>

        {/* Stats Cards - only show if authenticated */}
        {token && <ManagementStatsCards {...managementStats} />}

        {/* Display Type Toggle Buttons - only show if authenticated */}
        {token && (
          <div className="flex justify-center my-4">
            <Button
              onClick={() => {
                setDisplayType("DAOs");
                setCurrentPage(1);
              }}
              className={`w-32 py-2 px-4 text-sm font-medium focus:outline-none rounded-l-md border ${
                displayType === "DAOs"
                  ? "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-300 dark:text-slate-900 dark:hover:bg-slate-400 border-slate-800 dark:border-slate-300"
                  : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500"
              }`}
            >
              DAOs
            </Button>
            <Button
              onClick={() => {
                setDisplayType("Campaigns");
                setCurrentPage(1);
              }}
              className={`w-32 py-2 px-4 text-sm font-medium focus:outline-none rounded-r-md border border-l-0 ${
                displayType === "Campaigns"
                  ? "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-300 dark:text-slate-900 dark:hover:bg-slate-400 border-slate-800 dark:border-slate-300"
                  : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500"
              }`}
            >
              Campaigns
            </Button>
          </div>
        )}

        {/* Show auth message if not authenticated */}
        {!token ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view and manage your DAOs and
              campaigns.
            </p>
          </div>
        ) : (
          <>
            {/* Item List (DAOs or Campaigns) - only show if authenticated */}
            {paginatedItems.length > 0 ? (
              <ManagementList
                items={paginatedItems}
                itemType={displayType}
                onEditItem={(item) => {
                  if (displayType === "DAOs")
                    openEditDAODialog(item as DaoType);
                }}
                onAddItem={(parentId) => {
                  if (displayType === "DAOs" && parentId)
                    openNewCampaignDialog(
                      allDAOs.find((d) => d.id === parentId)!
                    );
                  else if (displayType === "Campaigns" && parentId)
                    openNewTaskDialog(
                      allCampaigns.find((c) => c.id === parentId)!
                    );
                }}
                isLoading={isLoading}
              />
            ) : (
              <EmptyState
                title={`No ${displayType} to display`}
                message={
                  currentError
                    ? `Error: ${currentError.message}`
                    : `Create a new ${
                        displayType === "DAOs" ? "DAO" : "Campaign"
                      } to get started.`
                }
                icon={
                  <div className="flex justify-center items-center">
                    <ListX className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                }
              />
            )}

            {/* Pagination Controls - only show if authenticated */}
            <ManagementPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <UnauthorizedAccess
              title="Authentication Required"
              description="Please connect your wallet to perform this action."
              showApplyButton={false}
              variant="authentication"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowAuthModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs - only render if authenticated */}
      {token && (
        <>
          <NewDaoDialog
            isOpen={isNewDAODialogOpen}
            onOpenChange={setIsNewDAODialogOpen}
          />

          <EditDaoDialog
            isOpen={isEditDAODialogOpen}
            onOpenChange={setIsEditDAODialogOpen}
            daoToEdit={selectedDAO}
          />

          <NewCampaignDialog
            isOpen={isNewCampaignDialogOpen}
            onOpenChange={setIsNewCampaignDialogOpen}
            allDAOs={allDAOs}
            selectedDAOId={selectedDAO?.id?.toString()}
          />

          <NewTaskDialog
            isOpen={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            selectedCampaign={selectedCampaign}
          />
        </>
      )}
    </PublicWrapper>
  );
};

export default ManagementPage;
