// src/shared/ui/DomainHeader.tsx
import React from "react";

interface DomainHeaderProps {
  title: string;
}

export const DomainHeader = ({ title }: DomainHeaderProps) => {
  return <h2 className="section-title">{title}</h2>;
};
