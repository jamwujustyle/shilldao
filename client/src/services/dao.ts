import { DAO_API_ENDPOINTS } from "@/config/api-endpoints";
import { apiClient } from "./apiClient";
import { PaginatedDaosType, DaoType, DaoRegisterType } from "@/types/dao"; // Added DaoType


interface GetDAOsParams {
  pageParam?: number;
  searchTerm?: string;
  ordering?: string;
}

const daoService = {
  getDAOs: async ({ pageParam = 1, searchTerm, ordering }: GetDAOsParams = {}): Promise<PaginatedDaosType> => {
    let endpoint = `${DAO_API_ENDPOINTS.daoList}?page=${pageParam}`;
    if (searchTerm) {
      endpoint += `&search=${encodeURIComponent(searchTerm)}`;
    }
    if (ordering) {
      endpoint += `&ordering=${ordering}`;
    }
    const response = await apiClient.request(endpoint, {
      method: "GET",
    });
    return response as PaginatedDaosType;
  },

  getFavoriteDAOs: async ({ searchTerm }: { searchTerm?: string } = {}): Promise<DaoType[]> => {
    let endpoint = DAO_API_ENDPOINTS.favoriteDaoList;
    if (searchTerm) {
      endpoint += `?search=${encodeURIComponent(searchTerm)}`;
    }
    const response = await apiClient.request(endpoint, {
      method: "GET",
    });
    return response as DaoType[];
  },

  getMostActiveDAOs: async ({ pageParam = 1, searchTerm }: GetDAOsParams = {}): Promise<PaginatedDaosType> => {
    let endpoint = `${DAO_API_ENDPOINTS.mostActiveDaoList}?page=${pageParam}`;
    if (searchTerm) {
      endpoint += `&search=${encodeURIComponent(searchTerm)}`;
    }
    const response = await apiClient.request(endpoint, {
      method: "GET",
    });
    return response as PaginatedDaosType;
  },
  registerDao: async (data: DaoRegisterType): Promise<DaoType> => {
    const camelToSnakeCase = (str: string) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof DaoRegisterType];
      let snakeKey: string;

      if (key === "createDao") {
        snakeKey = "create_dao";
      } else if (key === "socialLinks") {
        snakeKey = "social_links";
        if (value && Object.keys(value).length > 0) {
          formData.append(snakeKey, JSON.stringify(value));
        }
        return; // socialLinks handled, skip generic append
      } else {
        snakeKey = camelToSnakeCase(key);
      }

      if (value instanceof File) {
        formData.append(snakeKey, value, value.name);
      } else if (value !== null && value !== undefined) {
        // This will stringify numbers, booleans, etc.
        // Ensure backend can handle stringified numbers for fields like 'network' if not already a string.
        // For DaoRegisterType, 'network' is already number, String(data.network) was used before.
        // Here, it will become String(value) which is fine.
        formData.append(snakeKey, String(value));
      }
      // If value is null or undefined, it's skipped, which is the desired behavior.
    });

    const requestBody = formData;

    const apiClientConfig = {
      method: "POST" as const, // Use 'as const' for literal type
      body: requestBody,
      // Headers are intentionally omitted here to let apiClient.request handle it
    };

    const response = await apiClient.request(DAO_API_ENDPOINTS.registerDao, apiClientConfig);
    return response as DaoType;
  },
  getMyDaos: async (): Promise<DaoType[]> => {
    const response = await apiClient.request(DAO_API_ENDPOINTS.myDaos, {
      method: "GET",
    })
    return response as DaoType[]
  },

  updateDao: async (id: number, data: Partial<DaoRegisterType>): Promise<DaoType> => {
    const camelToSnakeCase = (str: string) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      let snakeKey: string;

      if (key === "createDao") {
        snakeKey = "create_dao";
      } else if (key === "socialLinks") {
        snakeKey = "social_links";
        if (value && typeof value === 'object' && Object.keys(value).length > 0) {
          formData.append(snakeKey, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
           // Handle case where socialLinks might be explicitly set to null or empty object
           formData.append(snakeKey, JSON.stringify(value));
        }
        return; // socialLinks handled, skip generic append
      } else {
        snakeKey = camelToSnakeCase(key);
      }

      if (value instanceof File) {
        formData.append(snakeKey, value, value.name);
      } else if (value !== null && value !== undefined) {
        formData.append(snakeKey, String(value));
      }
    });

    const requestBody = formData;

    const apiClientConfig = {
      method: "PATCH" as const, // Use 'as const' for literal type
      body: requestBody,
    };

    const response = await apiClient.request(DAO_API_ENDPOINTS.editDao(id), apiClientConfig);
    return response as DaoType;
  },

  deleteDao: async (id: number): Promise<void> => {
    const apiClientConfig = {
      method: "DELETE" as const,
    };
    await apiClient.request(DAO_API_ENDPOINTS.deleteDao(id), apiClientConfig);
    // No response body expected for a successful DELETE (204 No Content)
  }
};

export default daoService;
