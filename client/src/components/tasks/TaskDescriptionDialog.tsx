import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TaskDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export const TaskDescriptionDialog: React.FC<TaskDescriptionDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DialogDescription asChild className="max-h-[60vh] overflow-y-auto">
            <p className="w-full whitespace-pre-wrap break-all">
              {description}
            </p>
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
