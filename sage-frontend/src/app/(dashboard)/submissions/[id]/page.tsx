'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, File } from 'react-feather';
import CatalogCard from '@components/CatalogCard';
import Loader from '@components/Loader';

interface SubmissionPageProps {
  params: {
    id: string;
  };
}

interface Submission {
  id: number;
  submitted_by: string;
  submission_time: string;
  submission_type?: string;
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productId, setProductId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      
      return;
    }

    const fetchProductId = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/catalogs/${params.id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Product ID fetched:', data.product.id);

        setProductId(data.product.id);
      } catch (error) {
        console.error('Error fetching the product ID:', error);
        setError('Failed to fetch product ID');
      }
    };

    fetchProductId();
  }, [params.id, router]);

  useEffect(() => {
    if (!productId) return;

    const token = localStorage.getItem('accessToken');
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/product/${productId}/submissions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission data');
        }

        const data: Submission[] = await response.json();
        console.log('Submission data:', data);
        setUploadedFiles(data);
      } catch (error) {
        console.error('Error fetching submission data:', error);
        setError('Failed to fetch submissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleAddSubmissionClick = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleManualSubmission = () => {
    console.log('Manual Submission clicked');
    setIsPopupOpen(false);
    setIsLoading(true);

    if (productId) {
      router.push(`/data?productId=${productId}`);
    }
  };

  const handleUploadFile = (): Promise<void> => {
    console.log('Upload File clicked');
    setIsPopupOpen(false);
    setIsLoading(true);

    if (productId) {
      router.push(`/upload?productId=${productId}`);
    }

    return Promise.resolve(); // Ensure this returns a Promise
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      <Loader isLoading={isLoading} size={100} color="#3498db" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <File className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">Submissions Data</h1>
        </div>

        <button
          onClick={handleAddSubmissionClick}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg mb-6"
        >
          <Plus className="w-5 h-5" />
          Add Submission
        </button>

        {isPopupOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="bg-white p-12 rounded-lg shadow-lg max-w-2xl w-full relative">
              <button
                onClick={handleClosePopup}
                className="absolute top-[-10px] right-[-10px] text-gray-500 hover:text-gray-700 text-2xl bg-white hover:bg-gray-300 border-none p-0 rounded-full w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>

              <h2 className="text-2xl font-semibold mb-6">Select Submission Type</h2>
              <button
                onClick={handleManualSubmission}
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg mb-6"
              >
                Manual Submission
              </button>
              <button
                onClick={handleUploadFile}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Upload File
              </button>
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
            {uploadedFiles.map((submission) => (
              <CatalogCard
                key={submission.id.toString()}
                catalog={{
                  id: submission.id.toString(),
                  name: submission.submitted_by,
                  product: { schema_name: submission.submission_time },
                  icon: submission.submission_type || '',
                }}
                onDrop={() => {}}
                handleFileUpload={handleUploadFile} // Updated to match the type
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No uploaded files found for this catalog.</p>
        )}
      </div>
    </div>
  );
}
