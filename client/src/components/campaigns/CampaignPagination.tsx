"use client";

import { Button } from "../ui/button";

interface CampaignPaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const CampaignPagination = ({
  currentPage,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  isLoading,
}: CampaignPaginationProps) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-4 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage || isLoading}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onPageChange(currentPage + 1);
        }}
        disabled={!hasNextPage || isLoading}
      >
        Next
      </Button>
    </div>
  );
};

export default CampaignPagination;
