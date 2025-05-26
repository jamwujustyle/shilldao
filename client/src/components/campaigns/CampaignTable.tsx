"use client";

import { CampaignType } from "@/types/campaign";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import CampaignTableRow from "./CampaignTableRow";
import CampaignMobileCard from "./CampaignMobileCard";

interface CampaignTableProps {
  campaigns: CampaignType[];
  expandedCampaignId: string | number | null;
  onCampaignRowClick: (id: string | number) => void;
  highlightedCampaignId?: string | number | null;
}

const CampaignTable = ({
  campaigns,
  expandedCampaignId,
  onCampaignRowClick,
  highlightedCampaignId,
}: CampaignTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Details</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign: CampaignType) => (
                <CampaignTableRow
                  key={campaign.id}
                  campaign={campaign}
                  isExpanded={expandedCampaignId === campaign.id}
                  onRowClick={onCampaignRowClick}
                  highlightedCampaignId={highlightedCampaignId}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4 p-4">
          {campaigns.map((campaign: CampaignType) => (
            <CampaignMobileCard
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedCampaignId === campaign.id}
              onCardClick={onCampaignRowClick}
              isHighlighted={highlightedCampaignId === campaign.id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTable;
