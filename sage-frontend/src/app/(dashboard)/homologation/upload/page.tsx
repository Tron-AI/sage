'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation';

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [homologationFile, setHomologationFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [stockTableMapping, setStockTableMapping] = useState<boolean>(false)
  const [homologationHistoryMapping, setHomologationHistoryMapping] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          router.push('/login')

          return
        }

        const response = await axios.get('http://localhost:8000/api/homologation/configuration/booleans/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setStockTableMapping(response.data.stock_table_mapping)
        setHomologationHistoryMapping(response.data.homologation_history_mapping)
      } catch (error) {
        console.error('Error fetching mappings:', error)
        setErrors(['Failed to fetch mapping data. Please try again.'])
      }
    }

    fetchMappings()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isHomologation: boolean) => {
    const uploadedFile = e.target.files ? e.target.files[0] : null
    if (uploadedFile) {
      if (isHomologation) {
        setHomologationFile(uploadedFile)
      } else {
        setFile(uploadedFile)
      }
    }
  }

  const handleUpload = async (isHomologation: boolean) => {
    const fileToUpload = isHomologation ? homologationFile : file
    if (!fileToUpload) {
      setErrors(prevErrors => [
        ...prevErrors,
        isHomologation ? 'Please select a homologation file to upload.' : 'Please select a catalog file to upload.'
      ])

      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      setErrors(prevErrors => [...prevErrors, 'Please log in first.'])

      return
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)

    try {
      setLoading(true)
      setErrors([])
      const url = isHomologation
        ? 'http://localhost:8000/api/homologation/upload/'
        : 'http://localhost:8000/api/homologation/official-catalog/upload/'

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 200) {
        toast.success('File uploaded and data saved successfully!')
        setErrors([])
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorMessages = Array.isArray(err.response.data.error)
          ? err.response.data.error
          : [err.response.data.error]
        setErrors(prevErrors => [...prevErrors, ...errorMessages])
      } else {
        setErrors(prevErrors => [...prevErrors, 'Failed to upload the file. Please try again.'])
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async (isHomologation: boolean) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setErrors(prevErrors => [...prevErrors, 'Please log in first.'])

      return
    }

    try {
      const url = isHomologation
        ? 'http://localhost:8000/api/homologation/download-template/'
        : 'http://localhost:8000/api/homologation/official-catalog/download-template/'

      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const fileName = isHomologation ? 'homologation_upload_template.xlsx' : 'catalog_upload_template.xlsx'
      const urlObject = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = urlObject
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)

      toast.success('Template downloaded successfully!')
      setErrors([])
    } catch (err) {
      setErrors(prevErrors => [...prevErrors, 'Failed to download the template. Please try again.'])
      console.error(err)
    }
  }
  if (!stockTableMapping && !homologationHistoryMapping) {
    return (
      <div className='space-y-6 p-8 bg-gray-100 min-h-screen'>
        <div className='text-center mt-20'>
          <h1 className='text-2xl font-bold'>Uploads Not Allowed</h1>
          <p className='text-gray-500'>Please contact your administrator for further assistance.</p>
        </div>
      </div>
    )
  } else {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col items-center p-6'>
        <ToastContainer />

        {loading && (
          <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50'>
            <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
          </div>
        )}

        <div className='flex flex-col md:flex-row justify-center gap-4 w-full max-w-6xl'>
          {stockTableMapping && (
            <div className='w-full md:w-1/2 bg-white rounded-lg shadow-lg p-8'>
              <h1 className='text-2xl font-semibold text-gray-800 text-center mb-6'>Upload Official Catalog Data</h1>
              <p className='text-sm text-gray-600 text-center mb-6'>
                Upload an Excel file with catalog data. Download the template to know the required format.
              </p>
              <div className='mb-6 text-center'>
                <button
                  onClick={() => handleDownloadTemplate(false)}
                  className='w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                >
                  Download Official Catalog Template
                </button>
              </div>
              <div className='mb-6'>
                <input type='file' accept='.xlsx,.xls' onChange={e => handleFileChange(e, false)} />
              </div>
              <div className='text-center'>
                <button
                  onClick={() => handleUpload(false)}
                  className='w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none'
                >
                  Upload Official Catalog File
                </button>
              </div>
            </div>
          )}

          {homologationHistoryMapping && (
            <div className='w-full md:w-1/2 bg-white rounded-lg shadow-lg p-8'>
              <h1 className='text-2xl font-semibold text-gray-800 text-center mb-6'>Upload Homologation Data</h1>
              <p className='text-sm text-gray-600 text-center mb-6'>
                Upload an Excel file with homologation data. Download the template to know the required format.
              </p>
              <div className='mb-6 text-center'>
                <button
                  onClick={() => handleDownloadTemplate(true)}
                  className='w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                >
                  Download Homologation Template
                </button>
              </div>
              <div className='mb-6'>
                <input type='file' accept='.xlsx,.xls' onChange={e => handleFileChange(e, true)} />
              </div>
              <div className='text-center'>
                <button
                  onClick={() => handleUpload(true)}
                  className='w-full py-2 px-4 text-white text-sm font-medium rounded-lg shadow-sm bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none'
                >
                  Upload Homologation File
                </button>
              </div>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className='mt-6 w-full max-w-md bg-red-100 rounded-lg shadow-lg p-6 mb-6'>
            {errors.map((error, index) => (
              <p key={index} className='text-sm text-red-600 text-center'>
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }
}

export default UploadPage
