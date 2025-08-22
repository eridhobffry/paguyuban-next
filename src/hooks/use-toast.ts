import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    variant: "default" | "destructive";
  }>({
    open: false,
    message: "",
    variant: "default",
  });

  const showToast = useCallback((options: ToastOptions) => {
    const { title, description, variant = "default" } = options;

    if (variant === "destructive") {
      toast.error(title, {
        description: description,
      });
    } else {
      toast.success(title, {
        description: description,
      });
    }

    setState({
      open: true,
      message: title,
      variant,
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
      setState((prev) => ({ ...prev, open: false }));
    }, 3000);
  }, []);

  return {
    toast: showToast,
    ...state,
  };
}
