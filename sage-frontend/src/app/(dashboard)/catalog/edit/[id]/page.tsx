'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EditCatalog from '@/components/EditCatalog'

interface PageProps {
  params: {
    id: string
  }
}

const EditCatalogPage: React.FC<PageProps> = ({ params }) => {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return <EditCatalog catalogId={params.id} />
}

export default EditCatalogPage
