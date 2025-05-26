export enum SubmissionStatus {
    Pending = "Pending",
    Approved = "Approved",
    Rejected = "Rejected"
}

export enum ProofType {
    Text = "Text",
    Image = "Image",
    Video = "Video"
}

export interface TaskLiteType { // Added TaskLiteType
    id: number;
    description: string;
    reward: string; // DecimalField from Django is usually string in JS/TS
    type: string; // get_type_display returns string
}

type Multiplier = 1 | 2 | 3 | 4 | 5;

export interface SubmissionsOverviewType {
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    // Detailed counts per proof type
    textSubmissions: {
        total: number;
        approved: number;
    };
    imageSubmissions: {
        total: number;
        approved: number;
    };
    videoSubmissions: {
        total: number;
        approved: number;
    };
}

export interface SubmissionType {
    id: number;
    status: SubmissionStatus;
    proofType: ProofType;
    link: string;
    proofText: string | null;
    proofImage: string | null;
    proofVideo: string | null;
    multiplier: Multiplier | null;
    createdAt: string;
    updatedAt: string; // Added
    feedback: string | null; // Added
    task: TaskLiteType; // Changed to TaskLiteType
}

export type SubmissionsType = SubmissionType[];

export interface PaginatedActivityType {
    count: number;
    next: string | null;
    previous: string | null;
    results: SubmissionsType;
}
