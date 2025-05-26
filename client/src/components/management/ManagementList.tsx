"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Added
import { DaoType } from "@/types/dao";
import { CampaignType } from "@/types/campaign";
import { TaskType } from "@/types/task"; // Added
import {
  Edit,
  PlusCircle,
  Globe,
  Calendar,
  FileText as FileTextIcon, // Renamed to avoid conflict if FileText is used as component
  MessageCircle,
  Video as VideoIcon,
  Share2,
  BookOpen,
  PenTool,
  CheckCircle,
  Plus,
} from "lucide-react";
import Image from "next/image"; // Import Image component

// Define a union type for items, or use a generic if structures are very different
type ManagementItem = DaoType | CampaignType; // Adjust based on actual types

interface ManagementListProps {
  items: ManagementItem[];
  itemType: "DAOs" | "Campaigns"; // To differentiate rendering if needed
  onEditItem: (item: ManagementItem) => void;
  onAddItem?: (parentId?: number) => void; // e.g. Add campaign to DAO, or add task to campaign
  isLoading: boolean;
}

const ManagementListItemCard: React.FC<{
  item: ManagementItem;
  itemType: "DAOs" | "Campaigns";
  onEditItem: (item: ManagementItem) => void;
  onAddItem?: (parentId?: number) => void;
  // Props for helper functions that will be passed from ManagementPage
  getCampaignStatusColor: (status: string | number) => string;
  getCampaignStatusName: (status: string | number) => string;
  getTaskTypeIcon: (type: string | number) => React.ReactNode;
}> = ({
  item,
  itemType,
  onEditItem,
  onAddItem,
  getCampaignStatusColor,
  getCampaignStatusName,
  getTaskTypeIcon,
}) => {
  if (itemType === "DAOs") {
    // Type guard for DaoType
    const dao = item as DaoType;
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="aspect-video w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 relative">
          {dao.image ? (
            <Image
              src={dao.image}
              alt={dao.name}
              fill // Use fill for responsive images within a container
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-semibold text-blue-200 dark:text-blue-800">
                {dao.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{dao.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {dao.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center text-sm text-muted-foreground gap-4">
            <div className="flex items-center" title="Campaigns">
              <PlusCircle size={14} className="mr-1" />
              <span>
                {dao.campaigns?.length || 0} campaign
                {dao.campaigns?.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className="flex items-center"
              title={dao.website ? dao.website : "No website"}
            >
              <Globe size={14} className="mr-1" />
              <span className="truncate max-w-[150px]">
                {dao.website ? new URL(dao.website).hostname : "No website"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardContent className="pt-2 flex justify-between items-center">
          {onAddItem && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onAddItem(dao.id)}
            >
              <PlusCircle size={12} className="mr-1" />
              Add Campaign
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onEditItem(dao)}
          >
            <Edit size={12} className="mr-1" />
            Edit DAO
          </Button>
        </CardContent>
      </Card>
    );
  } else if (itemType === "Campaigns" && "budget" in item) {
    // Type guard for CampaignType
    const campaign = item as CampaignType;
    const tasks = (campaign.tasks as TaskType[]) || []; // Ensure tasks is an array

    return (
      <Card key={campaign.id} className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {campaign.dao?.image && (
                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                  {" "}
                  {/* Add a container for the image */}
                  <Image
                    src={campaign.dao.image}
                    alt={`${campaign.dao?.name} logo`}
                    fill // Use fill for responsive images within a container
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {campaign.name}
                  <Badge
                    className={`${getCampaignStatusColor(
                      campaign.status
                    )} text-xs text-white border-none`}
                  >
                    {getCampaignStatusName(campaign.status)}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  {campaign.dao?.name || "Unknown DAO"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {campaign.description || "No description provided."}
          </p>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span>{campaign.progress || 0}% Complete</span>
              <span className="text-muted-foreground">
                {tasks.filter((task: TaskType) => task.status === 2).length ||
                  0}{" "}
                / {tasks.length || 0} tasks
              </span>
            </div>
            <Progress value={campaign.progress || 0} className="h-1.5" />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-normal">
              <Calendar size={12} className="mr-1.5" />
              Created: {new Date(campaign.createdAt).toLocaleDateString()}
            </Badge>
            <Badge variant="outline" className="font-normal">
              Remaining Budget: {campaign.budget.toLocaleString()}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-xs font-medium text-muted-foreground">
                TASKS
              </h4>
              {onAddItem && (
                <Button
                  variant="ghost"
                  size="sm" // Changed "xs" to "sm"
                  className="text-xs h-7" // Keep custom height/text if needed
                  onClick={() => onAddItem(campaign.id)}
                >
                  <Plus size={12} className="mr-1" /> Add Task
                </Button>
              )}
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 text-xs">
                {tasks.map((task: TaskType) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-muted/40 dark:bg-muted/20 rounded-md p-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="text-muted-foreground">
                        {getTaskTypeIcon(task.type)}
                      </div>
                      <span className="line-clamp-1 break-all max-w-[100px] sm:max-w-[120px]">
                        {task.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="secondary"
                        className="font-normal text-xs whitespace-nowrap"
                      >
                        {task.reward}
                      </Badge>
                      {task.status === 2 ? ( // Assuming 2 means completed
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <div
                          className="h-2.5 w-2.5 rounded-full bg-yellow-500"
                          title="Pending/Active"
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No tasks yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  return null; // Should not happen if itemType and item match
};

// Helper functions (can be moved to a utils file or passed as props from parent)
// These are simplified versions based on original ManagementPage.tsx
const getCampaignStatusColor = (status: string | number): string => {
  // ... (implementation from original ManagementPage.tsx or simplified)
  // Example:
  const numericStatus =
    typeof status === "string" ? parseInt(status, 10) : status;
  if (isNaN(numericStatus)) {
    // Handle named statuses from CampaignType
    switch (status) {
      case "Active":
        return "bg-green-500 hover:bg-green-600";
      case "Planning":
        return "bg-blue-500 hover:bg-blue-600";
      case "Completed":
        return "bg-purple-500 hover:bg-purple-600";
      case "On Hold":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  }
  switch (numericStatus) {
    case 1:
      return "bg-green-500 hover:bg-green-600"; // Active
    case 2:
      return "bg-blue-500 hover:bg-blue-600"; // Planning
    case 3:
      return "bg-purple-500 hover:bg-purple-600"; // Completed
    case 4:
      return "bg-yellow-500 hover:bg-yellow-600"; // On Hold
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

const getCampaignStatusName = (status: string | number): string => {
  // ... (implementation from original ManagementPage.tsx or simplified)
  // Example:
  if (
    typeof status === "string" &&
    ["Active", "Planning", "Completed", "On Hold"].includes(status)
  ) {
    return status;
  }
  const numericStatus =
    typeof status === "string" ? parseInt(status, 10) : status;
  switch (numericStatus) {
    case 1:
      return "Active";
    case 2:
      return "Planning";
    case 3:
      return "Completed";
    case 4:
      return "On Hold";
    default:
      return "Unknown";
  }
};

const getTaskTypeIcon = (type: string | number): React.ReactNode => {
  // ... (implementation from original ManagementPage.tsx or simplified)
  // Example:
  const numericType = typeof type === "string" ? parseInt(type, 10) : type;
  switch (numericType) {
    case 1:
      return <MessageCircle size={14} />;
    case 2:
      return <VideoIcon size={14} />;
    case 3:
      return <FileTextIcon size={14} />;
    case 4:
      return <Share2 size={14} />;
    case 5:
      return <BookOpen size={14} />;
    default:
      return <PenTool size={14} />;
  }
};

export const ManagementList: React.FC<ManagementListProps> = ({
  items,
  itemType,
  onEditItem,
  onAddItem,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-1"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            No {itemType === "DAOs" ? "DAOs" : "Campaigns"} found.
          </p>
          {onAddItem && (
            <Button onClick={() => onAddItem()} className="mt-4">
              <PlusCircle size={16} className="mr-2" /> Create New{" "}
              {itemType === "DAOs" ? "DAO" : "Campaign"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ManagementListItemCard
          key={item.id}
          item={item}
          itemType={itemType}
          onEditItem={onEditItem}
          onAddItem={onAddItem}
          // Pass helper functions
          getCampaignStatusColor={getCampaignStatusColor}
          getCampaignStatusName={getCampaignStatusName}
          getTaskTypeIcon={getTaskTypeIcon}
        />
      ))}
    </div>
  );
};
