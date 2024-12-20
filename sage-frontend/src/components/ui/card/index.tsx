import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

// Common Props for Card components
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// Card Component
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`border rounded-lg shadow-sm bg-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// CardHeader Component
export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`border-b px-4 py-2 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// CardTitle Component
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
  return (
    <h2
      className={`text-lg font-semibold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

// CardContent Component
export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
