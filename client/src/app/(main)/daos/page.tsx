"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";

import ErrorMessage from "@/components/ui/ErrorMessage";

import daoService from "@/services/dao";
import userService from "@/services/user";
import { DaoType } from "@/types/dao";
import { CampaignType } from "@/types/campaign";
import PublicWrapper from "@/components/layout/PublicWrapper";

interface PaginatedResponse<T> {
  next: string | null;
  results: T[];
  count: number;
}

interface ToggleFavoriteResponse {
  status: string;
}

// Import new components and hook
import DaoFilterBar from "@/components/daos/DaoFilterBar";
import DaoList from "@/components/daos/DaoList";
import DaoDetailDialog from "@/components/daos/DaoDetailDialog";
import CampaignDetailDialog from "@/components/daos/CampaignDetailDialog";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation"; // Import useRouter
import { useRef } from "react"; // Import useRef
// Removed redundant Button import, it's handled by DaoList or DaoFilterBar

const DAOsPage = () => {
  const router = useRouter(); // Initialize router
  const searchInputRef = useRef<HTMLInputElement>(null); // Create a ref for the search input
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentOrdering, setCurrentOrdering] = useState("-created_at"); // Added state for ordering
  const [selectedDAO, setSelectedDAO] = useState<DaoType | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignType | null>(
    null
  );

  const queryClient = useQueryClient();

  // Query for all DAOs (paginated)
  const {
    data: allDaosData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingAllDaos,
    error: errorAllDaos,
  } = useInfiniteQuery({
    queryKey: ["allDaos", debouncedSearchTerm, currentOrdering], // Added currentOrdering to queryKey
    queryFn: ({ pageParam }) =>
      daoService.getDAOs({
        pageParam,
        searchTerm: debouncedSearchTerm,
        ordering: currentOrdering, // Pass currentOrdering to the service
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<DaoType>) => {
      if (lastPage.next) {
        try {
          const url = new URL(lastPage.next);
          const nextPageNum = url.searchParams.get("page");
          return nextPageNum ? parseInt(nextPageNum, 10) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    enabled: activeCategory === "all",
  });

  // Query for favorite DAOs (not paginated)
  const {
    data: favoriteDaosData,
    isLoading: isLoadingFavoriteDaos,
    error: errorFavoriteDaos,
    refetch: refetchFavoriteDaos,
  } = useQuery({
    queryKey: ["favoriteDaos", debouncedSearchTerm],
    queryFn: () =>
      daoService.getFavoriteDAOs({ searchTerm: debouncedSearchTerm }),
    enabled: activeCategory === "favorites",
  });

  // Query for Most Active DAOs (paginated)
  const {
    data: mostActiveDaosData,
    fetchNextPage: fetchNextPageMostActive,
    hasNextPage: hasNextPageMostActive,
    isFetchingNextPage: isFetchingNextPageMostActive,
    isLoading: isLoadingMostActiveDaos,
    error: errorMostActiveDaos,
    refetch: refetchMostActiveDaos,
  } = useInfiniteQuery({
    queryKey: ["mostActiveDaos", debouncedSearchTerm],
    queryFn: ({ pageParam }) =>
      daoService.getMostActiveDAOs({
        pageParam,
        searchTerm: debouncedSearchTerm,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<DaoType>) => {
      if (lastPage.next) {
        try {
          const url = new URL(lastPage.next);
          const nextPageNum = url.searchParams.get("page");
          return nextPageNum ? parseInt(nextPageNum, 10) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    enabled: activeCategory === "active",
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (daoId: number) => userService.toggleFavoriteDAO(daoId),
    onSuccess: (responseData: ToggleFavoriteResponse, daoId: number) => {
      queryClient.invalidateQueries({ queryKey: ["allDaos"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteDaos"] });
      queryClient.invalidateQueries({ queryKey: ["mostActiveDaos"] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });

      if (selectedDAO && selectedDAO.id === daoId) {
        setSelectedDAO((prevDao) =>
          prevDao
            ? { ...prevDao, isFavorited: responseData.status === "favorited" }
            : null
        );
      }
    },
    onError: (error) => {
      console.error("Error toggling favorite:", error);
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent, daoId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(daoId);
  };

  const allDaosFromPages: DaoType[] = useMemo(
    () =>
      allDaosData?.pages.flatMap(
        (page: { results: DaoType[] }) => page.results
      ) ?? [],
    [allDaosData]
  );

  const mostActiveDaosFromPages: DaoType[] = useMemo(
    () =>
      mostActiveDaosData?.pages.flatMap(
        (page: { results: DaoType[] }) => page.results
      ) ?? [],
    [mostActiveDaosData]
  );

  const categories = useMemo(() => {
    return [
      { id: "all", name: "All DAOs" },
      { id: "favorites", name: "Favorites" },
      { id: "active", name: "Most Active" },
    ];
  }, []);

  const filteredDaos: DaoType[] = useMemo(() => {
    let sourceData: DaoType[] = [];

    if (activeCategory === "all") {
      sourceData = allDaosFromPages;
    } else if (activeCategory === "favorites") {
      sourceData = favoriteDaosData ?? [];
    } else if (activeCategory === "active") {
      sourceData = mostActiveDaosFromPages;
    }

    if (!sourceData.length) {
      if (activeCategory === "all" && !isLoadingAllDaos && !isFetchingNextPage)
        return [];
      if (activeCategory === "favorites" && !isLoadingFavoriteDaos) return [];
      if (
        activeCategory === "active" &&
        !isLoadingMostActiveDaos &&
        !isFetchingNextPageMostActive
      )
        return [];
    }
    return sourceData;
  }, [
    allDaosFromPages,
    favoriteDaosData,
    mostActiveDaosFromPages,
    activeCategory,
    isLoadingAllDaos,
    isLoadingFavoriteDaos,
    isLoadingMostActiveDaos,
    isFetchingNextPage,
    isFetchingNextPageMostActive,
  ]);

  const handleDAOClick = (dao: DaoType) => setSelectedDAO(dao);

  const handleOpenCampaignDetailsDialog = (
    campaign: CampaignType,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedCampaign(campaign);
  };

  const handleNavigateToCampaignPage = (
    campaign: CampaignType,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    router.push(`/campaigns?id=${campaign.id}`);
    closeDialogs(); // Close the DAO dialog after navigating
  };

  const closeDialogs = () => {
    // Closes all dialogs
    setSelectedDAO(null);
    setSelectedCampaign(null);
  };

  const handleCloseCampaignDetailDialog = () => {
    // Closes only campaign detail
    setSelectedCampaign(null);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialogs();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  let currentIsLoading = false;
  let currentError: Error | null = null;
  let currentFetchNextPage: (() => void) | undefined = undefined;
  let currentHasNextPage: boolean | undefined = undefined;
  let currentIsFetchingNextPage = false;

  if (activeCategory === "all") {
    currentIsLoading = isLoadingAllDaos;
    currentError = errorAllDaos as Error | null;
    currentFetchNextPage = fetchNextPage;
    currentHasNextPage = hasNextPage;
    currentIsFetchingNextPage = isFetchingNextPage;
  } else if (activeCategory === "favorites") {
    currentIsLoading = isLoadingFavoriteDaos;
    currentError = errorFavoriteDaos as Error | null;
  } else if (activeCategory === "active") {
    currentIsLoading = isLoadingMostActiveDaos;
    currentError = errorMostActiveDaos as Error | null;
    currentFetchNextPage = fetchNextPageMostActive;
    currentHasNextPage = hasNextPageMostActive;
    currentIsFetchingNextPage = isFetchingNextPageMostActive;
  }

  // Effect to focus the search input after search term changes
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [debouncedSearchTerm]);

  if (currentIsLoading && filteredDaos.length === 0) {
    return (
      <PublicWrapper>
        <div className="p-6 flex justify-center items-center min-h-[500px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading DAOs...</p>
          </div>
        </div>
      </PublicWrapper>
    );
  }

  if (currentError && filteredDaos.length === 0) {
    return (
      <ErrorMessage
        message={`Error loading ${activeCategory} DAOs`}
        details={currentError.message || "Network Error"}
      />
    );
  }

  return (
    <PublicWrapper>
      <div className="p-6 pb-12 text-black dark:text-gray-200">
        <div className="flex flex-col space-y-8">
          <DaoFilterBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            categories={categories}
            activeCategory={activeCategory}
            onActiveCategoryChange={setActiveCategory}
            onRefetchFavorites={refetchFavoriteDaos}
            onRefetchMostActive={refetchMostActiveDaos}
            currentOrdering={currentOrdering}
            onOrderingChange={(newOrdering) => {
              setCurrentOrdering(newOrdering);
              // Optionally, immediately refetch or let the queryKey change trigger it
              // queryClient.invalidateQueries({ queryKey: ["allDaos", debouncedSearchTerm, newOrdering] });
            }}
            inputRef={searchInputRef} // Pass the ref
          />
          <DaoList
            daos={filteredDaos}
            onDaoClick={handleDAOClick}
            onToggleFavorite={handleToggleFavorite}
            isToggleFavoritePending={toggleFavoriteMutation.isPending}
            toggleFavoriteDaoId={
              toggleFavoriteMutation.variables as number | null
            }
            isLoading={currentIsLoading && filteredDaos.length === 0}
            activeCategory={activeCategory}
            hasNextPage={currentHasNextPage}
            isFetchingNextPage={currentIsFetchingNextPage}
            onFetchNextPage={currentFetchNextPage}
          />
        </div>
      </div>

      <DaoDetailDialog
        dao={selectedDAO}
        isOpen={Boolean(selectedDAO)}
        onClose={closeDialogs}
        onToggleFavorite={handleToggleFavorite}
        isToggleFavoritePending={toggleFavoriteMutation.isPending}
        toggleFavoriteDaoId={toggleFavoriteMutation.variables as number | null}
        onCampaignClick={handleOpenCampaignDetailsDialog} // For card click
        onNavigateToCampaign={handleNavigateToCampaignPage} // For button click
      />

      <CampaignDetailDialog
        campaign={selectedCampaign}
        isOpen={Boolean(selectedCampaign)}
        onClose={handleCloseCampaignDetailDialog} // Use specific closer
      />
    </PublicWrapper>
  );
};

export default DAOsPage;
