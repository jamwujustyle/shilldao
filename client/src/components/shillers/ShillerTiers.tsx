import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gift } from "lucide-react";
import { ShillerExtended } from "@/types/statsOverview";

interface ShillerTiersProps {
  shillerData: ShillerExtended[];
}

export const ShillerTiers: React.FC<ShillerTiersProps> = ({ shillerData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-amber-700 to-amber-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" /> Bronze Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Requirements: Default tier. Achieved with fewer than 20 approved
            submissions or an approval rate below 60%.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Bronze Badge on Profile
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-sm opacity-80">
              Current Bronze Tier Shillers:{" "}
              {shillerData.filter((s) => s.tier === "Bronze").length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-gray-400 to-gray-300 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" /> Silver Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Requirements: 20+ Approved Submissions & 60%+ Approval Rate.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Silver Badge on Profile
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-sm opacity-80">
              Current Silver Tier Shillers:{" "}
              {shillerData.filter((s) => s.tier === "Silver").length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-yellow-500 to-yellow-300 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" /> Gold Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Requirements: 40+ Approved Submissions & 75%+ Approval Rate.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Gold Badge on Profile
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-sm opacity-80">
              Current Gold Tier Shillers:{" "}
              {shillerData.filter((s) => s.tier === "Gold").length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-600 to-purple-400 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" /> Platinum Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Requirements: 70+ Approved Submissions & 85%+ Approval Rate.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Platinum Badge on Profile
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-sm opacity-80">
              Current Platinum Tier Shillers:{" "}
              {shillerData.filter((s) => s.tier === "Platinum").length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-600 to-blue-400 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" /> Diamond Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Requirements: 100+ Approved Submissions & 90%+ Approval Rate.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Diamond Badge on Profile
            </li>
            <li className="flex items-center">
              <Gift className="mr-2 h-4 w-4" /> Opportunity to apply for
              Moderation privileges
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-sm opacity-80">
              Current Diamond Tier Shillers:{" "}
              {shillerData.filter((s) => s.tier === "Diamond").length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
