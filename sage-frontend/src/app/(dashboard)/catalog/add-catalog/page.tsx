'use client'

import React, { useState, useEffect } from 'react'
import AddNewCatalog from '@components/AddNewCatalog'
import ProductCatalogFields from '@components/ProductCatalogFields'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const CatalogManagement = () => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showFieldsPopup, setShowFieldsPopup] = useState(false)
  const [fields, setFields] = useState([])

  const handleDefineFields = () => {
    setShowFieldsPopup(true)
  }

  const handleCloseFieldsPopup = () => {
    setShowFieldsPopup(false)
  }
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }

    const userDetails = async () => {
      try {
        // Fetch user details from the API
        const response = await axios.get('http://127.0.0.1:8000/api/auth/user/details/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (response.data.is_staff) {
          setIsAuthenticated(true)
        } else {
          router.push('/home')
          setIsAuthenticated(false)
        }
      } catch (err) {
        router.push('/home')
        console.log('User details not found')
      }
    }

    userDetails()
  }, [router])

  if (!isAuthenticated) {
    return <div>Loading...</div> // Or null to not render anything
  }

  return (
    <div className='relative'>
      <AddNewCatalog fields={fields} onDefineFields={handleDefineFields} />
      {showFieldsPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto'>
            <ProductCatalogFields fields={fields} setFields={setFields} onClose={handleCloseFieldsPopup} />
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogManagement
