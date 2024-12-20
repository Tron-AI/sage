'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface ValidationError {
  row: number
  field: string
  error: string
}

interface TableMetadata {
  [key: string]: any
}

export default function ExcelUploadPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [tableMetadata, setTableMetadata] = useState<TableMetadata | null>(null)
  const [excelData, setExcelData] = useState<any[]>([])
  const [validating, setValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)

  const fetchTableMetadata = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/product/${productId}/product-data/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const tableData = response.data
      const tableName = Object.keys(tableData)[0]
      setTableMetadata(tableData[tableName])
    } catch (error) {
      console.error('Error fetching table metadata:', error)
      toast.error('Error fetching table metadata')
    }
  }, [productId, router])

  useEffect(() => {
    if (productId) {
      fetchTableMetadata()
    }
  }, [productId, fetchTableMetadata])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setIsValidated(false)
      setValidationErrors([])
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        resolve(data)
      }
      reader.onerror = error => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const validateExcelData = async (): Promise<boolean> => {
    if (!file || !tableMetadata) {
      toast.error('Please select a file and ensure table metadata is loaded')

      return false
    }

    setValidating(true)
    setIsValidated(false)

    try {
      const excelRows = await readExcelFile(file)
      const dataRows = excelRows.slice(1)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        setValidating(false)

        return false
      }

      setExcelData(dataRows)

      await axios.post(
        `http://localhost:8000/api/product/${productId}/validate-excel/`,
        {
          data: dataRows,
          headers: excelRows[0]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setValidationErrors([])
      setValidating(false)
      setIsValidated(true)

      toast.success('Excel data validated successfully!')

      return true
    } catch (error: any) {
      if (error.response && error.response.data.errors) {
        setValidationErrors(error.response.data.errors)
      } else {
        toast.error('An error occurred during validation')
      }
      setValidating(false)
      setIsValidated(false)

      return false
    }
  }

  const handleUpload = async (): Promise<void> => {
    // If not already validated, validate first
    if (!isValidated) {
      const isValid = await validateExcelData();
      if (!isValid) return;
    }
  
    // Proceed with upload if validated
    if (excelData.length > 0) {
      try {
        const token = localStorage.getItem('accessToken');
        
        await axios.post(
          `http://localhost:8000/api/product/${productId}/save-excel-data/`,
          { data: excelData },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        toast.success('Data uploaded successfully!');
  
        const response = await axios.get(
          `http://localhost:8000/api/product/${productId}/catalog/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const catalogId = response.data.catalog_id;
  
        if (catalogId) {
          setTimeout(() => {
            router.push(`/submissions/${catalogId}`);
          }, 3000);
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to upload data');
      }
    }
  };

  const downloadExcelTemplate = async (): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/product/${productId}/excel-template/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `product_${productId}_template.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('Template downloaded successfully!')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  return (
    <div className='max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h1 className='text-3xl font-semibold text-gray-800 mb-6 text-center'>Excel Upload for Product</h1>

      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <button
            onClick={downloadExcelTemplate}
            className='inline-flex items-center bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:from-green-500 hover:to-green-700 transition duration-300'
            disabled={!tableMetadata}
          >
            Download Template
          </button>

          <div className='flex items-center space-x-4'>
            <input
              type='file'
              accept='.xlsx, .xls'
              onChange={handleFileChange}
              className='file:border file:border-gray-300 file:rounded-lg file:px-4 file:py-2 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition duration-200'
            />
          </div>
        </div>

        <div className='flex justify-center'>
          <button
            onClick={() => {
              if (isValidated) {
                handleUpload()
              } else {
                validateExcelData()
              }
            }}
            disabled={!file || validating}
            className='bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 disabled:opacity-50'
          >
            {validating ? 'Validating...' : isValidated ? 'Upload Data' : 'Validate Data'}
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className='bg-red-100 p-4 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold text-red-600'>Validation Errors:</h2>
            <ul className='space-y-2 mt-4 text-red-700'>
              {validationErrors.map((error, index) => (
                <li key={index} className='flex'>
                  <span className='font-semibold'>Row {error.row}:</span> {error.field} - {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <ToastContainer />
      </div>
    </div>
  )
}
