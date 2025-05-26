import React from "react";
import { Shield, AlertCircle, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UnauthorizedAccessProps {
  title?: string;
  description?: string;
  showApplyButton?: boolean;
  variant?: "moderator" | "authentication"; // New prop
}

const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  title = "Access Denied", // Generic default title
  description = "You do not have permission to view this page.", // Generic default description
  showApplyButton = true, // Retain for moderator variant
  variant = "moderator", // Default to moderator variant for existing uses
}) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
          <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      {variant === "moderator" && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                  What are Moderators?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Moderators are trusted community members who review
                  submissions, ensure quality content, and help maintain the
                  integrity of our platform. They have the ability to approve or
                  reject submissions based on quality, relevance, and adherence
                  to community guidelines.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-500" />
                  Moderator Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Review community submissions promptly and fairly</li>
                  <li>Provide constructive feedback to submitters</li>
                  <li>Ensure content meets quality standards</li>
                  <li>Help maintain a positive community environment</li>
                  <li>Collaborate with other moderators and team members</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {showApplyButton && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Interested in becoming a Moderator?</CardTitle>
                <CardDescription>
                  We&apos;re always looking for dedicated community members to
                  join our moderation team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  To become a moderator, you&apos;ll need to have an active
                  history in our community, demonstrate good judgment, and be
                  willing to dedicate time to reviewing submissions. Moderators
                  receive special recognition and rewards for their
                  contributions. &quot;Diamond Tier Shillers&quot; are
                  especially encouraged to apply and may have an expedited
                  review process. To apply for Moderator create DIP at{" "}
                  <a
                    href="https://dao.cafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    dao.cafe
                  </a>
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button className="w-full sm:w-auto">
                  <a
                    href="https://dao.cafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    Apply for Moderator <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default UnauthorizedAccess;
