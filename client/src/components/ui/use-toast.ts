import * as React from "react"

// Toast interface
export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

// Initialize listeners Set
const listeners = new Set<() => void>();
let toasts: Toast[] = [];

// Helper to notify all listeners
const notify = () => {
  listeners.forEach(listener => listener());
};

// Generate unique ID for toasts
const generateId = (() => {
  let count = 0;
  return () => {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return `toast-${count}`;
  };
})();

// Toast store implementation
const toastStoreImpl = {
  get toasts() {
    return [...toasts];
  },

  addToast(toast: Omit<Toast, "id">) {
    const id = generateId();
    const newToast = { ...toast, id };

    // Limit to 5 toasts maximum
    toasts = [newToast, ...toasts].slice(0, 5);
    notify();

    // Auto-dismiss after duration (default: 5000ms)
    if (toast.duration !== Infinity) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }

    return {
      id,
      dismiss: () => this.dismissToast(id),
      update: (props: Partial<Toast>) => this.updateToast(id, props)
    };
  },

  updateToast(id: string, toast: Partial<Toast>) {
    toasts = toasts.map(t =>
      t.id === id ? { ...t, ...toast } : t
    );
    notify();
  },

  dismissToast(id: string) {
    // Mark as dismissed (this could trigger a fade-out animation in the UI)
    toasts = toasts.map(t =>
      t.id === id ? { ...t, dismissed: true } : t
    );
    notify();

    // Remove after animation would complete
    setTimeout(() => {
      this.removeToast(id);
    }, 300);
  },

  removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  },

  dismissAll() {
    toasts.forEach(toast => {
      this.dismissToast(toast.id);
    });
  }
};

// React hook to use the toast system
export function useToast() {
  const [state, setState] = React.useState<Toast[]>(toastStoreImpl.toasts);

  // Subscribe to store updates
  React.useEffect(() => {
    const handleChange = () => {
      setState(toastStoreImpl.toasts);
    };

    // Add listener
    listeners.add(handleChange);

    // Remove listener on cleanup
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  // For backward compatibility - allow direct calling of toast function
  const toast = (props: Omit<Toast, "id">) => {
    return toastStoreImpl.addToast(props);
  };

  // Add methods to the toast function
  toast.show = (props: Omit<Toast, "id">) => {
    return toastStoreImpl.addToast(props);
  };

  toast.update = (id: string, props: Partial<Toast>) => {
    toastStoreImpl.updateToast(id, props);
  };

  toast.dismiss = (id: string) => {
    toastStoreImpl.dismissToast(id);
  };

  toast.dismissAll = () => {
    toastStoreImpl.dismissAll();
  };

  return {
    toast,
    toasts: state
  };
}

// Export the toast store for direct access if needed
export const toastStore = {
  get toasts() {
    return toastStoreImpl.toasts;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
