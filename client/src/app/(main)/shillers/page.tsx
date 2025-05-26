"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicWrapper from "@/components/layout/PublicWrapper";

import { useQuery } from "@tanstack/react-query";
import topShillersService from "@/services/topShillers";
import { ShillerExtended } from "@/types/statsOverview"; // Import Shiller and TopShillers
import ErrorMessage from "@/components/ui/ErrorMessage";

// Import the new components
import { ShillersTable } from "@/components/shillers/ShillersTable";
import { ShillerTiers } from "@/components/shillers/ShillerTiers";
import { ShillerProfileCard } from "@/components/shillers/ShillerProfileCard";

interface RecentActivity {
  description: string;
  date?: string | null;
}

// Renamed component to match file convention
const ShillersPage = () => {
  // Add types to useState hooks
  const [shillerData, setShillerData] = useState<ShillerExtended[]>([]); // Keep shillerData as ShillerExtended[]
  // const [trendData, setTrendData] = useState<TrendData[]>([]); // Trend data removed
  const [selectedShiller, setSelectedShiller] =
    useState<ShillerExtended | null>(null);
  const {
    data: topShillers,
    error,
    isLoading,
  } = useQuery({
    // Explicitly type useQuery data with TopShillers or null
    queryKey: ["topShillers"],
    queryFn: topShillersService.getTopShillers,
  });
  useEffect(() => {
    if (Array.isArray(topShillers)) {
      // Assuming if it's an array, it's either Shiller[] or ShillerExtended[]
      // We'll treat it as ShillerExtended[] for this page's requirements
      setShillerData(topShillers as ShillerExtended[]);
    } else {
      setShillerData([]); // Set to empty array if topShillers is null or undefined
    }
  }, [topShillers]);

  // Add type to parameter
  const handleShillerSelect = (shiller: ShillerExtended) => {
    setSelectedShiller(shiller);
  };

  const generateRecentActivity = (
    shiller: ShillerExtended | null
  ): RecentActivity[] => {
    if (!shiller) return [];
    return [
      { description: `Joined the platform.`, date: shiller.joinedDate },
      { description: `Approved task on`, date: shiller.lastApprovedTaskDate },
    ];
  };

  if (isLoading && shillerData.length === 0) {
    // Simplified loading check using shillerData
    return (
      <PublicWrapper>
        <div className="p-6 flex justify-center items-center min-h-[500px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Shillers...</p>
          </div>
        </div>
      </PublicWrapper>
    );
  }

  // Error handling can be added here if needed, similar to other pages
  if (error && shillerData.length === 0) {
    // Also check shillerData length for error display
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <ErrorMessage message="Error loading shillers" details={errorMessage} />
    );
  }

  const handleTabChange = (value: string) => {
    if (value === "rewards") {
      setSelectedShiller(null);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Shillers Dashboard</h2>
      </div>

      <Tabs
        defaultValue="leaderboard"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid grid-cols-2 md:w-fit">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Tiers</TabsTrigger>
          {/* <TabsTrigger value="campaigns">Campaigns</TabsTrigger> */}
        </TabsList>

        <TabsContent value="leaderboard">
          <ShillersTable
            shillerData={shillerData} // Pass shillerData directly
            topShillers={shillerData} // Pass shillerData to topShillers prop
            isLoading={isLoading}
            error={error}
            handleShillerSelect={handleShillerSelect}
          />
        </TabsContent>

        <TabsContent value="rewards">
          <ShillerTiers shillerData={shillerData} />{" "}
          {/* Pass shillerData directly */}
        </TabsContent>
      </Tabs>
      <ShillerProfileCard
        selectedShiller={selectedShiller}
        onClose={() => setSelectedShiller(null)}
        generateRecentActivity={generateRecentActivity}
      />
    </div> // Close the main component div
  );
};

// TODO: Review and update all helper functions.

export default ShillersPage; // Export the component
