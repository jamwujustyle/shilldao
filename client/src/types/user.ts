export interface UserType {
    username: string;
    image: string | null
}

export interface UpdateUsernameType {
    username: string
}
export interface UpdateUserImageType {
    image: File
}


export interface UserRewardsType {
    id: number;
    rewardAmount: number;
    isPaid: boolean;
    createdAt: string;
    submission: number;
    totalAmount?: number; // Added totalAmount in camelCase
}
