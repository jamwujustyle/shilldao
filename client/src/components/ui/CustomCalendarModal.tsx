"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface CustomCalendarModalProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  triggerText?: string;
  disabled?: (date: Date) => boolean; // Kept for flexibility, though minDate is preferred for this case
  minDate?: Date;
  label?: string;
  error?: boolean;
}

export const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  selectedDate,
  onDateChange,
  triggerText = "Pick a date",
  disabled,
  minDate,
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (date: Date | null) => {
    onDateChange(date ?? undefined);
    setIsOpen(false); // Close modal on date selection
  };

  const CustomInput = React.forwardRef<
    HTMLButtonElement,
    { value?: string; onClick?: () => void }
  >(({ value, onClick }, ref) => (
    <Button
      variant="outline"
      className={`w-full pl-3 text-left font-normal ${
        !value && "text-muted-foreground"
      } ${error ? "border-red-500" : ""}`}
      onClick={onClick}
      ref={ref}
    >
      {value ? value : <span>{triggerText}</span>}
      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
    </Button>
  ));
  CustomInput.displayName = "CustomInput";

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        customInput={
          <CustomInput
            value={selectedDate ? format(selectedDate, "PPP") : ""}
          />
        }
        filterDate={disabled}
        minDate={minDate}
        popperPlacement="bottom-start"
        onClickOutside={() => setIsOpen(false)}
        open={isOpen}
        onInputClick={() => setIsOpen(true)}
        // We can add a portal if it needs to break out of parent overflow contexts
        // portalId="react-datepicker-portal"
      />
      {/* Basic modal structure if needed, for now DatePicker's inline + popper is simpler */}
      {/* {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              filterDate={disabled}
              inline
            />
            <Button onClick={() => setIsOpen(false)} className="mt-2 w-full">Close</Button>
          </div>
        </div>
      )} */}
    </div>
  );
};
