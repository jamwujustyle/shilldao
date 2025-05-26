import { Coins, Gift, CheckCircle, XCircle } from "lucide-react";
import { UserRewardsType } from "@/types/user"; // Import UserRewardsType

// Define the main component props
interface UserRewardsComponentProps {
  rewards: UserRewardsType[]; // Use UserRewardsType
}

export const UserRewards = ({ rewards }: UserRewardsComponentProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if reward data exists and is not empty
  if (!rewards || rewards.length === 0) {
    return (
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="py-10 flex flex-col items-center justify-center border rounded-lg">
          <Gift className="h-12 w-12 text-gray-400 mb-3" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            No rewards yet
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Complete submissions and challenges to earn rewards and see them
            here.
          </p>
        </div>
      </div>
    );
  }

  const paidCount = rewards.filter((reward) => reward.isPaid).length;
  // Use totalAmount from the backend, which is attached to the first reward object
  const totalAmount =
    rewards.length > 0 && rewards[0].totalAmount !== undefined
      ? rewards[0].totalAmount
      : 0;

  return (
    <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {rewards.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Rewards
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {paidCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Paid</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center">
            <Coins className="h-6 w-6 mr-1" />
            {totalAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Amount
          </div>
        </div>
      </div>

      {/* Reward Details Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {rewards.map((reward) => (
              <tr
                key={reward.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {reward.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(reward.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  Submission ID: {reward.submission}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {reward.isPaid ? (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4 mr-1" /> Unpaid
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {reward.rewardAmount ? (
                    <span className="inline-flex items-center justify-end text-gray-900 dark:text-gray-100">
                      <Coins className="h-4 w-4 mr-1" />{" "}
                      {reward.rewardAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      No reward
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
