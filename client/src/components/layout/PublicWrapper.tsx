"use client";

import { ReactNode } from "react";

type PublicWrapperProps = {
  children: ReactNode;
};

const PublicWrapper = ({ children }: PublicWrapperProps) => {
  // No authentication check, just render the children
  return <>{children}</>;
};

export default PublicWrapper;
