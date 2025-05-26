"use client";

export const taskStatusColors: { [key: string]: string } = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface TaskStatusBadgeProps {
  status: string;
}

const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => {
  const colorClass =
    taskStatusColors[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default TaskStatusBadge;
