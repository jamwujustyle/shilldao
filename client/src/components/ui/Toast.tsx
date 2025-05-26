import React, { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning";
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          background: "bg-green-50 dark:bg-green-900/30",
          border: "border-green-200 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          text: "text-green-800 dark:text-green-200",
        };
      case "error":
        return {
          background: "bg-red-50 dark:bg-red-900/30",
          border: "border-red-200 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          text: "text-red-800 dark:text-red-200",
        };
      case "warning":
        return {
          background: "bg-yellow-50 dark:bg-yellow-900/30",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: "text-yellow-600 dark:text-yellow-400",
          text: "text-yellow-800 dark:text-yellow-200",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        absolute top-4 right-4 z-50
        ${styles.background}
        ${styles.border}
        border
        rounded-lg
        shadow-lg
        p-4
        pr-10
        flex
        items-center
        max-w-sm
        w-full
        transition-all
        duration-300
        animate-slide-in
      `}
    >
      <CheckCircle size={24} className={`mr-3 ${styles.icon}`} />
      <span className={`text-sm font-medium ${styles.text}`}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className={`
          absolute
          top-1/2
          right-2
          -translate-y-1/2
          hover:bg-gray-100
          dark:hover:bg-gray-700
          rounded-full
          p-1
          transition-colors
          ${styles.text}
        `}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Hook for managing toast state
export const useToast = () => {
  const [toast, setToast] = useState<React.ReactNode | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
    duration = 3000
  ) => {
    setToast(
      <Toast
        message={message}
        type={type}
        duration={duration}
        onClose={() => setToast(null)}
      />
    );
  };

  const ToastContainer = () => toast;

  return { showToast, ToastContainer };
};
