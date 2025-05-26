import { CampaignType } from "./campaign";

type CampaignWithoutBudjet = Omit<CampaignType, "budget">
export interface TaskType {
    id: number;
    type: "Discussion" | "Video" | "Publication" | "Social Post" | "Tutorial"
    reward: number;
    quantity: number;
    deadline: number;
    campaign: CampaignWithoutBudjet ;
    submissionsCount: number;
    status: number;
    createdAt: number; // Assuming this is provided by the backend
    isFromFavoriteDao: boolean;
    description: string;
}



export interface SubmissionType {
    taskId: number;
    link: string;
    proofType: number;
    proofText?: string | null;
    proofImage?: File | null;
    proofVideo?: File | null;
}


export type TaskTypes = TaskType[];



export interface PaginatedTasksType {
  count: number;
  next: string | null;
  previous: string | null;
  results: TaskType[];
  completedTasksCount?: number;
  averageReward?: number;
  totalRewards: number ;
}

export interface TaskFormValues {
  description: string;
  type: string;
  reward: string;
  quantity: string;
  deadline: string;
  campaign: string;
}
