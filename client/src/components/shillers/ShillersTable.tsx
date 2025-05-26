import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Share2 } from "lucide-react";
import { ShillerExtended } from "@/types/statsOverview";
import { EmptyState } from "@/components/ui/empty-state";
import { getTierColor } from "@/utils/tier";
import ErrorMessage from "@/components/ui/ErrorMessage"; // Import ErrorMessage
import Image from "next/image"; // Import Image component

interface ShillersTableProps {
  shillerData: ShillerExtended[];
  topShillers: ShillerExtended[];
  isLoading: boolean;
  error: Error | null;
  handleShillerSelect: (shiller: ShillerExtended) => void;
}

export const ShillersTable: React.FC<ShillersTableProps> = ({
  shillerData,
  topShillers,
  isLoading,
  error,
  handleShillerSelect,
}) => {
  if (isLoading && (!topShillers || topShillers.length === 0)) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading Shillers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <ErrorMessage message="Error loading shillers" details={errorMessage} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Top Shillers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!topShillers || topShillers.length === 0 ? (
          <EmptyState
            title="No Shiller Data Available"
            message="There are currently no shillers to display."
            icon={
              <div className="text-center">
                <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 inline-block" />
              </div>
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table className="hidden md:table">
              <TableHeader className="hidden md:table-header-group">
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Shiller</TableHead>
                  <TableHead>ETH Address</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Approval %</TableHead>
                  <TableHead className="text-right">Total Rewards</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="hidden md:table-row-group">
                {shillerData
                  .sort((a, b) => (b.totalRewards ?? 0) - (a.totalRewards ?? 0))
                  .map((shiller, index) => (
                    <TableRow
                      key={shiller.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleShillerSelect(shiller)}
                    >
                      <TableCell className="font-medium">
                        {index === 0 ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : (
                          `#${index + 1}`
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                            {shiller.image ? (
                              <Image
                                src={shiller.image}
                                alt="User Avatar"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                  {shiller.username?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-black dark:text-white">
                            {shiller.username || "Unnamed Shiller"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="w-20 inline-block truncate overflow-hidden"
                          title={shiller.ethAddress}
                        >
                          {shiller.ethAddress}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getTierColor(shiller.tier)} text-white`}
                        >
                          {shiller.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {shiller.totalSubmissionsCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {shiller.approvedSubmissionsCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {shiller.approvalRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${shiller.totalRewards?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            !shiller.isActive
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200"
                          }
                        >
                          {shiller.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {shillerData
                .sort((a, b) => (b.totalRewards ?? 0) - (a.totalRewards ?? 0))
                .map((shiller, index) => (
                  <Card
                    key={shiller.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleShillerSelect(shiller)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                            {shiller.image ? (
                              <Image
                                src={shiller.image}
                                alt="User Avatar"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400 text-md font-medium">
                                  {shiller.username?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-black dark:text-white">
                              {shiller.username || "Unnamed Shiller"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rank:{" "}
                              {index === 0 ? (
                                <Trophy className="h-4 w-4 text-yellow-500 inline-block" />
                              ) : (
                                `#${index + 1}`
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${getTierColor(shiller.tier)} text-white`}
                        >
                          {shiller.tier}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          ETH Address:
                        </p>
                        <p className="text-sm break-all">
                          {shiller.ethAddress}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Submissions:
                          </span>{" "}
                          {shiller.totalSubmissionsCount}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Approved:
                          </span>{" "}
                          {shiller.approvedSubmissionsCount}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Approval %:
                          </span>{" "}
                          {shiller.approvalRate.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Rewards:
                          </span>{" "}
                          ${shiller.totalRewards?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            !shiller.isActive
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200"
                          }
                        >
                          {shiller.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
