import React from "react";
interface CircleIconProps {
  className: string;
}

const CircleIcon: React.FC<CircleIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor" // This will use the current text color from your theme
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};

export default CircleIcon;
