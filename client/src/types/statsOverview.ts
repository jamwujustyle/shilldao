export interface StatsOverview {
    totalCampaigns: number
    totalTasks: number
    activeShillers : number
    shillPriceUsd?: number;
}

export interface Shiller {
    id: number;
    username: string | null;
    image: string | null;
    tier: "Diamond" | "Platinum" | "Gold" | "Silver" | "Bronze";
    approvalRate: number;
    approvedSubmissionsCount: number;
    growth: number;
}
export interface ShillerExtended extends Shiller {
    ethAddress: string;
    totalSubmissionsCount: number;
    joinedDate: string;
    isActive: boolean;
    role: "User" | "Moderator";
    totalRewards: number | null;
    // progress: string | null; // This was the original placeholder
    growth: number; // Matches backend serializer field
    lastApprovedTaskDate?: string | null
}

export type TopShillers = Shiller[] | ShillerExtended[];


export interface CampaignsGraphType {
    name: string;
    tasks: number;
    submissions: number;
}
export type CampaignsGraphTypes = CampaignsGraphType[];

export interface RewardGraphType {
    rewards: number;
    month: string;
}
export type RewardGraphTypes = RewardGraphType[];

export interface RewardsChartDataType {
    name: string;
    rewards: number;
}

export interface TierGraphType {
    name: string;
    value: number;
}
export type TierGraphTypes = TierGraphType[];
