import { apiClient } from "./apiClient";
import { StatsOverview, TopShillers, RewardGraphTypes, CampaignsGraphTypes, TierGraphTypes } from "@/types/statsOverview";
import { DASHBOARD_API_ENDPOINTS } from "@/config/api-endpoints";

const statsService = {
  getStats: async (timeframe: string = "all"): Promise<StatsOverview> => {
    // apiClient.request already handles camelCase conversion
    const data = await apiClient.request<StatsOverview>(
      `${DASHBOARD_API_ENDPOINTS.statsOverview}?timeframe=${timeframe}`, // Use the corrected key
      {
        method: "GET",
      }
    );
    return data;
  },
  getTopShillers: async (): Promise<TopShillers> => {
    const data = await apiClient.request<TopShillers>(DASHBOARD_API_ENDPOINTS.topShillers, {
      method: "GET"
    })
    return data
  },
  campaignsGraph: async (): Promise<CampaignsGraphTypes> => {
    const data = await apiClient.request<CampaignsGraphTypes>(DASHBOARD_API_ENDPOINTS.campaignsGraph, {
      method: "GET"
    })
    return data
  },
  rewardsGraph: async (): Promise<RewardGraphTypes | null> => {
    const data = await apiClient.request(DASHBOARD_API_ENDPOINTS.rewardsGraph, {
      method: "GET"
    })
    return data as RewardGraphTypes
  },
  tierGraph: async (): Promise<TierGraphTypes | null> => {
    const data = await apiClient.request(DASHBOARD_API_ENDPOINTS.tierGraph, {
      method: "GET"
    })
    return data as TierGraphTypes
  }
};

export default statsService;
