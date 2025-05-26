export interface UserType {
    id: number;
    username: string | null;
    tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond"
}

export interface DetailedUserType extends UserType {
    approved: number;
    rejected: number;
    ethAddress: string;
    image: string | null;
}

export interface SubmissionType {
    id: number;
    status: string;
    user: UserType | DetailedUserType;
    link: string;
    proofText?: string | null;
    proofImage?: string | null;
    proofVideo?: string | null;
    proofType: string;
    feedback: string | null;
    createdAt: string;
    campaign: string;
    description: string;
    daoName?: string;

}
export type SubmissionsType = SubmissionType[];

export interface PaginatedSubmissionsType {
    count: number;
    next: string | null;
    previous: string | null;
    results: SubmissionsType;
    pendingSubmissions?: number | null;
    approvedSubmissions?: number | null;
    rejectedSubmissions?: number | null;
}

export interface SubmissionRequestType {
    id: number;
    status: number;
    feedback: string | null;
}
