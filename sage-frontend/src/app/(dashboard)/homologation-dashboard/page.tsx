'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Type definition for DashboardCard props
interface DashboardCardProps {
  title: string
  value: string | number
  subtitle: string
  color: string
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subtitle, color }) => (
  <div className={`p-4 rounded-lg shadow ${color}`}>
    <h3 className='text-xl font-bold'>{value}</h3>
    <p className='text-lg'>{title}</p>
    <p className='text-sm text-gray-600'>{subtitle}</p>
  </div>
)

// Type definition for PendingAlert props
interface PendingAlertProps {
  distributor: string
  message: string
  status: 'Pending' | 'Rejected' | 'Awaiting'
}

const PendingAlert: React.FC<PendingAlertProps> = ({ distributor, message, status }) => (
  <div className='flex justify-between items-center py-2'>
    <p>
      {distributor} {message}
    </p>
    <span
      className={`px-2 py-1 rounded ${
        status === 'Pending'
          ? 'bg-yellow-200 text-yellow-800'
          : status === 'Rejected'
          ? 'bg-red-200 text-red-800'
          : 'bg-blue-200 text-blue-800'
      }`}
    >
      {status}
    </span>
  </div>
)

const HomologationDashboard = () => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const pieData = [
    { name: 'Homologated', value: 320 },
    { name: 'Pending', value: 100 },
    { name: 'Rejected', value: 30 }
  ]

  const barData = [
    { name: 'Distributor A', Homologated: 120, Pending: 50, Rejected: 10 },
    { name: 'Distributor B', Homologated: 80, Pending: 20, Rejected: 20 },
    { name: 'Distributor C', Homologated: 120, Pending: 30, Rejected: 0 }
  ]

  const COLORS = ['#4CAF50', '#FFC107', '#F44336']

  useEffect(() => {
    const checkAccessTokenAndFetchCatalogs = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        // Redirect to login page if access token is not found
        router.push('/login')

        return
      }

      // If token exists, set authenticated state to true
      setIsAuthenticated(true)
    }

    checkAccessTokenAndFetchCatalogs()
  }, [router]) // Include router as a dependency

  // Return a loading state or nothing until the authentication check is done
  if (!isAuthenticated) {
    return null // Or null to not render anything
  }

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-2'>Homologation System Dashboard</h1>
      <p className='text-gray-600 mb-6'>Monitor the status and performance of product homologations in real time</p>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <DashboardCard
          title='Total Products'
          value='450'
          subtitle='Products received from distributors'
          color='bg-gray-100'
        />
        <DashboardCard title='Homologated' value='320' subtitle='Successful homologations' color='bg-green-100' />
        <DashboardCard title='Pending' value='100' subtitle='Awaiting homologation' color='bg-yellow-100' />
        <DashboardCard title='Rejected' value='30' subtitle='Products with issues' color='bg-red-100' />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div className='bg-white p-4 rounded-lg shadow'>
          <h2 className='text-xl font-bold mb-4'>Homologation Breakdown</h2>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie data={pieData} cx='50%' cy='50%' labelLine={false} outerRadius={80} fill='#8884d8' dataKey='value'>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='bg-white p-4 rounded-lg shadow'>
          <h2 className='text-xl font-bold mb-4'>Homologation Progress by Distributor</h2>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={barData}>
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='Homologated' stackId='a' fill='#4CAF50' />
              <Bar dataKey='Pending' stackId='a' fill='#FFC107' />
              <Bar dataKey='Rejected' stackId='a' fill='#F44336' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='bg-white p-4 rounded-lg shadow'>
        <h2 className='text-xl font-bold mb-4'>Pending Alerts</h2>
        <PendingAlert distributor='Distributor A' message='has 50 pending homologations' status='Pending' />
        <PendingAlert distributor='Distributor B' message='has 20 products with issues' status='Rejected' />
        <PendingAlert distributor='Distributor C' message='has 30 products awaiting approval' status='Awaiting' />
      </div>
    </div>
  )
}

export default function Page() {
  return <HomologationDashboard />
}
