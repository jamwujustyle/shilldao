// Corrected and combined imports
import { apiClient } from "./apiClient";
import api from "./apiClient"; // Import the configured Axios instance directly
import { UpdateUsernameType, UpdateUserImageType, UserType, UserRewardsType} from "@/types/user";
import { USER_API_ENDPOINTS } from "@/config/api-endpoints";



const userService = {
  getUser: async (): Promise<UserType | null> => {
    const data = await apiClient.request<UserType>(USER_API_ENDPOINTS.me, {
      method: "GET",
    });
    return data || null;
  },
  updateUsername: async (newUsername: string): Promise<void> => {
    await apiClient.request<UpdateUsernameType>(USER_API_ENDPOINTS.usernameUpdate, {
      method: "PATCH",
      body: { username: newUsername },
    });
  },
  updateUserImage: async (formData: FormData): Promise<void> => {
    await api.patch<UpdateUserImageType>(USER_API_ENDPOINTS.userImageUpdate, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  removeUserImage: async (): Promise<void> => {
    await apiClient.request(USER_API_ENDPOINTS.userImageRemove, {
      method: "DELETE",
    });
  },

  toggleFavoriteDAO: async (daoId: number): Promise<{ status: string; detail: string }> => {
    const response = await apiClient.request(USER_API_ENDPOINTS.toggleFavoriteDAO(daoId), {
      method: "POST",
      // No body is needed for a toggle if the backend handles it based on current state
    });
    return response as { status: string; detail: string };
  },
  getUserRewards: async (): Promise<UserRewardsType[]> => {
    try {
      const response = await apiClient.request<{
        results: Array<{
          id: number;
          rewardAmount: string; // Explicitly string here as it comes from API
          isPaid: boolean;
          createdAt: string;
          submission: number;
        }>;
        totalAmount: number;
      }>(USER_API_ENDPOINTS.getUserRewards, {
        method: "GET",
      });

      const { results, totalAmount } = response;

      if (Array.isArray(results) && results.length > 0) {
        const mappedRewards: UserRewardsType[] = results.map((reward) => ({
          id: reward.id,
          rewardAmount: parseFloat(reward.rewardAmount), // Convert to number
          isPaid: reward.isPaid,
          createdAt: reward.createdAt,
          submission: reward.submission,
        }));

        // Add totalAmount to the first element of the array as per user's instruction
        if (mappedRewards.length > 0) {
          mappedRewards[0].totalAmount = totalAmount;
        }

        return mappedRewards;
      }

      return []; // Return empty array instead of null
    } catch (error) {
      console.error("Error fetching user rewards:", error);
      return []; // Return empty array on error
    }
  }
};


export default userService
