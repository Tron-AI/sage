'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

// Define the props type for CatalogCard
type CatalogCardProps = {
  catalog: {
    id: string;
    name: string;
    icon?: string;
    product?: {
      schema_name?: string;
    };
  };
  onDrop: (acceptedFiles: File[], catalogId: string) => void;
  file: File | null;
  handleFileUpload: (catalogId: string) => Promise<void>;
};

const CatalogCard: React.FC<CatalogCardProps> = React.memo(
  ({ catalog, onDrop, file, handleFileUpload }) => {
    const [isDragging, setIsDragging] = useState(false); // State to track drag state

    const { getRootProps } = useDropzone({
      onDrop: acceptedFiles => onDrop(acceptedFiles, catalog.id),
      onDragEnter: () => setIsDragging(true), // Set dragging state to true
      onDragLeave: () => setIsDragging(false), // Reset dragging state
      onDropAccepted: () => setIsDragging(false), // Reset dragging state on drop
      accept: '.xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel' as any,
    });

    // Handle file selection via the browse button
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files ? event.target.files[0] : null;
      if (file) {
        onDrop([file], catalog.id); // Trigger onDrop with the selected file
      }
    };

    return (
      <div
        {...getRootProps()}
        className={`w-80 bg-white border rounded-3xl shadow-md overflow-hidden transition flex flex-col p-6 ${
          isDragging ? 'border-4 border-dotted border-red-500' : 'border'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          {/* Image Section */}
          <img
            src={catalog.icon || '/images/avatars/dummy_catalog.png'}
            alt={catalog.name || 'Catalog Image'}
            className="w-40 h-40 object-cover rounded-full"
          />
        </div>
        {/* Flex container for content and upload button */}
        <div className="flex flex-row justify-between items-center gap-4 w-full">
          {/* Button Div */}
          <div className="flex flex-col items-center justify-center gap-4">
            {/* "+" Button for File Selection */}
            <label
              htmlFor={`file-upload-${catalog.id}`}
              className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center cursor-pointer hover:bg-orange-600 mt-4"
            >
              <span className="text-3xl font-thin">+</span>
            </label>
            <input
              type="file"
              id={`file-upload-${catalog.id}`}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Content Div */}
          <div className="flex flex-col items-center gap-4 w-full mt-6">
            {/* Card Content */}
            <div className="text-left">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">{catalog.name || 'Untitled'}</h3>
              <p className="text-blue-700 mb-4">{catalog.product?.schema_name || 'No description available.'}</p>
            </div>
          </div>
        </div>
        {/* Selected File Info */}
        {file && <p className="text-sm text-gray-800 mb-2 text-center">Selected file: {file.name}</p>}
        {/* Upload Button */}
        <div className="flex justify-center items-center w-full">
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent button click from triggering drag event
              handleFileUpload(catalog.id);
            }}
            className="bg-white text-blue-500 border-4 border-blue-500 py-2 px-6 rounded-full hover:bg-blue-100 hover:text-blue-600 transition mt-4 w-3/4"
          >
            Upload File
          </button>
        </div>
      </div>
    );
  }
);

export default CatalogCard;
