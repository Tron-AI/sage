import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AddNewCatalog from '@/components/AddNewCatalog'
import ProductCatalogFields from '@/components/ProductCatalogFields'
import type { Field } from '@/types/field'

interface EditCatalogProps {
  catalogId: string
}

interface CatalogData {
  id: string | number
  catalogName: string
  tags: string
  authorizedEmails: string
  productName: string
  productId: string
  domain: string
  description: string
  responsibleUser: number
  corporate: string
  menu: string
  api_key: string
  submission_email: string
  sftp_folder: string
  deadline: string
  icon: string
}

const EditCatalog: React.FC<EditCatalogProps> = ({ catalogId }) => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showFieldsPopup, setShowFieldsPopup] = useState(false)
  const [fields, setFields] = useState<Field[]>([])
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        router.push('/login')

        return
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/user/details/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsAuthenticated(response.data.is_staff)
        if (!response.data.is_staff) {
          router.push('/home')
        }
      } catch (err) {
        router.push('/home')
        console.error('Authentication failed:', err)
      }
    }

    checkAuth()
  }, [router, API_URL, token])

  useEffect(() => {
    const fetchCatalogData = async () => {
      if (!isAuthenticated || !catalogId) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch catalog data
        const catalogResponse = await axios.get(`${API_URL}/api/catalogs/${catalogId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log(catalogResponse)

        setCatalogData({
          id: catalogResponse.data.id,
          catalogName: catalogResponse.data.name,
          corporate: catalogResponse.data.corporate,
          menu: catalogResponse.data.menu,
          api_key: catalogResponse.data.api_key,
          submission_email: catalogResponse.data.submission_email,
          sftp_folder: catalogResponse.data.sftp_folder,
          tags: catalogResponse.data.tags.join(','),
          authorizedEmails: catalogResponse.data.authorized_emails_list.join('\n'),
          productName: catalogResponse.data.product.schema_name,
          productId: catalogResponse.data.product.id,
          domain: catalogResponse.data.product.domain,
          description: catalogResponse.data.product.description,
          responsibleUser: catalogResponse.data.responsible_user.id,
          deadline: catalogResponse.data.deadline,
          icon: catalogResponse.data.icon_data
        })
        console.log('here')
        console.log(catalogData)
      } catch (err) {
        console.error('Error fetching catalog data:', err)
        setError('Failed to load catalog data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCatalogData()
  }, [isAuthenticated, catalogId, API_URL, token])

  const handleDefineFields = () => {
    setShowFieldsPopup(true)
  }

  const handleCloseFieldsPopup = () => {
    setShowFieldsPopup(false)
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  if (isLoading) {
    return <div>Loading catalog data...</div>
  }

  if (error) {
    return <div className='text-red-600'>{error}</div>
  }

  return (
    <div className='relative'>
      <AddNewCatalog
        fields={fields}
        onDefineFields={handleDefineFields}
        initialData={catalogData || {}}
        isEditMode={true}
      />

      {showFieldsPopup && catalogData && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto'>
            <ProductCatalogFields
              fields={fields}
              setFields={setFields}
              onClose={handleCloseFieldsPopup}
              productId={catalogData.productId}
              isEditMode={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EditCatalog
