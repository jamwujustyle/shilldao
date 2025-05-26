import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart } from "lucide-react"; // Renamed Image
import { TaskType } from "@/types/task";
import { CampaignType } from "@/types/campaign";
import { TaskSubmissionForm } from "./TaskSubmissionForm"; // Import the form
import Image from "next/image"; // Import next/image

interface TaskListProps {
  currentTasksList: TaskType[];
  selectedTask: TaskType | null;
  handleTaskSelect: (task: TaskType) => void;
  taskTypeColors: { [key in TaskType["type"]]: string };
  campaignStatusColors: { [key in CampaignType["status"]]: string };
  filterTaskType: string;
  setFilterTaskType: (value: string) => void;
  currentPage: number;
  totalPages: number;
  handlePageChange: (newPage: number) => void;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
  // Props for TaskSubmissionForm
  submissionType: 1 | 2 | 3;
  setSubmissionType: (value: 1 | 2 | 3) => void;
  link: string;
  setLink: (value: string) => void;
  proofText: string;
  setProofText: (value: string) => void;
  setProofImage: (file: File | null) => void;
  previewImage: string | null;
  setPreviewImage: (value: string | null) => void;
  setProofVideo: (file: File | null) => void;
  handleSubmit: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  submissionCardRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskList: React.FC<TaskListProps> = ({
  currentTasksList,
  selectedTask,
  handleTaskSelect,
  taskTypeColors,
  campaignStatusColors,
  filterTaskType,
  setFilterTaskType,
  currentPage,
  totalPages,
  handlePageChange,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  // Destructure submission form props
  submissionType,
  setSubmissionType,
  link,
  setLink,
  proofText,
  setProofText,
  setProofImage,
  previewImage,
  setPreviewImage,
  setProofVideo,
  handleSubmit,
  handleImageChange,
  isSubmitting,
  submissionCardRef,
}) => {
  return (
    <div className="md:col-span-2">
      <div className="flex justify-between items-center mb-6 sm:hidden">
        {" "}
        {/* Hidden on sm and up for page title */}
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="flex gap-3">
          <Select value={filterTaskType} onValueChange={setFilterTaskType}>
            <SelectTrigger className="w-[135px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(taskTypeColors).map((taskType) => (
                <SelectItem key={taskType} value={taskType}>
                  {taskType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>
            Select a task to view details and submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="hidden sm:table-cell">Reward</TableHead>
                <TableHead className="hidden sm:table-cell">Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTasksList.map((task: TaskType) => (
                <TableRow
                  key={task.id}
                  className={`cursor-pointer ${
                    selectedTask?.id === task.id
                      ? "bg-blue-50 dark:bg-blue-900/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => handleTaskSelect(task)}
                >
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <Badge
                        variant="outline"
                        className={`mb-2 ${taskTypeColors[task.type]}`}
                      >
                        {task.type}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.submissionsCount || "0"}/{task.quantity} <br />
                        submissions
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 mr-3">
                        {task.campaign.dao?.image ? (
                          <Image
                            className="h-8 w-8 rounded-full object-cover"
                            src={task.campaign.dao.image}
                            alt={`${task.campaign.dao?.name} logo`}
                            width={32} // Added width
                            height={32} // Added height
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                              {task.campaign.dao?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          {task.campaign.name}
                          {task.isFromFavoriteDao && (
                            <Heart
                              className="inline h-4 w-4 text-red-400 ml-1"
                              fill="currentColor"
                            />
                          )}
                        </div>
                        <div className="text-xs">
                          <Badge
                            variant="outline"
                            className={
                              campaignStatusColors[task.campaign.status]
                            }
                          >
                            {task.campaign.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {task.reward.toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {new Date(task.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="block sm:hidden space-y-4">
        {currentTasksList.map((task: TaskType) => (
          <React.Fragment key={task.id}>
            <Card
              className={`cursor-pointer ${
                selectedTask?.id === task.id
                  ? "border-2 border-blue-500 dark:border-blue-700"
                  : ""
              }`}
              onClick={() => handleTaskSelect(task)}
            >
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <Badge variant="outline" className={taskTypeColors[task.type]}>
                  {task.type}
                </Badge>
                <Badge
                  variant="outline"
                  className={campaignStatusColors[task.campaign.status]}
                >
                  {task.campaign.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 mr-3">
                    {task.campaign.dao?.image ? (
                      <Image
                        className="h-8 w-8 rounded-full object-cover"
                        src={task.campaign.dao.image}
                        alt={`${task.campaign.dao?.name} logo`}
                        width={32} // Added width
                        height={32} // Added height
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {task.campaign.dao?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {task.campaign.name}
                      {task.isFromFavoriteDao && (
                        <Heart
                          className="inline h-4 w-4 text-red-400 ml-1"
                          fill="currentColor"
                        />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.campaign.dao?.name}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {task.submissionsCount} submissions
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskSelect(task);
                    }}
                  >
                    {selectedTask?.id === task.id ? "Close" : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {selectedTask?.id === task.id && (
              <div className="mt-0 border-t-0 rounded-b-lg shadow-md">
                {" "}
                {/* Styling to make it look connected */}
                <TaskSubmissionForm
                  selectedTask={selectedTask} // Already confirmed it's the selected one
                  submissionType={submissionType}
                  setSubmissionType={setSubmissionType}
                  link={link}
                  setLink={setLink}
                  proofText={proofText}
                  setProofText={setProofText}
                  setProofImage={setProofImage}
                  previewImage={previewImage}
                  setPreviewImage={setPreviewImage}
                  setProofVideo={setProofVideo}
                  handleSubmit={handleSubmit}
                  handleImageChange={handleImageChange}
                  isSubmitting={isSubmitting}
                  submissionCardRef={submissionCardRef} // This ref is now for the inline form
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPreviousPage || isLoading}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
