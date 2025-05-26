"use client";
import { User as DefaultAvatarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyTable } from "@/components/ui/empty-state";
import { getTierColor } from "@/utils/tier";
import React from "react";
import Image from "next/image"; // Import Image component

interface Shiller {
  id: number;
  image: string | null;
  username: string | null;
  approvedSubmissionsCount: number;
  tier: "Diamond" | "Platinum" | "Gold" | "Silver" | "Bronze"; // Use only literal union type for tier
  approvalRate: number;
  growth: number | null;
}

interface TopShillersTableProps {
  shillers: Shiller[] | null | undefined;
  hasData: boolean | undefined; // Allow undefined for hasData
}

const TopShillersTable: React.FC<TopShillersTableProps> = ({
  shillers,
  hasData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shiller Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shiller</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Approval Rate</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shillers ?? []).map((shiller) => (
                <TableRow key={shiller.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                        {shiller.image ? (
                          <Image
                            src={shiller.image}
                            alt="User Avatar"
                            width={32} // Corresponds to w-8 (32px)
                            height={32} // Corresponds to h-8 (32px)
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <DefaultAvatarIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <span className="text-black dark:text-white">
                        {shiller.username || "Unnamed Shiller"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black dark:text-white">
                    {shiller.approvedSubmissionsCount}
                  </TableCell>
                  <TableCell className="text-black dark:text-white">
                    <Badge
                      className={`${getTierColor(shiller.tier)} text-white`}
                    >
                      {shiller.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-black dark:text-white">
                    {shiller.approvalRate.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Progress
                        value={shiller?.growth ?? 0} // Use nullish coalescing for value
                        className="h-2 mr-2"
                      />
                      <span
                        className={
                          (shiller?.growth ?? 0) > 0 // Use nullish coalescing for comparison
                            ? "text-green-500"
                            : "text-gray-500"
                        }
                      >
                        {(shiller?.growth ?? 0) > 0 // Use nullish coalescing for comparison
                          ? `+${shiller?.growth}%`
                          : `${shiller?.growth}%`}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyTable height="200px" />
        )}
      </CardContent>
    </Card>
  );
};

export { TopShillersTable };
