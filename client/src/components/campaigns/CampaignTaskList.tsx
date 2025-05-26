"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskType } from "@/types/task";
import { taskService } from "@/services/task";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TaskStatusBadge from "./TaskStatusBadge";
interface CampaignTasksListProps {
  campaignId: string | number;
  campaignName: string;
}

const CampaignTasksList = ({
  campaignId,
  campaignName,
}: CampaignTasksListProps) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const taskData = await taskService.getTasksByCampaign(campaignId);
        setTasks(taskData || []);
      } catch (err) {
        setError("Failed to load tasks");
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading tasks...
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No tasks found for this campaign.
      </div>
    );
  }
  return (
    <div className="p-4">
      <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
        Tasks for {campaignName}
      </h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-gray-600 dark:text-gray-400">
              Task Type
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-400">
              Reward
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-400">
              Submissions
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-400">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task: TaskType) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => router.push(`/tasks?taskId=${task.id}`)}
            >
              <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                {task.type}
              </TableCell>
              <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                {task.reward}
              </TableCell>
              <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                {task.submissionsCount}/{task.quantity}
              </TableCell>
              <TableCell className="text-sm">
                <TaskStatusBadge status={String(task.status)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignTasksList;
