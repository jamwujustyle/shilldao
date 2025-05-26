import { Badge } from "@/components/ui/badge";
import { SubmissionStatus } from "@/types/activity";
import { CheckCircle, Clock, HelpCircle, XCircle } from "lucide-react";

type StatusBadgeProps = {
  status: SubmissionStatus | string;
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  let color = "bg-gray-500";
  let icon = <HelpCircle className="h-3 w-3 mr-1" />;

  if (status === SubmissionStatus.Approved) {
    color = "bg-green-500";
    icon = <CheckCircle className="h-3 w-3 mr-1" />;
  } else if (status === SubmissionStatus.Pending) {
    color = "bg-yellow-500";
    icon = <Clock className="h-3 w-3 mr-1" />;
  } else if (status === SubmissionStatus.Rejected) {
    color = "bg-red-500";
    icon = <XCircle className="h-3 w-3 mr-1" />;
  }

  return (
    <Badge className={`${color} text-white flex items-center px-2 py-1`}>
      {icon}
      {status}
    </Badge>
  );
};
