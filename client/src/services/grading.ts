import { apiClient } from "./apiClient";
import { GRADING_API_ENDPOINTS } from "@/config/api-endpoints";
import { PaginatedSubmissionsType, SubmissionType, SubmissionRequestType } from "@/types/grading";

const gradingService = {
    getSubmissionsForModerator: async (params?: { status?: string; proof_type?: string; page?: number }): Promise<PaginatedSubmissionsType | null> => {
        const response = await apiClient.request(GRADING_API_ENDPOINTS.submissionsHistoryModeration, {
            method: "GET",
            params: params || {}
        });

        return response as PaginatedSubmissionsType | null;
    },
    gradeSubmission: async (id: number, data: SubmissionRequestType | null = null): Promise<SubmissionType | SubmissionRequestType | null> => {
        const method: "PATCH" | "GET" = data ? "PATCH" : "GET";
        const response = await apiClient.request(GRADING_API_ENDPOINTS.gradeSubmission(id), {
            method,
            body: data
        });

        if (!response) return null;

        if (method === "GET") {
            return response as SubmissionType;
        } else {
            return response as SubmissionRequestType;
        }
    }
};
export default gradingService;
