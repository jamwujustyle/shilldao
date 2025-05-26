import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignType } from "@/types/campaign"; // Assuming CampaignType is correctly exported from here now

interface CampaignDetailDialogProps {
  campaign: CampaignType | null;
  isOpen: boolean;
  onClose: () => void;
}

const CampaignDetailDialog: React.FC<CampaignDetailDialogProps> = ({
  campaign,
  isOpen,
  onClose,
}) => {
  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{campaign.name}</span>
            <Badge
              className={`${
                campaign.status === "Active"
                  ? "bg-green-500"
                  : campaign.status === "Planning"
                  ? "bg-blue-500"
                  : campaign.status === "On Hold"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              } text-white border-none`}
            >
              {campaign.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Budget
            </h3>
            <div className="text-3xl font-bold flex items-center">
              {campaign.budget.toLocaleString()}{" "}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <h3 className="font-medium">Progress</h3>
              <span>{campaign.progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`rounded-full h-3 ${
                  campaign.progress >= 75
                    ? "bg-green-500"
                    : campaign.progress >= 50
                    ? "bg-blue-500"
                    : campaign.progress >= 25
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${campaign.progress}%` }}
              />
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Description
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {campaign.description ||
                "No detailed description available for this campaign."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Timeline
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-4 flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="h-full w-px bg-border"></div>
                    </div>
                    <div>
                      <p className="font-medium">Campaign Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Add more timeline events here if available */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailDialog;
