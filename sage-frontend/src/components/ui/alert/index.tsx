// src/components/ui/alert.tsx
import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'info' }) => {
  const variants = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${variants[variant]}`}>
      {children}
    </div>
  );
};

interface AlertTitleProps {
  children: React.ReactNode;
}

const AlertTitle: React.FC<AlertTitleProps> = ({ children }) => {
  return <h4 className="font-semibold text-lg">{children}</h4>;
};

interface AlertDescriptionProps {
  children: React.ReactNode;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => {
  return <p>{children}</p>;
};

export { Alert, AlertTitle, AlertDescription };
