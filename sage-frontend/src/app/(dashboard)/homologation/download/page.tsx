'use client';
import React, { useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

const DownloadHomologations: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');

      return;
    }
  })
  
  const handleDownloadPendingProducts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');

      return;
    }

    try {
      const response = await axios.get(
        'http://localhost:8000/api/homologation/download-pending-products/',
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pending_homologations.csv'); // File name
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success('Download started successfully for pending products!');
    } catch (err) {
      toast.error('Failed to download the file. Please try again.');
      console.error(err);
    }
  };

  const handleDownloadActiveCatalog = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      
      return;
    }

    try {
      const response = await axios.get(
        'http://localhost:8000/api/homologation/download-active-items/',
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'active_catalog_items.csv'); // File name
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success('Download started successfully for active catalog items!');
    } catch (err) {
      toast.error('Failed to download the file. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-6xl">
        {/* Card for Pending Homologations */}
        <div className="w-full sm:w-1/2 max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Download Pending Homologations
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Click the button below to download a CSV file of products pending homologation.
          </p>
          <button
            onClick={handleDownloadPendingProducts}
            className="w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Download Pending Products CSV
          </button>
        </div>

        {/* Card for Active Catalog Items */}
        <div className="w-full sm:w-1/2 max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Download Official Catalog Products
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Click the button below to download a CSV file of Official catalog.
          </p>
          <button
            onClick={handleDownloadActiveCatalog}
            className="w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            Download Active Catalog CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadHomologations;
