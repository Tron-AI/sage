'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface TableMetadata {
  fields: string[]
  field_details: { [key: string]: FieldDetails }
}

interface FieldDetails {
  type: 'int' | 'decimal' | 'date' | 'boolean' | 'string'
  is_null: boolean
  is_primary_key: boolean
  is_email_format: boolean
  picklist_values?: string[]
  min_value?: number
  max_value?: number
  max_decimal_places?: number
  length?: number
  date_format?: string
}

export default function DynamicDataEntryPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const router = useRouter()

  const [tableMetadata, setTableMetadata] = useState<TableMetadata | null>(null)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const fetchTableMetadata = async () => {
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
      console.log(response)
      const tableData = response.data
      const tableName = Object.keys(tableData)[0]
      setTableMetadata(tableData[tableName])
      console.log(tableMetadata)

      // Initialize form data based on fields
      const initialFormData: { [key: string]: string } = {}
      tableData[tableName].fields.forEach((field: string) => {
        initialFormData[field] = ''
      })
      setFormData(initialFormData)
      console.log(formData)
    } catch (error) {
      console.error('Error fetching table metadata:', error)
      toast.error('Error fetching table metadata')
    }
  }

  // Fetch table metadata when component mounts
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    if (productId) {
      fetchTableMetadata()
    }
  }, [productId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear any previous errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateField = (field: string, value: string): string => {
    const field_details = tableMetadata?.field_details[field]
    let errorMessage = ''

    // Specific type validations
    if (field_details) {
      switch (field_details.type) {
        case 'int':
        case 'decimal':
          if (value && isNaN(Number(value))) {
            errorMessage = 'Must be a number'
          } else {
            const numValue = Number(value)

            // Validate min_value
            if (
              field_details.min_value !== undefined &&
              field_details.min_value !== null &&
              numValue < field_details.min_value
            ) {
              errorMessage = `Value must be greater than or equal to ${field_details.min_value}`
            }

            // Validate max_value
            if (
              field_details.max_value !== undefined &&
              field_details.max_value !== null &&
              numValue > field_details.max_value
            ) {
              errorMessage = `Value must be less than or equal to ${field_details.max_value}`
            }
          }
          break
        case 'date':
          if (value) {
            // Regular expressions for different date formats
            const dateRegexes = [
              /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
              /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
              /^\d{2}-\d{2}-\d{4}$/ // DD-MM-YYYY
            ]

            let isValidDate = false

            // Check if the value matches any of the defined date formats
            for (const regex of dateRegexes) {
              if (regex.test(value)) {
                // Try parsing the date based on the matched format
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                  isValidDate = true
                  break
                }
              }
            }

            if (!isValidDate) {
              errorMessage = `Invalid date format. Use this format ${field_details.date_format}`
            }
          }
          break
        default:
          if (field_details.is_email_format && !/\S+@\S+\.\S+/.test(value)) {
            errorMessage = 'Invalid email format'
          }
          break
      }
    }

    return errorMessage
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { [key: string]: string } = {}
    Object.keys(formData).forEach((field: string) => {
      const errorMessage = validateField(field, formData[field])
      if (errorMessage) {
        newErrors[field] = errorMessage
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }

    try {
      console.log(JSON.stringify(formData))
      await axios.post(`http://localhost:8000/api/product/${productId}/save-data/`, JSON.stringify(formData), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      toast.success('Data saved successfully!')
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
      console.error('Error saving data:', error)
      toast.error('Error saving data, please see email for further details')
    }
  }

  const renderInput = (field: string) => {
    const field_details = tableMetadata?.field_details[field]
    const isRequired = field_details?.is_null === false || field_details?.is_primary_key === true

    const inputClass =
      'block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

    // First, check for picklist values - this takes precedence
    if (field_details?.picklist_values && field_details.picklist_values.length > 0) {
      return (
        <select
          id={field}
          value={formData[field] || ''}
          onChange={e => handleInputChange(field, e.target.value)}
          required={isRequired}
          className={`${inputClass} bg-white`}
        >
          <option value=''>Select</option>
          {field_details.picklist_values.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    // Then handle specific types
    switch (field_details?.type) {
      case 'boolean':
        return (
          <select
            id={field}
            value={formData[field] || ''}
            onChange={e => handleInputChange(field, e.target.value)}
            required={isRequired}
            className={`${inputClass} bg-white`}
          >
            <option value=''>Select</option>
            <option value='true'>True</option>
            <option value='false'>False</option>
          </select>
        )
      case 'date':
        return (
          <input
            id={field}
            type='date'
            value={formData[field] || ''}
            onChange={e => handleInputChange(field, e.target.value)}
            required={isRequired}
            className={`${inputClass} bg-white`}
          />
        )
      case 'int':
        return (
          <input
            id={field}
            type='number'
            value={formData[field] || ''}
            onChange={e => handleInputChange(field, e.target.value)}
            required={isRequired}
            className={`${inputClass} bg-white`}
          />
        )
      case 'decimal':
        const stepValue = field_details.max_decimal_places ? Math.pow(10, -field_details.max_decimal_places) : undefined

        return (
          <input
            id={field}
            type='number'
            value={formData[field] || ''}
            onChange={e => handleInputChange(field, e.target.value)}
            step={stepValue}
            required={isRequired}
            className={`${inputClass} bg-white`}
          />
        )
      default:
        return (
          <input
            id={field}
            type='text'
            value={formData[field] || ''}
            onChange={e => handleInputChange(field, e.target.value)}
            maxLength={field_details?.length}
            required={isRequired}
            className={`${inputClass} bg-white`}
          />
        )
    }
  }

  if (!tableMetadata) return <div>Loading...</div>

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl mb-4'>Enter Product Data</h1>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {tableMetadata.fields.map((field: string) => (
          <div key={field} className='flex flex-col space-y-2'>
            <label htmlFor={field} className='text-gray-700 font-medium text-sm'>
              {field}
            </label>
            <div className='relative'>{renderInput(field)}</div>
            {errors[field] && <p className='text-red-500 text-sm mt-1'>{errors[field]}</p>}
          </div>
        ))}
        <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded'>
          Save Data
        </button>
      </form>
      <ToastContainer />
    </div>
  )
}
