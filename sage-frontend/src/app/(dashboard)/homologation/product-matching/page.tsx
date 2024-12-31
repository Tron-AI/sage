'use client'

import React, { useEffect, useState } from 'react'
import { Search, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify' // Import Toastify
import 'react-toastify/dist/ReactToastify.css' // Import Toastify styles
import './page.css'

interface DistributorProduct {
  id: number
  schema_name: string
  domain: string
  description: string
  created_at: string
}

interface CatalogProduct {
  id: number
  sku: string
  name: string
  category: string
}

const ProductMatchingInterface = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [distributorProducts, setDistributorProducts] = useState<DistributorProduct[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [selectedDistributorProduct, setSelectedDistributorProduct] = useState<DistributorProduct | null>(null)
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [nonHomologatedProductsAllowed, setNonHomologatedProductsAllowed] = useState<boolean | null>(null)
  const router = useRouter()

  // Fetch configuration
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }
    axios
      .get('http://localhost:8000/api/homologation/configuration/booleans/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setNonHomologatedProductsAllowed(response.data.non_homologated_products_mapping)
      })
      .catch(() => {
        toast.error('Failed to fetch configuration.')
        setNonHomologatedProductsAllowed(false)
      })
  }, [])

  // Fetch distributor products
  useEffect(() => {
    if (nonHomologatedProductsAllowed) {
      axios
        .get('http://localhost:8000/api/homologation/products/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        .then(response => {
          setDistributorProducts(response.data.products)
        })
    }
  }, [nonHomologatedProductsAllowed])

  // Fetch catalog products
  useEffect(() => {
    if (nonHomologatedProductsAllowed) {
      axios
        .get('http://localhost:8000/api/homologation/catalogs/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        .then(response => {
          setCatalogProducts(response.data.catalogs)
        })
    }
  }, [nonHomologatedProductsAllowed])

  // Filter catalog products based on search query
  const filteredCatalogProducts = catalogProducts.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMatch = () => {
    if (selectedDistributorProduct && selectedCatalogProduct) {
      const payload = {
        product_id: selectedDistributorProduct.id,
        catalog_id: selectedCatalogProduct.id
      }

      setLoading(true)

      axios
        .post('http://localhost:8000/api/homologation/', payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        .then(() => {
          toast.success('Match confirmed successfully!')

          axios
            .get('http://localhost:8000/api/homologation/products/', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            })
            .then(response => {
              setDistributorProducts(response.data.products)
            })
        })
        .catch(() => {
          toast.error('Failed to confirm match. Please try again.')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      toast.error('Please select both products to match.')
    }
  }

  // Render loading or not allowed message
  if (nonHomologatedProductsAllowed === null) {
    return <div className='text-center mt-20'>Loading configuration...</div>
  }

  if (!nonHomologatedProductsAllowed) {
    return (
      <div className='space-y-6 p-8 bg-gray-100 min-h-screen'>
        <div className='text-center mt-20'>
          <h1 className='text-2xl font-bold'>Product Matching Not Allowed</h1>
          <p className='text-gray-500'>Please contact your administrator for further assistance.</p>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <div className='p-6 space-y-6 max-w-6xl'>
      <ToastContainer />

      <h1 className='text-2xl font-bold mb-6'>Product Homologation Interface</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Distributor Products */}
        <Card>
          <CardHeader>
            <CardTitle>Distributor Products (Unmatched)</CardTitle>
          </CardHeader>
          <CardContent className='h-[400px] overflow-y-auto  overflow-x-hidden custom-scrollbar'>
            <div className='space-y-4'>
              {distributorProducts.map(product => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedDistributorProduct?.id === product.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDistributorProduct(product)}
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-medium'>{product.schema_name}</p>
                      <p className='text-sm text-gray-500'>Domain: {product.domain}</p>
                      <p className='text-sm text-gray-500'>Description: {product.description}</p>
                    </div>
                    <AlertCircle className='text-yellow-500' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Official Catalog */}
        <Card>
          <CardHeader>
            <CardTitle>Official Catalog</CardTitle>
          </CardHeader>
          <CardContent className='h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar'>
            <div className='mb-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-2 text-gray-400' size={16} />
                <input
                  type='text'
                  placeholder='Search by name or SKU...'
                  className='w-full pl-10 pr-4 py-2 border rounded-lg'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-4'>
              {filteredCatalogProducts.map(product => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedCatalogProduct?.id === product.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCatalogProduct(product)}
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-medium'>{product.name}</p>
                      <p className='text-sm text-gray-500'>SKU: {product.sku}</p>
                      <p className='text-sm text-gray-500'>Category: {product.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Action */}
      <div className='flex justify-center'>
        <button
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
            selectedDistributorProduct && selectedCatalogProduct
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleMatch}
          disabled={!selectedDistributorProduct || !selectedCatalogProduct || loading}
        >
          <CheckCircle size={20} />
          <span>Confirm Match</span>
        </button>
      </div>

      {/* Spinner */}
      {loading && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      )}
    </div>
  )
}

export default ProductMatchingInterface
