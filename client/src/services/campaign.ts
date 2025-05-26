import { apiClient } from "./apiClient";
import { CampaignType, PaginatedCampaignsType, CampaignOverviewType } from "@/types/campaign"; // Import PaginatedCampaignsType and CampaignOverviewType
import { CAMPAIGN_API_ENDPOINTS } from "@/config/api-endpoints";

interface GetCampaignsParams {
  page?: number;
  status?: number; // Add optional status parameter
}

const campaignService = {
  getCampaignStats: async (params?: GetCampaignsParams): Promise<PaginatedCampaignsType> => {
    // apiClient.request already handles camelCase conversion
    const response = await apiClient.request<PaginatedCampaignsType>( // Expect PaginatedCampaignsType
      CAMPAIGN_API_ENDPOINTS.campaign,
      {
        method: "GET",
        params: { page: params?.page, status: params?.status }, // Pass page and status parameters
        // authRequired removed as interceptor handles auth
      }
    );
    // The backend should return the paginated structure.
    // If response is null/undefined, provide a default paginated structure.
    return response || { count: 0, next: null, previous: null, results: [] };
  },
  getMyCampaigns: async (params?: GetCampaignsParams): Promise<CampaignType[]> => { // Changed return type
  const response = await apiClient.request<CampaignType[]>(CAMPAIGN_API_ENDPOINTS.myCampaigns, { // Expect CampaignType[]
    method: "GET",
    params: {page: params?.page},
  })
  return response || []; // Return response or empty array
},

  createCampaign: async (campaignData: {
    name: string;
    description: string;
    budget: number;
    status: string;
    dao: number;
  }): Promise<CampaignType> => {
    const response = await apiClient.request<CampaignType>(
      CAMPAIGN_API_ENDPOINTS.createCampaign,
      {
        method: "POST",
        body: campaignData,
      }
    );
    return response as CampaignType;
  },

  createCampaignVerified: async (campaignData: {
    name: string;
    description: string;
    budget: number;
    status: string;
    dao: number;
    transaction_hash: string;
  }): Promise<CampaignType> => {
    const response = await apiClient.request<CampaignType>(
      CAMPAIGN_API_ENDPOINTS.createCampaignVerified,
      {
        method: "POST",
        body: campaignData,
      }
    );
    return response as CampaignType;
  },

  getCampaignOverview: async (): Promise<CampaignOverviewType> => {
    const response = await apiClient.request<CampaignOverviewType>(
      CAMPAIGN_API_ENDPOINTS.campaignOverview,
      {
        method: "GET",
      }
    );
    return response as CampaignOverviewType;
  },
};

export default campaignService;
