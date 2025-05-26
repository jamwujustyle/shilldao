
import { Shiller } from "@/types/statsOverview"


export const getTierColor = (tier: Shiller["tier"]) => {
  switch (tier) {
    case "Diamond":
      return "bg-blue-500";
    case "Platinum":
      return "bg-purple-500";
    case "Gold":
      return "bg-yellow-500";
    case "Silver":
      return "bg-gray-400";
    case "Bronze":
      return "bg-amber-700";
    default:
      return "bg-gray-300";
  }
};