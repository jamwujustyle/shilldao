import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { ShillerExtended } from "@/types/statsOverview";
import Image from "next/image"; // Import Image component

interface RecentActivity {
  description: string;
  date?: string | null;
}

interface ShillerProfileCardProps {
  selectedShiller: ShillerExtended | null;
  onClose: () => void;
  generateRecentActivity: (shiller: ShillerExtended | null) => RecentActivity[];
}

export const ShillerProfileCard: React.FC<ShillerProfileCardProps> = ({
  selectedShiller,
  onClose,
  generateRecentActivity,
}) => {
  if (!selectedShiller) {
    return null; // Don't render if no shiller is selected
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0 mr-2">
            {selectedShiller.image ? (
              <Image
                src={selectedShiller.image}
                alt="User Avatar"
                width={32} // Corresponds to w-8 h-8 (32px)
                height={32} // Corresponds to w-8 h-8 (32px)
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {selectedShiller.username?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>
          {selectedShiller.username} - Profile
        </CardTitle>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Shiller Details</h3>
            <p>
              <span className="font-medium">Name:</span>{" "}
              {selectedShiller.username}
            </p>
            <p>
              <span className="font-medium">ETH Address:</span>{" "}
              <span className="break-all">{selectedShiller.ethAddress}</span>
            </p>
            <p>
              <span className="font-medium">Joined:</span>{" "}
              {selectedShiller.joinedDate}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              {selectedShiller?.isActive ? "Active" : "Inactive"}
            </p>
            <p>
              <span className="font-medium">Role:</span> {selectedShiller.role}
            </p>
            <p>
              <span className="font-medium">Tier:</span> {selectedShiller.tier}
            </p>
            <p>
              <span className="font-medium">Total Submissions:</span>{" "}
              {selectedShiller.totalSubmissionsCount}
            </p>
            <p>
              <span className="font-medium">Approved Submissions:</span>{" "}
              {selectedShiller.approvedSubmissionsCount}
            </p>
            <p>
              <span className="font-medium">Approval Rate:</span>{" "}
              {selectedShiller.approvalRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Next Tier Progress</h3>
            <div className="mb-4">
              {selectedShiller.tier === "Diamond" &&
              selectedShiller.growth >= 100 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Trophy className="h-10 w-10 text-blue-500 mb-2" />
                  <p className="font-semibold text-lg">
                    Diamond Tier Achieved!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum tier reached.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-1">Progress to next tier</p>
                  <Progress value={selectedShiller.growth} className="h-2" />
                  <p className="text-xs mt-1">
                    {selectedShiller.growth}% towards next tier.
                  </p>
                </>
              )}
            </div>
            <h3 className="font-semibold mb-2 mt-4">Earnings</h3>
            <div>
              <p>
                <span className="font-medium">Total Earned:</span> $SHILLS{" "}
                {selectedShiller.totalRewards?.toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Activity</h3>{" "}
            {/* This can stay if generic activity is fetched */}
            <div className="space-y-3">
              {generateRecentActivity(selectedShiller).map(
                (activity: RecentActivity, index: number) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
