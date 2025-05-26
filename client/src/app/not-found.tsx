// app/not-found.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home, Search, AlertTriangle, Compass } from "lucide-react";

const NotFoundPage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    // Replace with your actual home route
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Main 404 Card */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* 404 Number Display */}
            <div className="relative mb-8">
              <div className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                404
              </div>
              <div className="absolute -top-2 -right-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8 space-y-3">
              <h1 className="text-2xl md:text-3xl font-semibold text-white">
                Page Not Found
              </h1>
              <p className="text-lg text-slate-400 max-w-md mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been
                moved to another location.
              </p>
            </div>

            {/* Statistics Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center mb-2">
                  <Compass className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm text-slate-400">Lost DAOs</div>
                <div className="text-xl font-semibold text-white">0</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center mb-2">
                  <Search className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-sm text-slate-400">Search Results</div>
                <div className="text-xl font-semibold text-white">0</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-sm text-slate-400">Error Code</div>
                <div className="text-xl font-semibold text-white">404</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoHome}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-sm text-slate-500 mb-4">
                Need help finding what you&apos;re looking for?
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a
                  href="/dashboard"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/management"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Management
                </a>
                <a
                  href="/campaigns"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Campaigns
                </a>
                <a
                  href="/tasks"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Tasks
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Elements for Visual Interest */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
