'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CatalogDetail {
  id: number
  name: string
  icon: string
  tags: string[]
  corporate: string
  responsible_user: {
    id: number
    username: string
    email: string
    full_name: string
  }
  menu: string
  product: {
    id: number
    schema_name: string
    domain: string
    description: string
    created_at: string
    updated_at: string
  }
  mandatory: string
  frequency: string
  deadline: string
  api_key: string
  submission_email: string
  authorized_emails: string
  sftp_folder: string
}

interface ProductField {
  name: string
  field_type: string
  length: number
  is_null: boolean
  is_primary_key: boolean
  validation_rule: {
    is_unique: boolean
    is_picklist: boolean
    picklist_values: string
    has_min_max: boolean
    min_value: number | null
    max_value: number | null
    is_email_format: boolean
    is_phone_format: boolean
    has_max_decimal: boolean
    max_decimal_places: number | null
    has_date_format: boolean
    date_format: string
    has_max_days_of_age: boolean
    max_days_of_age: number | null
    custom_validation: string
  }
}

interface PageProps {
  params: {
    id: string
  }
}

const CatalogDetailPage: React.FC<PageProps> = ({ params }) => {
  const [catalogDetail, setCatalogDetail] = useState<CatalogDetail | null>(null)
  const [productFields, setProductFields] = useState<ProductField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    const fetchCatalogAndProductDetails = async () => {
      try {
        // Fetch Catalog Details
        const catalogResponse = await fetch(`http://localhost:8000/api/catalogs/${params.id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        const catalogData: CatalogDetail = await catalogResponse.json()
        setCatalogDetail(catalogData)

        // Fetch Product Fields
        const productResponse = await fetch(`http://localhost:8000/api/product/${catalogData.product.id}/field`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        const productFieldsData: ProductField[] = await productResponse.json()
        setProductFields(productFieldsData)

        setLoading(false)
      } catch (err) {
        setError('Failed to fetch catalog and product details')
        setLoading(false)
      }
    }

    fetchCatalogAndProductDetails()
  }, [params.id])

  const renderValidationDetails = (field: ProductField) => {
    const validations: string[] = []
    console.log(field)

    if (field.field_type === 'varchar' && field.length) {
      validations.push(`Maximum length: ${field.length} characters`)
    }

    if (field.is_null === false) {
      validations.push('Field is required')
    }

    if (field.validation_rule?.is_unique) {
      validations.push('Must be a unique value')
    }

    if (field.validation_rule?.is_email_format) {
      validations.push('Must be a valid email format')
    }

    if (field.validation_rule?.is_phone_format) {
      validations.push('Must be a valid phone number format')
    }

    if (field.validation_rule?.has_min_max) {
      if (field.validation_rule.min_value !== null) {
        validations.push(`Minimum value: ${field.validation_rule.min_value}`)
      }
      if (field.validation_rule.max_value !== null) {
        validations.push(`Maximum value: ${field.validation_rule.max_value}`)
      }
    }

    if (field.validation_rule?.has_date_format) {
      validations.push(`Date format: ${field.validation_rule.date_format}`)
    }
    if (field.validation_rule?.picklist_values) {
      const picklistValues = field.validation_rule.picklist_values.split(',')
      validations.push(`Allowed picklist values: ${picklistValues.join(', ')}`)
    }

    return validations
  }

  if (loading) return <div className='p-4'>Loading...</div>
  if (error) return <div className='p-4 text-red-500'>{error}</div>
  if (!catalogDetail) return null

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Catalog Details: {catalogDetail.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <h3 className='font-semibold mb-2'>Basic Information</h3>
              <p>
                <strong>Corporate:</strong> {catalogDetail.corporate}
              </p>
              <p>
                <strong>Frequency:</strong> {catalogDetail.frequency}
              </p>
              <p>
                <strong>Deadline:</strong> {catalogDetail.deadline}
              </p>
              <p>
                <strong>Mandatory:</strong> {catalogDetail.mandatory}
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>Responsible User</h3>
              <p>
                <strong>Name:</strong> {catalogDetail.responsible_user.full_name}
              </p>
              <p>
                <strong>Email:</strong> {catalogDetail.responsible_user.email}
              </p>
            </div>
          </div>
          <div className='mt-4'>
            <h3 className='font-semibold mb-2'>Tags</h3>
            <div className='flex gap-2'>
              {catalogDetail.tags.map(tag => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Product Details: {catalogDetail.product.schema_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <p>
                <strong>Domain:</strong> {catalogDetail.product.domain}
              </p>
              <p>
                <strong>Description:</strong> {catalogDetail.product.description}
              </p>
            </div>
            <div>
              <p>
                <strong>Created At:</strong> {new Date(catalogDetail.product.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Updated At:</strong> {new Date(catalogDetail.product.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Product Fields</CardTitle>
        </CardHeader>
        <CardContent>
          {productFields.map((field, index) => (
            <Card key={index} className='mb-4'>
              <CardHeader>
                <CardTitle>
                  {field.name} ({field.field_type})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderValidationDetails(field).length > 0 && (
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertTitle>Validation Rules</AlertTitle>
                    <AlertDescription>
                      <ul className='list-disc pl-5'>
                        {renderValidationDetails(field).map((validation, idx) => (
                          <li key={idx}>{validation}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default CatalogDetailPage
