import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "./StatusBadge";
import { SubmissionType, DetailedUserType } from "@/types/grading";

interface SubmissionTableProps {
  submissions: SubmissionType[];
  onSelectSubmission: (submission: SubmissionType) => void;
  isLoading: boolean;
}

const SubmissionTable: React.FC<SubmissionTableProps> = ({
  submissions,
  onSelectSubmission,
  isLoading,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Proof Type</TableHead>
          <TableHead>User</TableHead>
          <TableHead className="hidden md:table-cell">
            Submission Date
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-4 text-center text-sm text-black dark:text-gray-300"
            >
              {isLoading ? "Loading submissions..." : "No submissions found."}
            </TableCell>
          </TableRow>
        ) : (
          submissions.map((submission: SubmissionType) => (
            <TableRow
              key={submission.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <TableCell>
                <StatusBadge status={submission.status} type="status" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <StatusBadge status={submission.proofType} type="proofType" />
                  <span
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-32"
                    title={submission.campaign}
                  >
                    {submission.campaign}
                  </span>
                  <span
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-32"
                    title={submission.description}
                  >
                    {submission.description}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={
                        (submission.user as DetailedUserType).image || undefined
                      }
                      alt={submission.user.username || "User"}
                    />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      {submission.user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {submission.user.username || "N/A"}
                    </div>
                    <StatusBadge status={submission.user.tier} type="tier" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell whitespace-nowrap">
                {new Date(submission.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectSubmission(submission)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default SubmissionTable;
