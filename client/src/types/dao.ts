import { CampaignType } from "./campaign";

export type SocialLinks = {
    twitter?: string;
    discord?: string;
    telegram?: string;
    [key: string ]: string | undefined;
}

export interface DaoType {
    id: number;
    name: string;
    image?: string;
    description?: string; // Added description field
    website?: string;
    socialLinks?: SocialLinks;
    createDao?: boolean;
    network?: number; // Added network field
    createdBy?: number; // Added createdBy field (assuming it's the user ID)
    balance?: string; // Added balance field (using string to handle large decimal values)
    campaigns: CampaignType[];
    createdAt: string;
    isFavorited?: boolean; // Added for favorite status
    }

export type DaosType = DaoType[]

export interface PaginatedDaosType {
    count: number;
    next: string | null;
    previous: string | null;
    results: DaosType
}


export interface DaoRegisterType {
    name: string;
    image?: File  | null;
    description?: string;
    website?: string;
    createDao?: boolean;
    network: number;
    socialLinks?: Record <string, string | undefined>;
}

// Type for updating a DAO, allowing image to be null to remove it
export interface DaoUpdateType extends  Partial<DaoRegisterType>  {
  image?: File | null;
}


export interface DaoFormValues {
  name: string;
  description: string;
  createDao?: boolean;
  website?: string;
  // image: File | null; // Will be handled by separate state
  network: string;
  socialLinks?: SocialLinks;
}
