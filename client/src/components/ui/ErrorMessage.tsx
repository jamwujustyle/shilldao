"use client";

import React from "react";
import PublicWrapper from "@/components/layout/PublicWrapper";
import { AlertTriangle } from "lucide-react"; // Using an error icon

interface ErrorMessageProps {
  message: string;
  details?: string;
  minHeight?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  minHeight = "min-h-[500px]",
}) => {
  return (
    <PublicWrapper>
      <div
        className={`p-6 flex flex-col justify-center items-center text-center ${minHeight}`}
      >
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-500 mb-2">{message}</h2>
        {details && <p className="text-sm text-red-400">{details}</p>}
      </div>
    </PublicWrapper>
  );
};

export default ErrorMessage;
