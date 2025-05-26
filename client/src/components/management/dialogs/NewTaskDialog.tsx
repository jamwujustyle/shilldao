"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskType } from "@/types/task";
import { CampaignType } from "@/types/campaign";
import { taskService } from "@/services/task";
import { AxiosError } from "axios";
import { MessageCircle, Video, FileText, Share2, BookOpen } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { CustomCalendarModal } from "@/components/ui/CustomCalendarModal";

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedCampaign: CampaignType | null;
}

export const NewTaskDialog: React.FC<NewTaskDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedCampaign,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const taskFormSchema = z.object({
    description: z.string().min(1, "Task Description is required"),
    type: z.string().min(1, "Task Type is required"),
    reward: z.coerce
      .number()
      .positive({ message: "Reward must be a positive number" }),
    quantity: z.coerce
      .number()
      .int()
      .positive({ message: "Quantity must be a positive whole number" }),
    deadline: z.date().optional(), // Changed to accept Date object
    campaign: z.string().min(1),
  });

  type TaskZodFormValues = z.infer<typeof taskFormSchema>;

  const taskForm = useForm<TaskZodFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: "",
      type: "1",
      reward: 0,
      quantity: 1,
      deadline: undefined, // Changed to undefined
      campaign: selectedCampaign?.id.toString() || "",
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (selectedCampaign && isOpen) {
      taskForm.reset({
        description: "",
        type: "1",
        reward: 0,
        quantity: 1,
        deadline: undefined,
        campaign: selectedCampaign.id.toString(),
      });
      setApiError(null);
    }
  }, [selectedCampaign, isOpen, taskForm]);

  const createTaskMutation = useMutation<
    TaskType,
    AxiosError,
    {
      description: string;
      type: number;
      reward: number;
      quantity: number;
      deadline?: string;
      campaign: number;
    }
  >({
    mutationFn: (taskData) =>
      taskService.createTask(taskData) as Promise<TaskType>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCampaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["campaignDetails", selectedCampaign?.id],
      });
      onOpenChange(false);
      setApiError(null);
      toast({ title: "Success", description: "Task created successfully." });
    },
    onError: (error: AxiosError<unknown>) => {
      const errorData = error.response?.data;
      let errorMessage = error.message;

      if (errorData && typeof errorData === "object") {
        if (
          "non_field_errors" in errorData &&
          Array.isArray(errorData.non_field_errors)
        ) {
          errorMessage = errorData.non_field_errors.join(", ");
        } else {
          const messages = Object.entries(errorData)
            .map(([key, value]) => {
              const messageValue = Array.isArray(value)
                ? value.join(", ")
                : value;
              if (key === "nonFieldErrors") {
                return messageValue;
              }
              return `${key}: ${messageValue}`;
            })
            .join("; ");
          if (messages) errorMessage = messages;
        }
      }
      setApiError(errorMessage);
    },
  });

  const onSubmitTask: SubmitHandler<TaskZodFormValues> = (data) => {
    if (!selectedCampaign) {
      toast({
        title: "Error",
        description: "No campaign selected (this should not happen).",
        variant: "destructive",
      });
      return;
    }

    // Convert date to YYYY-MM-DD string for backend
    const deadlineString = data.deadline
      ? format(data.deadline, "yyyy-MM-dd")
      : undefined;

    createTaskMutation.mutate({
      description: data.description,
      type: parseInt(data.type, 10),
      reward: data.reward,
      quantity: data.quantity,
      deadline: deadlineString,
      campaign: parseInt(data.campaign, 10),
    });
  };

  const taskTypes = [
    { id: "1", name: "Discussion", icon: <MessageCircle size={18} /> },
    { id: "2", name: "Video", icon: <Video size={18} /> },
    { id: "3", name: "Publication", icon: <FileText size={18} /> },
    { id: "4", name: "Social Post", icon: <Share2 size={18} /> },
    { id: "5", name: "Tutorial", icon: <BookOpen size={18} /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to the &quot;{selectedCampaign?.name}&quot; campaign.
          </DialogDescription>
        </DialogHeader>
        {apiError && (
          <Toast
            message={apiError}
            type="error"
            duration={5000}
            onClose={() => setApiError(null)}
          />
        )}
        {selectedCampaign && (
          <Form {...taskForm}>
            <form
              onSubmit={taskForm.handleSubmit(onSubmitTask)}
              className="space-y-6 py-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        {!taskForm.formState.errors.description && (
                          <FormLabel>Task Description</FormLabel>
                        )}
                        <FormControl>
                          <Textarea
                            placeholder="Describe what needs to be done"
                            className={`min-h-32 ${
                              taskForm.formState.errors.description
                                ? "border-red-500"
                                : ""
                            }`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={taskForm.control}
                      name="reward"
                      render={({ field }) => (
                        <FormItem>
                          {!taskForm.formState.errors.reward && (
                            <FormLabel>Reward Amount</FormLabel>
                          )}
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Token amount per completion"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={
                                field.value === 0 &&
                                taskForm.formState.isSubmitted === false
                                  ? ""
                                  : String(field.value)
                              }
                              className={
                                taskForm.formState.errors.reward
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          {!taskForm.formState.errors.quantity && (
                            <FormLabel>Quantity</FormLabel>
                          )}
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Number of tasks"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={
                                field.value === 0 &&
                                taskForm.formState.isSubmitted === false
                                  ? ""
                                  : String(field.value)
                              }
                              className={
                                taskForm.formState.errors.quantity
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            How many times this task can be completed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <CustomCalendarModal
                            label="Deadline"
                            selectedDate={field.value}
                            onDateChange={field.onChange}
                            minDate={new Date()} // Today and future dates
                            error={!!taskForm.formState.errors.deadline}
                          />
                          {field.value && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                field.onChange(undefined);
                              }}
                              className="w-full text-xs text-muted-foreground p-0 h-auto mt-1 justify-start"
                            >
                              Clear date
                            </Button>
                          )}
                          <FormDescription>
                            Optional completion deadline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <FormField
                    control={taskForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        {!taskForm.formState.errors.type && (
                          <FormLabel>Task Type</FormLabel>
                        )}
                        <div className="pt-2">
                          {taskTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`flex items-center p-3 mb-2 rounded-md cursor-pointer border transition-colors ${
                                field.value === type.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                  : `border-gray-200 hover:border-blue-200 dark:border-gray-800 ${
                                      taskForm.formState.errors.type
                                        ? "border-red-500"
                                        : ""
                                    }`
                              }`}
                              onClick={() => field.onChange(type.id)}
                            >
                              <div
                                className={`p-2 rounded-full mr-3 ${
                                  field.value === type.id
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {type.icon}
                              </div>
                              <span>{type.name}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
