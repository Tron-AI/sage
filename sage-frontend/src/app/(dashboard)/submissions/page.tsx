'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'

import CatalogCard from '@components/CatalogCard'
import { useRouter } from 'next/navigation'

//import PageWithAuth from '@hocs'

const UploadPage = () => {
  const router = useRouter()
  const [message, setMessage] = useState<string>('')
  const [catalogs, setCatalogs] = useState<any[]>([]) // State to hold catalog data
  const [files, setFiles] = useState<{ [key: string]: File | null }>({}) // Track files per catalog
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false) // Modal state
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Fetch catalogs data from the API
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    setIsAuthenticated(true)
    const fetchCatalogs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/catalogs', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        setCatalogs(response.data) // Update state with API data
      } catch (error) {
        console.error('Error fetching catalogs:', error)
        setMessage('Error fetching catalog data!')
        setIsModalOpen(true)
      }
    }

    fetchCatalogs()
  }, [router])

  // Handle file drop for a specific catalog
  const onDrop = (acceptedFiles: File[], catalogId: string) => {
    const validFile = acceptedFiles[0]
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    if (validFile && validMimeTypes.includes(validFile.type)) {
      setFiles(prev => ({ ...prev, [catalogId]: validFile }))
    } else {
      setMessage('Invalid file type. Please upload an Excel file.')
      setIsModalOpen(true)
    }
  }

  // Handle file upload
  const handleFileUpload = async (catalogId: string, selectedFile?: File) => {
    const fileToUpload = selectedFile || files[catalogId]
    if (!fileToUpload) {
      setMessage(`No file selected for catalog ID: ${catalogId}`)
      setIsModalOpen(true)

      return
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    try {
      await axios.post(`http://localhost:8000/api/catalogs/${catalogId}/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setMessage(`File uploaded successfully for catalog ID: ${catalogId}`)
      setIsModalOpen(true)
    } catch (error) {
      console.error(error)
      setMessage(`Error uploading file for catalog ID: ${catalogId}`)
      setIsModalOpen(true)
    }
  }

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false)
  }
  if (!isAuthenticated) {
    return null // Or null to not render anything
  }

  return (
    <div className='bg-white p-6 rounded-xl shadow-lg space-y-4'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-semibold text-gray-800'>Upload Data</h1>
      </div>

      {/* Display Catalog Cards */}
      <div className='flex flex-wrap justify-center gap-8'>
        {catalogs.map(catalog => (
          <CatalogCard
            key={catalog.id}
            catalog={catalog}
            onDrop={onDrop}
            file={files[catalog.id] || null}
            handleFileUpload={handleFileUpload}
          />
        ))}
      </div>

      {/* Modal Popup for Messages */}
      {isModalOpen && (
        <div className='fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg max-w-sm w-full'>
            <p className={`text-lg ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
            <div className='mt-4 flex justify-center'>
              <button
                onClick={closeModal}
                className='bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

//export default PageWithAuth(UploadPage)
export default UploadPage
