"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ReactNode } from "react";
import React from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function specifically to close the sidebar (for mobile)
  const closeSidebar = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Pass closeSidebar (though it won't be used here) */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <div className="flex flex-col w-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <Sidebar closeSidebar={closeSidebar} />
        </div>
      </div>

      {/* Mobile Sidebar - Overlay that slides in from left */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-100 dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="h-full overflow-y-auto">
          {/* Pass closeSidebar to the mobile sidebar instance */}
          <Sidebar closeSidebar={closeSidebar} />
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main content container */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
