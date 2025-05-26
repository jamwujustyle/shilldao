// "use client";

// import React from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { DollarSign, Zap, Users, TrendingUp } from "lucide-react"; // Example icons

// interface PerformanceMetricProps {
//   title: string;
//   value: string | number;
//   icon: React.ReactNode;
//   description?: string;
//   progressValue?: number; // Optional progress bar
// }

// const PerformanceMetricCard: React.FC<PerformanceMetricProps> = ({
//   title,
//   value,
//   icon,
//   description,
//   progressValue,
// }) => (
//   <Card>
//     <CardHeader className="pb-2">
//       <div className="flex items-center justify-between">
//         <CardTitle className="text-base font-semibold">{title}</CardTitle>
//         <div className="text-primary">{icon}</div>
//       </div>
//     </CardHeader>
//     <CardContent>
//       <div className="text-3xl font-bold text-primary mb-1">{value}</div>
//       {description && (
//         <p className="text-xs text-muted-foreground mb-2">{description}</p>
//       )}
//       {progressValue !== undefined && (
//         <Progress value={progressValue} className="h-2 mt-1" />
//       )}
//     </CardContent>
//   </Card>
// );

// interface ManagementPerformanceProps {
//   // Define props based on what performance metrics you want to show
//   // These are examples, adjust based on available data for DAOs/Campaigns
//   totalCampaignBudget: number;
//   averageCampaignDuration: number; // in days
//   overallTaskCompletionRate: number; // percentage
//   topPerformingDao?: { name: string; metric: string | number }; // Example
// }

// export const ManagementPerformance: React.FC<ManagementPerformanceProps> = ({
//   totalCampaignBudget,
//   averageCampaignDuration,
//   overallTaskCompletionRate,
//   topPerformingDao,
// }) => {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Management Performance Overview</CardTitle>
//         <CardDescription>
//           Key metrics for your DAOs and Campaigns.
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//         <PerformanceMetricCard
//           title="Total Campaign Budgets"
//           value={`$${totalCampaignBudget.toLocaleString()}`} // Assuming budget is in a currency
//           icon={<DollarSign className="h-6 w-6" />}
//           description="Combined budget of all active and planned campaigns."
//         />
//         <PerformanceMetricCard
//           title="Avg. Campaign Duration"
//           value={`${averageCampaignDuration} days`}
//           icon={<Zap className="h-6 w-6" />}
//           description="Average expected or actual duration of campaigns."
//         />
//         <PerformanceMetricCard
//           title="Task Completion Rate"
//           value={`${overallTaskCompletionRate}%`}
//           icon={<TrendingUp className="h-6 w-6" />}
//           description="Overall percentage of tasks completed across campaigns."
//           progressValue={overallTaskCompletionRate}
//         />
//         {/* Add more cards as needed, e.g., top performing DAO */}
//         {topPerformingDao && (
//           <PerformanceMetricCard
//             title="Top Performing DAO"
//             value={topPerformingDao.name}
//             icon={<Users className="h-6 w-6" />}
//             description={`Metric: ${topPerformingDao.metric}`}
//           />
//         )}
//       </CardContent>
//     </Card>
//   );
// };
