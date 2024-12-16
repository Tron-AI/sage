// components/Loader.tsx
import React from 'react';
import styles from './Loader.module.css';

// Define the type for the props
interface LoaderProps {
  isLoading: boolean;
  size?: number; // Optional size prop
  color?: string; // Optional color prop
}

const Loader: React.FC<LoaderProps> = ({ isLoading, size = 80, color = "#3498db" }) => {
  if (!isLoading) return null;  // Don't render if not loading
  
  return (
    <div className={styles.loaderWrapper}>
      <div
        className={styles.loader}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderTopColor: color
        }}
      ></div>
    </div>
  );
};

export default Loader;
