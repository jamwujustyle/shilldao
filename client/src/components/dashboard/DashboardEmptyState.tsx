"use client";

// Empty state components for charts and tables when no data is available
export const EmptyLineChart = ({ height = "300px" }) => (
  <div
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md"
    style={{ height }}
  >
    <div className="text-center p-6">
      <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        No chart data available
      </p>
    </div>
  </div>
);

export const EmptyBarChart = ({ height = "300px" }) => (
  <div
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md"
    style={{ height }}
  >
    <div className="text-center p-6">
      <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        No chart data available
      </p>
    </div>
  </div>
);

export const EmptyPieChart = ({ height = "300px" }) => (
  <div
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md"
    style={{ height }}
  >
    <div className="text-center p-6">
      <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        No chart data available
      </p>
    </div>
  </div>
);

export const EmptyTable = ({ height = "300px" }) => (
  <div
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md"
    style={{ height }}
  >
    <div className="text-center p-6">
      <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        No table data available
      </p>
    </div>
  </div>
);
