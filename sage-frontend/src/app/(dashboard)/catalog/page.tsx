'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Database } from 'lucide-react'
import axios from 'axios'

const CatalogsPage = () => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // State to store catalogs data from API
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isStaff, setIsStaff] = useState(null)

  // Fetch catalogs data from API
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    setIsAuthenticated(true)
    const userDetails = async () => {
      try {
        // Fetch user details from the API
        const response = await axios.get('http://127.0.0.1:8000/api/auth/user/details/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        // Set is_staff state based on the response
        setIsStaff(response.data.is_staff)
      } catch (err) {
        setError('User details not found')
        setLoading(false)
      }
    }

    userDetails()

    const fetchCatalogs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/catalogs', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        setCatalogs(response.data)
        setLoading(false)
        setTotalPages(Math.ceil(response.data.length / itemsPerPage)) // Calculate total pages
      } catch (err) {
        setError('Failed to fetch catalogs')
        setLoading(false)
      }
    }

    fetchCatalogs()
  }, [])

  // Calculate the catalogs to show for the current page
  const indexOfLastCatalog = currentPage * itemsPerPage
  const indexOfFirstCatalog = indexOfLastCatalog - itemsPerPage
  const currentCatalogs = catalogs.slice(indexOfFirstCatalog, indexOfLastCatalog)

  // Pagination buttons logic
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400'
      case 'Delayed':
        return 'bg-rose-100 text-rose-800 ring-2 ring-rose-400'
      case 'Pending':
        return 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
      default:
        return 'bg-slate-100 text-slate-800 ring-2 ring-slate-400'
    }
  }

  const getDomainClass = (domain: string) => {
    switch (domain) {
      case 'OK':
        return 'text-emerald-600'
      case 'Error':
        return 'text-rose-600'
      case 'Delayed':
        return 'text-amber-600'
      default:
        return 'text-slate-600'
    }
  }
  if (!isAuthenticated) {
    return <div>Loading...</div> // Or null to not render anything
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 lg:p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center gap-3 mb-8'>
          <Database className='w-8 h-8 text-blue-600' />
          <h1 className='text-3xl font-bold text-blue-600'>Catalogs</h1>
        </div>

        {isStaff !== null && isStaff && (
          <div className='mb-6'>
            <button
              onClick={() => router.push('/catalog/add-catalog')}
              className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg
                       flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg'
            >
              <Plus className='w-5 h-5' />
              Add New Catalog
            </button>
          </div>
        )}

        <div className='overflow-hidden bg-white rounded-xl shadow-lg border border-blue-100'>
          {/* Display loading state */}
          {loading && <p className='text-center text-blue-600 py-4'>Loading catalogs...</p>}

          {/* Display error message if failed to fetch data */}
          {error && <p className='text-center text-red-600 py-4'>{error}</p>}

          {/* Display table if catalogs data is available */}
          {!loading && !error && currentCatalogs.length > 0 && (
            <table className='min-w-full divide-y divide-blue-200'>
              <thead>
                <tr className='bg-blue-500'>
                  {['Name', 'Company', 'Product', 'Domain', 'Status'].map(header => (
                    <th key={header} className='px-6 py-4 text-left text-sm font-semibold text-white tracking-wider'>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-blue-100'>
                {currentCatalogs.map((catalog, index) => (
                  <tr key={index} className='hover:bg-blue-50 transition-colors duration-150'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='text-sm font-semibold text-blue-700'>{catalog.name}</span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='text-sm font-medium text-slate-600'>{catalog.corporate}</span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-sm font-medium'>
                        {catalog.product.schema_name}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`text-sm font-semibold ${getDomainClass(catalog.product.domain)}`}>
                        {catalog.product.domain}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${getStatusClass(catalog.status || 'Pending')}`}
                      >
                        {catalog.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* If no catalogs are available */}
          {!loading && !error && currentCatalogs.length === 0 && (
            <p className='text-center text-blue-600 py-4'>No catalogs available</p>
          )}

          {/* Pagination controls */}
          <div className='flex justify-center items-center gap-4 mt-6 mb-4'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className='px-4 py-2 bg-transparent hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-full'
              disabled={currentPage === 1}
            >
              ←
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 ${page === currentPage ? 'bg-blue-100 text-blue-600' : 'bg-transparent text-slate-600'} hover:bg-blue-100 hover:text-blue-600 rounded-full`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className='px-4 py-2 bg-transparent hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-full'
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CatalogsPage
