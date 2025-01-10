'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast, ToastContainer } from 'react-toastify'
import { Search } from 'lucide-react'
import 'react-toastify/dist/ReactToastify.css'

interface Match {
  best_match: {
    official_product: {
      id: number
      sku: string
      name: string
      description: string
    }
    confidence_score: number
  }
  product_id: number
  product_name: string
  product_description: string
  product_domain: string
  homologation_id: number
}

const AutoMatchingPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [allowProductMatching, setAllowProductMatching] = useState<boolean | null>(null)
  const router = useRouter()

  // Filter states
  const [filters, setFilters] = useState({
    productName: '',
    productDescription: '',
    productDomain: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      
      return
    }
    fetchConfiguration()
  }, [])

  const fetchConfiguration = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('http://localhost:8000/api/homologation/configuration/booleans/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.non_homologated_products_mapping) {
        setAllowProductMatching(true)
        fetchMatches()
      } else {
        setAllowProductMatching(false)
      }
    } catch (error) {
      console.error('Error fetching configuration:', error)
      setAllowProductMatching(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await axios.get<Match[]>('http://localhost:8000/api/homologation/matches/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      setMatches(response.data)
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const handleMatchUpdate = async (productId: number, status: string) => {
    try {
      setLoading(true)
      await axios.patch(
        `http://localhost:8000/api/homologation/accept-match/${productId}/`,
        { status },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      await fetchMatches()

      if (status === 'approved') {
        toast.success('Match accepted successfully!')
      } else {
        toast.success('Match rejected successfully!')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error updating match:', error)
      toast.error('Failed to update match. Please try again.')
    }
  }

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Filter matches based on all filters
  const filteredMatches = matches.filter(match => {
    const nameMatch = match.product_name.toLowerCase().includes(filters.productName.toLowerCase())
    const descriptionMatch = match.product_description.toLowerCase().includes(filters.productDescription.toLowerCase())
    const domainMatch = match.product_domain.toLowerCase().includes(filters.productDomain.toLowerCase())

    // Only apply filters that have values
    const nameFilter = filters.productName === '' || nameMatch
    const descriptionFilter = filters.productDescription === '' || descriptionMatch
    const domainFilter = filters.productDomain === '' || domainMatch

    return nameFilter && descriptionFilter && domainFilter
  })

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-8 bg-gray-100 min-h-screen'>
      {allowProductMatching === null ? (
        <div>Loading...</div>
      ) : allowProductMatching ? (
        <>
          <h2 className='text-2xl font-bold'>Automated Matching</h2>
          <Card>
            <CardHeader>
              <CardTitle>ML-Based Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters Section */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='relative'>
                  <Search className='absolute left-3 top-2.5 text-gray-400' size={16} />
                  <input
                    type='text'
                    name='productName'
                    placeholder='Filter by product name...'
                    value={filters.productName}
                    onChange={handleFilterChange}
                    className='w-full pl-10 pr-4 py-2 border rounded-lg'
                  />
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-2.5 text-gray-400' size={16} />
                  <input
                    type='text'
                    name='productDomain'
                    placeholder='Filter by product domain...'
                    value={filters.productDomain}
                    onChange={handleFilterChange}
                    className='w-full pl-10 pr-4 py-2 border rounded-lg'
                  />
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-2.5 text-gray-400' size={16} />
                  <input
                    type='text'
                    name='productDescription'
                    placeholder='Filter by product description...'
                    value={filters.productDescription}
                    onChange={handleFilterChange}
                    className='w-full pl-10 pr-4 py-2 border rounded-lg'
                  />
                </div>
              </div>

              <div className='space-y-4'>
                {filteredMatches.length === 0 ? (
                  <div className='text-center text-gray-500'>
                    <p>No matches found</p>
                  </div>
                ) : (
                  filteredMatches.map(match => (
                    <div key={match.product_id} className='p-4 border rounded-lg'>
                      <div className='flex justify-between items-center'>
                        <div>
                          <p className='font-medium'>Product: {match.product_name}</p>
                          <p className='font-small'>Domain: {match.product_domain}</p>
                          <p className='font-small'>Description: {match.product_description}</p>
                          <p className='text-sm text-gray-500'>
                            Suggested Official Catalog: {match.best_match.official_product.sku} - {match.best_match.official_product.name}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold text-green-600'>{match.best_match.confidence_score}%</p>
                          <p className='text-sm text-gray-500'>Confidence</p>
                        </div>
                      </div>
                      <div className='mt-4 flex space-x-4'>
                        <button
                          onClick={() => handleMatchUpdate(match.homologation_id, 'approved')}
                          className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
                        >
                          Accept Match
                        </button>
                        <button
                          onClick={() => handleMatchUpdate(match.homologation_id, 'rejected')}
                          className='px-4 py-2 border rounded hover:bg-gray-50'
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <ToastContainer />
        </>
      ) : (
        <div className="text-center mt-20">
          <h1 className="text-2xl font-bold">Product Matching Not Allowed</h1>
          <p className="text-gray-500">Please contact your administrator for further assistance.</p>
        </div>
      )}
    </div>
  )
}

export default AutoMatchingPage