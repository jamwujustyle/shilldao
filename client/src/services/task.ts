import { apiClient } from "./apiClient";
import { TASK_API_EDNPOINTS } from "@/config/api-endpoints";
import { PaginatedTasksType, SubmissionType, TaskType } from "@/types/task";


const taskService = {
  getTaskList: async (params?: { page?: number; type?: string }): Promise<PaginatedTasksType | null> => {
    const apiParams: { page?: number; type?: string } = {};
    if (params?.page) {
      apiParams.page = params.page;
    }
    if (params?.type && params.type !== "all") {
      apiParams.type = params.type;
    }

    const response = await apiClient.request(TASK_API_EDNPOINTS.listTasks, {
      method: "GET",
      params: apiParams,
    });

    return response as PaginatedTasksType | null;
  },

  getTasksByCampaign: async (campaignId: string | number): Promise<TaskType[] | null> => {
    const response = await apiClient.request(TASK_API_EDNPOINTS.tasksByCampaign(campaignId), {
      method: "GET",
    });
    return response as TaskType[] | null;
  },

  submitTask: async (data: SubmissionType): Promise<void> => {
        const camelToSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

        let requestBody: FormData | Record<string, unknown>;

        const hasFile = data.proofImage instanceof File || data.proofVideo instanceof File;

        if (hasFile) {
            const formData = new FormData();

            Object.keys(data).forEach(key => {
                let snakeKey: string;
                if (key === 'taskId') {
                    snakeKey = 'task';
                } else if (key === 'proofType') {
                    snakeKey = 'proof_type';
                } else {
                    snakeKey = camelToSnakeCase(key);
                }

                const value = data[key as keyof SubmissionType]; // Still need 'any' here for accessing properties by string key

                if (value instanceof File) {

                    formData.append(snakeKey, value, value.name);
                } else if (value !== null && value !== undefined) {
                    formData.append(snakeKey, String(value));
                }
            });
            requestBody = formData;
        } else {
            // --- Handle JSON Submission ---
            const snakeCaseData: Record<string, unknown> = {};
            Object.keys(data).forEach(key => {
                 // Apply same key mapping as above
                 let snakeKey: string;
                 if (key === 'taskId') {
                     snakeKey = 'task';
                 } else if (key === 'proofType') {
                     snakeKey = 'proof_type';
                 } else {
                     snakeKey = camelToSnakeCase(key);
                 }

                const value = data[key as keyof typeof data]; // Use indexed access with keyof
                if (value !== null && value !== undefined) {
                    snakeCaseData[snakeKey] = value;
                }
            });
            requestBody = snakeCaseData;
        }


         await apiClient.request(TASK_API_EDNPOINTS.submitTask, {
            method: "POST",
            body: requestBody,
            // Let apiClient.request handle headers for FormData
         });
    },

    createTask: async (taskData: {
      description: string;
      type: number;
      reward: number;
      quantity: number;
      deadline?: string;
      campaign: number;
    }): Promise<TaskType> => {
      const response = await apiClient.request<TaskType>(
        TASK_API_EDNPOINTS.createTask,
        {
          method: "POST",
          body: taskData,
        }
      );
      return response as TaskType;
    },
};

export { taskService };
