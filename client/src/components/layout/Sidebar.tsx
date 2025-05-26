import { usePathname } from "next/navigation";
import Link from "next/link";
import CircleIcon from "../ui/circleIcon";
import Image from "next/image";
import coffeeImage from "@/app/coffee.png"; // Import the local coffee image

// Define props for the Sidebar component
interface SidebarProps {
  closeSidebar: () => void; // Function to close the sidebar, passed from Layout
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const pathname = usePathname();
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "DAOs", path: "/daos", icon: "circle" },
    { name: "Management", path: "/management", icon: "settings" },
    { name: "Campaigns", path: "/campaigns", icon: "campaign" },
    { name: "Tasks", path: "/tasks", icon: "task" },
    { name: "Activity", path: "/activity", icon: "history" },
    { name: "Grading", path: "/grading", icon: "rate_review" },
    { name: "Shillers", path: "/shillers", icon: "people" },
    {
      name: "Our DAO",
      path: "https://dao.cafe/dao/shilldao",
      icon: "coffee",
      external: true,
    },
  ];
  const renderIcon = (iconName: string) => {
    if (iconName === "circle") {
      return <CircleIcon className="mr-3 text-gray-600 dark:text-gray-400" />;
    } else if (iconName === "coffee") {
      return (
        <Image
          src={coffeeImage} // Use the imported local image
          alt="DAO Cafe"
          width={24}
          height={24}
          className="mr-3"
        />
      );
    }
    return (
      <span className="material-icons-outlined mr-3 text-gray-600 dark:text-gray-400">
        {iconName}
      </span>
    );
  };

  return (
    // Added dark mode background and text color to the main div
    <div className="w-64 bg-gray dark:bg-gray-800 text-black dark:text-gray-200 flex flex-col border-r border-gray-200 dark:border-gray-700">
      {/* ShillDAO Title */}
      <div className="px-6 py-4 mt-2 flex justify-center items-center">
        {" "}
        {/* Added padding */}
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          ShillDAO
        </h2>
      </div>
      {/* Navigation */}
      <nav className="flex-1 mt-4">
        {" "}
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                {item.external ? (
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeSidebar}
                    className={`flex items-center px-6 py-3 hover:bg-gray-900 dark:hover:bg-gray-700 hover:text-white dark:hover:text-gray-100 hover:rounded-xl hover:border-l-4 ${
                      isActive
                        ? "bg-gray-900 dark:bg-gray-700 border-l-4 rounded-xl text-white dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.name}</span>
                  </a>
                ) : (
                  <Link
                    href={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center px-6 py-3 hover:bg-gray-900 dark:hover:bg-gray-700 hover:text-white dark:hover:text-gray-100 hover:rounded-xl hover:border-l-4 ${
                      isActive
                        ? "bg-gray-900 dark:bg-gray-700 border-l-4 rounded-xl text-white dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
