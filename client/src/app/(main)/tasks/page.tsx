"use client";
import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import PublicWrapper from "@/components/layout/PublicWrapper";
import { useSearchParams } from "next/navigation";
import { CampaignType } from "@/types/campaign";
import { SubmissionType, TaskType, PaginatedTasksType } from "@/types/task";
import { TaskStatsCards } from "@/components/tasks/TaskStatsCards";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskSubmissionForm } from "@/components/tasks/TaskSubmissionForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Keep if filter is here
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task";
import PageLoader from "@/components/ui/PageLoader";
import { AxiosError } from "axios";
import ErrorMessage from "@/components/ui/ErrorMessage"; // Import ErrorMessage
import { EmptyState } from "@/components/ui/empty-state"; // Import EmptyState
import { useToast } from "@/components/ui/Toast"; // Import useToast
import { Share2 } from "lucide-react"; // Import Share2
const taskTypeColors: { [key in TaskType["type"]]: string } = {
  Discussion:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Publication: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Social Post":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Tutorial:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

// Mapping from task type string to integer value
const taskTypeMapping: { [key: string]: number | "all" } = {
  all: "all",
  Discussion: 1,
  Video: 2,
  Publication: 3,
  "Social Post": 4,
  Tutorial: 5,
};

const campaignStatusColors: { [key in CampaignType["status"]]: string } = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  "On Hold":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const TasksPageContent = () => {
  const searchParams = useSearchParams();
  const taskIdFromQuery = searchParams.get("taskId");
  const submissionCardRef = useRef<HTMLDivElement>(null);

  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  // submissionType, link, proofText, proofImage, previewImage, proofVideo states will be managed here
  // as they are used by TaskSubmissionForm and the submitTask mutation
  const [submissionType, setSubmissionType] = useState<1 | 2 | 3>(1);
  const [link, setLink] = useState("");
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [proofVideo, setProofVideo] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTaskType, setFilterTaskType] = useState<string>("all");
  const queryClient = useQueryClient();
  const { showToast, ToastContainer } = useToast();

  const {
    data: paginatedTaskData,
    isLoading,
    error,
  } = useQuery<PaginatedTasksType | null, Error>({
    queryKey: ["tasks", currentPage, filterTaskType], // Add filterTaskType to queryKey
    queryFn: () =>
      taskService.getTaskList({ page: currentPage, type: filterTaskType }), // Pass filterTaskType to service
  });

  const tasksList: TaskType[] = useMemo(
    () => paginatedTaskData?.results || [],
    [paginatedTaskData]
  );

  console.log("task list: ", tasksList);

  useEffect(() => {
    if (taskIdFromQuery && tasksList.length > 0) {
      const taskToSelect = tasksList.find(
        (task) => String(task.id) === taskIdFromQuery
      );
      if (taskToSelect) {
        setSelectedTask(taskToSelect);
        // Scroll to submission card after a short delay to ensure it's rendered
        setTimeout(() => {
          submissionCardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [taskIdFromQuery, tasksList]);

  // Remove frontend filtering logic - it's now handled by the backend
  // const currentTasksList: TaskType[] = useMemo(() => {
  //   if (filterTaskType === "all") {
  //     return rawTasksList;
  //   }
  //   return rawTasksList.filter((task) => task.type === filterTaskType);
  // }, [rawTasksList, filterTaskType]);

  const completedTasksCount = useMemo(
    () => paginatedTaskData?.completedTasksCount || 0,
    [paginatedTaskData]
  );
  const totalAvailableTasksCount = useMemo(
    () => paginatedTaskData?.count || 0,
    [paginatedTaskData]
  );
  const totalPages = useMemo(
    () => Math.ceil(totalAvailableTasksCount / 10),
    [totalAvailableTasksCount]
  );
  const hasNextPage = useMemo(
    () => !!paginatedTaskData?.next,
    [paginatedTaskData]
  );
  const hasPreviousPage = useMemo(
    () => !!paginatedTaskData?.previous,
    [paginatedTaskData]
  );
  const averageReward = useMemo(
    () => paginatedTaskData?.averageReward || 0,
    [paginatedTaskData]
  );

  interface ErrorResponseData {
    nonFieldErrors?: string[];
  }

  const submitTask = useMutation({
    mutationFn: (data: SubmissionType) => taskService.submitTask(data),
    onSuccess: () => {
      showToast("Task submitted successfully!", "success"); // Show success toast
      queryClient.invalidateQueries({
        queryKey: ["tasks", currentPage, filterTaskType],
      });
      setSelectedTask(null);
      setLink("");
      setProofText("");
      setProofImage(null);
      setPreviewImage(null); // Reset preview image state
      setProofVideo(null);
    },
    onError: (err: AxiosError<ErrorResponseData>) => {
      const errorMessage =
        err.response?.data?.nonFieldErrors?.[0] ||
        "Error submitting task: An unexpected error occurred.";
      showToast(errorMessage, "error"); // Show error toast with specific message
      console.log("error: ", err);
    },
  });

  if (isLoading && tasksList.length === 0) {
    return (
      <PublicWrapper>
        <div className="p-6 flex justify-center items-center min-h-[500px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Tasks...</p>
          </div>
        </div>
      </PublicWrapper>
    );
  }

  if (error && tasksList.length === 0) {
    return (
      <ErrorMessage message="Error loading tasks" details={error.message} />
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTaskSelect = (task: TaskType) => {
    if (selectedTask && selectedTask.id === task.id) {
      // If the clicked task is already selected, deselect it (close the form)
      setSelectedTask(null);
    } else {
      // Otherwise, select the new task
      setSelectedTask(task);
    }
  };

  const handleSubmit = () => {
    if (!selectedTask) {
      console.warn("No task selected");
      return;
    }
    const payload: SubmissionType = {
      taskId: selectedTask.id,
      link,
      proofType: submissionType,
      proofText: proofText || null,
      proofImage: proofImage || null,
      proofVideo: proofVideo || null,
    };
    submitTask.mutate(payload);
  };

  // Handle image file selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file); // Set the actual file state

      // Create preview for UI
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofImage(null); // Clear file state if no file selected
      setPreviewImage(null); // Clear preview as well
    }
  };

  return (
    <div className="p-6 text-black dark:text-gray-200 relative">
      {" "}
      {/* Added relative positioning */}
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>

        <div className="flex gap-3">
          <Select value={filterTaskType} onValueChange={setFilterTaskType}>
            <SelectTrigger className="w-[150px] hidden sm:flex">
              {" "}
              {/* Hidden on mobile, shown on sm+ */}
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(taskTypeMapping).map(([name, value]) => {
                if (name === "all") return null; // Skip "all" here as it's added separately
                const typedValue = value as number | "all"; // Explicitly cast value
                return (
                  <SelectItem key={name} value={typedValue.toString()}>
                    {" "}
                    {/* Use integer value as string */}
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TaskStatsCards
        totalAvailableTasksCount={totalAvailableTasksCount}
        totalRewards={paginatedTaskData?.totalRewards || 0}
        completedTasksCount={completedTasksCount || 0}
        averageReward={averageReward || 0}
      />
      {tasksList.length === 0 && !isLoading && !error ? (
        <EmptyState
          title="No Tasks Found"
          message="There are currently no tasks to display."
          icon={
            <div className="text-center">
              <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 inline-block" />
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskList
            currentTasksList={tasksList} // Use tasksList instead of currentTasksList
            selectedTask={selectedTask}
            handleTaskSelect={handleTaskSelect}
            taskTypeColors={taskTypeColors}
            campaignStatusColors={campaignStatusColors}
            filterTaskType={filterTaskType}
            setFilterTaskType={setFilterTaskType}
            currentPage={currentPage}
            totalPages={totalPages}
            handlePageChange={handlePageChange}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            // Add submission form props back, ensuring correct names
            submissionType={submissionType}
            setSubmissionType={setSubmissionType}
            link={link}
            setLink={setLink}
            proofText={proofText}
            setProofText={setProofText}
            // proofImage={proofImage} // This was the mistake if passed before; TaskListProps expects setProofImage
            setProofImage={setProofImage} // Correct prop for TaskListProps
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
            // proofVideo={proofVideo} // proofVideo state is not expected by TaskListProps
            setProofVideo={setProofVideo} // Correct prop for TaskListProps
            handleSubmit={handleSubmit}
            handleImageChange={handleImageChange}
            isSubmitting={submitTask.isPending}
            submissionCardRef={submissionCardRef}
          />
          {/* TaskSubmissionForm for desktop view, hidden on mobile */}
          <div className="hidden md:block">
            <TaskSubmissionForm
              selectedTask={selectedTask}
              submissionType={submissionType}
              setSubmissionType={setSubmissionType}
              link={link}
              setLink={setLink}
              proofText={proofText}
              setProofText={setProofText}
              // proofImage={proofImage} // Remove incorrect prop
              setProofImage={setProofImage} // Keep correct prop
              previewImage={previewImage}
              setPreviewImage={setPreviewImage}
              // proofVideo={proofVideo} // Remove incorrect prop
              setProofVideo={setProofVideo} // Keep correct prop
              handleSubmit={handleSubmit}
              handleImageChange={handleImageChange}
              isSubmitting={submitTask.isPending}
              submissionCardRef={submissionCardRef}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TasksPage = () => {
  return (
    <Suspense fallback={<PageLoader text="Loading Tasks..." />}>
      <TasksPageContent />
    </Suspense>
  );
};

export default TasksPage;
