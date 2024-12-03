'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// import PageWithAuth from '../../hocs/pageWithAuth'
import { Calendar, Clock, FileCheck, Users } from 'lucide-react'

interface TableRow {
  date: string; // or Date if you're working with Date objects
  domain: string;
  status: string;
  user: string | null;
}

// Define the structure for the tableData
interface TableData {
  lastSubmitted: TableRow[];
  delayedRecords: TableRow[]; // Assuming delayedRecords has a similar structure
}

const Dashboard = () => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedStat, setSelectedStat] = useState<number | null>(null);
  const [tableData, setTableData] = useState<TableData>({
    lastSubmitted: [],
    delayedRecords: []
  });
  const alertsData = [
    { alert: 'Submission Error', date: '01/09/2024' },
    { alert: 'System Warning', date: '02/09/2024' },
    { alert: 'Server Downtime', date: '03/09/2024' }
  ]
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    domain: '',
    product: '',
    user: ''
  })
  const [stats, setStats] = useState([
    { title: 'New Submissions', count: 0, icon: FileCheck, color: 'bg-gradient-to-br from-green-400 to-green-600' },
    { title: 'Delayed Submissions', count: 0, icon: Clock, color: 'bg-gradient-to-br from-red-400 to-red-600' },
    { title: 'Total Submissions', count: 0, icon: Users, color: 'bg-gradient-to-br from-blue-400 to-blue-600' }
  ])

  const inputClass =
    'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-200'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-200 text-yellow-800'
      case 'In Progress':
        return 'bg-blue-200 text-blue-800'
      case 'Delayed':
        return 'bg-red-200 text-red-800'
      default:
        return ''
    }
  }

  const handleSearch = async () => {
    console.log('Searching with params:', searchParams)
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login page if access token is not found
      router.push('/login')

      return
    }
    setIsAuthenticated(true)
    try {
      console.log(searchParams)
      const response = await fetch('http://127.0.0.1:8000/api/uploads/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      console.log(data)

      // Update the stats state with the new data
      setStats([
        {
          title: 'New Submissions',
          count: data.new_submissions,
          icon: FileCheck,
          color: 'bg-gradient-to-br from-green-400 to-green-600'
        },
        {
          title: 'Delayed Submissions',
          count: data.delayed_submissions,
          icon: Clock,
          color: 'bg-gradient-to-br from-red-400 to-red-600'
        },
        {
          title: 'Total Submissions',
          count: data.total_submissions,
          icon: Users,
          color: 'bg-gradient-to-br from-blue-400 to-blue-600'
        }
      ])
      const { last_submitted, delayed_records } = data
      setTableData({
        lastSubmitted: last_submitted,
        delayedRecords: delayed_records
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  const handleClear = () => {
    // Reset the search fields to empty values
    setSearchParams({
      from: '',
      to: '',
      domain: '',
      product: '',
      user: ''
    })
  }

  useEffect(() => {
    handleSearch()
  }, [])
  if (!isAuthenticated) {
    return <div>Loading...</div> // Or null to not render anything
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Main content */}
      <div className='p-4 sm:p-6 lg:p-8 space-y-8'>
        {/* Search bar */}
        <div className='bg-white p-6 rounded-xl shadow-lg space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
            {Object.entries({
              from: 'From',
              to: 'To',
              domain: 'Domain',
              product: 'Product',
              user: 'User'
            }).map(([key, label]) => (
              <div key={key}>
                <label className='block text-sm font-medium text-gray-700 mb-1'>{label}</label>
                <div className='relative rounded-md shadow-sm'>
                  <input
                    type={['from', 'to'].includes(key) ? 'date' : 'text'}
                    className={inputClass}
                    value={searchParams[key as keyof typeof searchParams]}
                    onChange={e => setSearchParams(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                  {['from', 'to'].includes(key) && (
                    <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                      <Calendar className='h-5 w-5 text-gray-400' />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className='flex space-x-4'>
            <button
              onClick={handleSearch}
              className='bg-indigo-600 text-white px-6 py-2 rounded-md w-full sm:w-auto hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 transform hover:scale-105'
            >
              Search
            </button>

            <button
              onClick={handleClear}
              className='bg-gray-300 text-gray-700 px-6 py-2 rounded-md w-full sm:w-auto hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 transform hover:scale-105'
            >
              Clear Fields
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} p-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 cursor-pointer ${
                selectedStat === index ? 'ring-4 ring-offset-2 ring-indigo-500' : ''
              }`}
              onClick={() => setSelectedStat(selectedStat === index ? null : index)}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-lg font-semibold text-white mb-2'>{stat.title}</h2>
                  <p className='text-3xl font-bold text-white'>{stat.count}</p>
                </div>
                <stat.icon className='h-12 w-12 text-white opacity-75' />
              </div>
            </div>
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Last Submitted Table */}
          <div className='bg-white p-6 rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>Last Submitted</h2>
            </div>
            <div className='overflow-x-auto hide-scrollbar'>
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none; /* Internet Explorer 10+ */
                  scrollbar-width: none; /* Firefox */
                }
              `}</style>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Domain
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {tableData.lastSubmitted.map((row, index) => (
                    <tr key={index} className='hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-4 text-gray-900'>{row.date}</td>
                      <td className='px-6 py-4 text-gray-900'>{row.domain}</td>
                      <td className='px-6 py-4 text-gray-900'>{row.user || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='bg-white p-6 rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>Alerts</h2>
            </div>
            <div className='overflow-x-auto hide-scrollbar'>
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none; /* Internet Explorer 10+ */
                  scrollbar-width: none; /* Firefox */
                }
              `}</style>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Alert
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {alertsData.map((alert, index) => (
                    <tr key={index} className='hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-4 text-gray-900'>{alert.alert}</td>
                      <td className='px-6 py-4 text-gray-900'>{alert.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delayed Records Table */}
          <div className='bg-white p-6 rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>Delayed Records</h2>
            </div>
            <div className='overflow-x-auto hide-scrollbar'>
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none; /* Internet Explorer 10+ */
                  scrollbar-width: none; /* Firefox */
                }
              `}</style>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Domain
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {tableData.delayedRecords.map((row, index) => (
                    <tr key={index} className='hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-4 text-gray-900'>{row.date}</td>
                      <td className='px-6 py-4 text-gray-900'>{row.domain}</td>
                      <td className='px-6 py-4'>
                        <p
                          className={`rounded-full ${getStatusColor(row.status)} px-4 py-2 text-center text-sm font-medium`}
                        >
                          {row.status}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Page() {
  return <Dashboard />
}

// export default PageWithAuth(Page)
export default Page
