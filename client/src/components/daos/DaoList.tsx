import React from "react";
import { DaoType } from "@/types/dao";
import DaoCard from "./DaoCard";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface DaoListProps {
  daos: DaoType[];
  onDaoClick: (dao: DaoType) => void;
  onToggleFavorite: (e: React.MouseEvent, daoId: number) => void;
  isToggleFavoritePending: boolean;
  toggleFavoriteDaoId: number | null;
  isLoading: boolean; // For initial load or when filters change and data is being fetched
  activeCategory: string; // To control "Load More" visibility
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

const DaoList: React.FC<DaoListProps> = ({
  daos,
  onDaoClick,
  onToggleFavorite,
  isToggleFavoritePending,
  toggleFavoriteDaoId,
  isLoading,
  activeCategory,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}) => {
  if (isLoading && daos.length === 0) {
    // This handles the case where we are loading and have no DAOs yet (e.g., initial load or filter change)
    // A more specific loading state for the list itself might be preferred over a page-level one.
    // For now, we assume the parent component handles the main loading spinner.
    // If daos are empty but not loading, the "No DAOs Found" message will show.
  }

  if (daos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full p-6 bg-muted">
          <Users size={36} className="text-muted-foreground" />
        </div>
        <h3 className="mt-6 text-xl font-medium">No DAOs Found</h3>
        <p className="mt-2 text-muted-foreground max-w-md">
          We couldn&apos;t find any DAOs matching your search or for the
          selected category.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daos.map((dao) => (
          <DaoCard
            key={dao.id}
            dao={dao}
            onDaoClick={onDaoClick}
            onToggleFavorite={onToggleFavorite}
            isToggleFavoritePending={isToggleFavoritePending}
            toggleFavoriteDaoId={toggleFavoriteDaoId}
          />
        ))}
      </div>
      {activeCategory !== "favorites" && hasNextPage && daos.length > 0 && (
        <div className="mt-8 text-center">
          <Button
            onClick={onFetchNextPage}
            variant="outline"
            size="lg"
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
};

export default DaoList;
