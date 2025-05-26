import { SubmissionsOverviewType, PaginatedActivityType } from "@/types/activity";
import { SUBMISSIONS_API_ENDPOINTS } from "@/config/api-endpoints";
import { apiClient } from "./apiClient";

const submissionsService = {
    getSubmissionsHistory: async (params?: { status?: string | null; page?: number }): Promise<PaginatedActivityType | null> => {
        const requestParams: { status?: string | null; page?: number } = {};
        if (params?.status) {
            requestParams.status = params.status;
        }
        if (params?.page) {
            requestParams.page = params.page;
        }
        const response = await apiClient.request(SUBMISSIONS_API_ENDPOINTS.submissionsHistory, {
            method: "GET",
            params: requestParams
        });

        return response as PaginatedActivityType | null;
    },
    getSubmissionsOverview: async (): Promise<SubmissionsOverviewType | null> => {
        const response = await apiClient.request(SUBMISSIONS_API_ENDPOINTS.submissionsOverview, {
            method: "GET"
        })
        return response as SubmissionsOverviewType
    }
}
export default submissionsService
