import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubmissionFiltersProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
}

const SubmissionFilters: React.FC<SubmissionFiltersProps> = ({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
}) => {
  return (
    <div className="flex gap-3">
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Approved">Approved</SelectItem>
          <SelectItem value="Rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[125px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Text">Text</SelectItem>
          <SelectItem value="Image">Image</SelectItem>
          <SelectItem value="Video">Video</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SubmissionFilters;
