import { TaskTypes } from "./task";
export interface DAOTypeSimple {
    name: string; // Changed from daoName to name
    image: string; // Changed from daoImage to image
}
export interface CampaignType  {
    id: number;
    name: string;
    description: string;
    dao: DAOTypeSimple | null;
    progress: number;
    totalTasks?: number; // Make optional
    budget: number;
    status: "Active" | "Planning" | "Completed" | "On Hold";
    createdAt: string; // Change to string to match backend
    isFromFavoriteDao?: boolean; // Make optional
    tasks?: TaskTypes;
}

export interface CampaignOverviewType {
    activeCampaigns: number;
    completedCampaigns: number;
    totalBudget: number;
    totalTasks: number;
}

export interface PaginatedCampaignsType {
    count: number;
    next: string | null;
    previous: string | null;
    results: CampaignType[];
}

export interface CampaignFormValues {
  name: string;
  description: string;
  budget: string;
  status: string;
  dao: string;
}
