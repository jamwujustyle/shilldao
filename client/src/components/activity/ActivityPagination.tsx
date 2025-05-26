import { Button } from "@/components/ui/button";

type ActivityPaginationProps = {
  currentPage: number;
  totalActivityPages: number;
  handleActivityPageChange: (newPage: number) => void;
  hasPreviousActivityPage: boolean;
  hasNextActivityPage: boolean;
  submissionsHLoading: boolean;
};

export const ActivityPagination = ({
  currentPage,
  totalActivityPages,
  handleActivityPageChange,
  hasPreviousActivityPage,
  hasNextActivityPage,
  submissionsHLoading,
}: ActivityPaginationProps) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActivityPageChange(currentPage - 1)}
        disabled={!hasPreviousActivityPage || submissionsHLoading}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {totalActivityPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActivityPageChange(currentPage + 1)}
        disabled={!hasNextActivityPage || submissionsHLoading}
      >
        Next
      </Button>
    </div>
  );
};
