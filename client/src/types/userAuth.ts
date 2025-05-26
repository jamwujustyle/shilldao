
export interface NonceResponse  {
    nonce: string;
    timestamp: number;
}


export interface VerifyResponse {
    is_success: boolean;
    refresh: string;
    access: string
    role: "User" | "Moderator"
}

export interface RefreshResponse {
    access: string
}

