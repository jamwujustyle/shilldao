import { topShillersExtended } from "@/config/api-endpoints";
import { apiClient } from "./apiClient";
import { TopShillers } from "@/types/statsOverview";


const topShillersService = {
    getTopShillers: async (): Promise<TopShillers | null> => {
        const response = await apiClient.request(topShillersExtended, {
            method: "GET"
        })
        return response as TopShillers
    }
}

export default topShillersService
