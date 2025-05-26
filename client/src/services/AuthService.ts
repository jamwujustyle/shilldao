import { AUTH_API_ENDPOINTS } from "@/config/api-endpoints";
import { apiClient } from "./apiClient";
import { NonceResponse, VerifyResponse, RefreshResponse } from "@/types/userAuth";



export const authService = {
  getNonce: async (walletAddress: string): Promise<NonceResponse> => {
    const data = await apiClient.request<NonceResponse>(
      AUTH_API_ENDPOINTS.nonce,
      {
        method: "POST",
        body: { eth_address: walletAddress },
        // authRequired removed
      }
    );
    return data;
  },
  verify: async (
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<VerifyResponse> => {
    const data = await apiClient.request<VerifyResponse>(
      AUTH_API_ENDPOINTS.verify,
      {
        method: "POST",
        body: { eth_address: walletAddress, signature, message },
        // authRequired removed
      }
    );
    return data;
  },
  refresh: async (access: string): Promise<RefreshResponse> => {
    // Assuming the refresh endpoint expects 'access' token in camelCase or doesn't care
    const data = await apiClient.request<RefreshResponse>(
      // Note: The refresh call itself might need special handling
      // if it relies on the *old* apiClient structure or if the interceptor
      // logic interferes with it (e.g., trying to refresh using an expired refresh token).
      // The placeholder refreshTokenService in apiClient.ts uses fetch directly to avoid this.
      // If this AuthService.refresh is still used, ensure it works with interceptors.
      // For now, just removing authRequired.
      AUTH_API_ENDPOINTS.refresh,
      {
        method: "POST",
        body: { access }, // Assuming server expects { "access": "..." } for refresh? Check API. Might need { "refresh": "..." }
        // authRequired removed
      }
    );
    return data;
  },
};
