'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface ConfigurationData {
  name: string
  corporate: string
  product: string
  responsible: string
  frequency: string
  db_ip: string
  db_user: string
  db_password: string
  sftp_ip: string
  sftp_user: string
  sftp_password: string
  non_homologated_products_mapping: boolean
  homologation_history_mapping: boolean
  stock_table_mapping: boolean
  email_configuration: boolean
  alert_configuration: boolean
  approved_emails: string
}

interface InputFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: string
}

const InputField = ({ label, placeholder, value, onChange, type = 'text' }: InputFieldProps) => (
  <div className='mb-4'>
    <label className='block text-sm font-medium text-gray-700 mb-1'>{label}</label>
    <input
      type={type}
      className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
)

interface ConfigButtonProps {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}

const ConfigButton = ({ children, onClick, active }: ConfigButtonProps) => (
  <button
    className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-2 ${
      active 
        ? 'bg-blue-600 text-white hover:bg-blue-700' 
        : 'text-blue-600 bg-white border border-blue-600 hover:bg-blue-50'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
)

interface ModalProps {
  show: boolean
  onClose: () => void
  onSave: (data: { ip: string; user: string; password: string }) => void
  initialData: {
    ip: string
    user: string
    password: string
  }
  title: string
}

const Modal = ({ show, onClose, onSave, initialData, title }: ModalProps) => {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    setData(initialData)
  }, [show, initialData])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <InputField
          label="IP"
          value={data.ip}
          onChange={(value) => setData({ ...data, ip: value })}
          placeholder="Enter IP"
        />
        
        <InputField
          label="User"
          value={data.user}
          onChange={(value) => setData({ ...data, user: value })}
          placeholder="Enter User"
        />
        
        <InputField
          label="Password"
          value={data.password}
          onChange={(value) => setData({ ...data, password: value })}
          placeholder="Enter Password"
          type="password"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => onSave(data)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

interface EmailModalProps {
  show: boolean
  onClose: () => void
  onSave: (emails: string) => void
  initialEmails: string
}

const EmailModal = ({ show, onClose, onSave, initialEmails }: EmailModalProps) => {
  const [emails, setEmails] = useState(initialEmails)

  useEffect(() => {
    setEmails(initialEmails)
  }, [show, initialEmails])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Approved Email Addresses</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Addresses (comma separated)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={4}
            placeholder="email1@example.com, email2@example.com"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => onSave(emails)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const HomologationConfigurations = () => {
  const [config, setConfig] = useState<ConfigurationData>({
    name: '',
    corporate: '',
    product: '',
    responsible: '',
    frequency: 'Daily',
    db_ip: '',
    db_user: '',
    db_password: '',
    sftp_ip: '',
    sftp_user: '',
    sftp_password: '',
    non_homologated_products_mapping: false,
    homologation_history_mapping: false,
    stock_table_mapping: false,
    email_configuration: false,
    alert_configuration: false,
    approved_emails: ''
  })
  
  const [pendingChanges, setPendingChanges] = useState<Partial<ConfigurationData>>({})
  const [showDBModal, setShowDBModal] = useState(false)
  const [showSFTPModal, setShowSFTPModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')

        return
      }
      setIsAuthenticated(true)
      fetchConfiguration()
    }
    checkAuth()
  }, [router])

  const fetchConfiguration = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }
    try {
      const response = await fetch('http://localhost:8000/api/homologation/configuration/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching configuration:', error)
    }
  }

  const handleChange = (updates: Partial<ConfigurationData>) => {
    setPendingChanges(prev => ({ ...prev, ...updates }))
  }

  const saveConfiguration = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')

      return
    }
    try {
      const response = await fetch('http://localhost:8000/api/homologation/configuration/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...config, ...pendingChanges }),
      })
      const data = await response.json()
      setConfig(data)
      setPendingChanges({})
      toast.success('Configuration saved successfully!')
    } catch (error) {
      console.error('Error saving configuration:', error)
    }
  }

  const toggleBooleanField = (field: keyof ConfigurationData) => {
    const currentValue = pendingChanges[field] ?? config[field]
    handleChange({ [field]: !currentValue })
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className='max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg'>
      <ToastContainer />
      <h1 className='text-2xl font-bold mb-6 text-center'>Product Homologation Configuration</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <InputField
          label="Name"
          value={pendingChanges.name ?? config.name}
          onChange={(value) => handleChange({ name: value })}
          placeholder="Enter Name"
        />
        <InputField
          label="Corporate"
          value={pendingChanges.corporate ?? config.corporate}
          onChange={(value) => handleChange({ corporate: value })}
          placeholder="Enter Corporate"
        />
        <InputField
          label="Product"
          value={pendingChanges.product ?? config.product}
          onChange={(value) => handleChange({ product: value })}
          placeholder="Enter Product"
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <InputField
          label="Responsible"
          value={pendingChanges.responsible ?? config.responsible}
          onChange={(value) => handleChange({ responsible: value })}
          placeholder="Enter Responsible"
        />
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Frequency</label>
          <select
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            value={pendingChanges.frequency ?? config.frequency}
            onChange={e => handleChange({ frequency: e.target.value })}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>
      </div>

      <div className='mb-6'>
        <h2 className='text-lg font-semibold mb-2'>Database Configuration</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          <ConfigButton
            onClick={() => setShowDBModal(true)}
            active={Boolean((pendingChanges.db_ip ?? config.db_ip) && 
                          (pendingChanges.db_user ?? config.db_user) && 
                          (pendingChanges.db_password ?? config.db_password))}
          >
            Configure Database (IP, User, Password)
          </ConfigButton>
          <ConfigButton
            onClick={() => toggleBooleanField('non_homologated_products_mapping')}
            active={pendingChanges.non_homologated_products_mapping ?? config.non_homologated_products_mapping}
          >
            Map Fields for Non-homologated Products
          </ConfigButton>
          <ConfigButton
            onClick={() => toggleBooleanField('homologation_history_mapping')}
            active={pendingChanges.homologation_history_mapping ?? config.homologation_history_mapping}
          >
            Map Fields for Homologation History
          </ConfigButton>
          <ConfigButton
            onClick={() => toggleBooleanField('stock_table_mapping')}
            active={pendingChanges.stock_table_mapping ?? config.stock_table_mapping}
          >
            Map Fields for Stock Table (Master Products)
          </ConfigButton>
        </div>
      </div>

      <div className='mb-6'>
        <h2 className='text-lg font-semibold mb-2'>SFTP Configuration</h2>
        <ConfigButton
          onClick={() => setShowSFTPModal(true)}
          active={Boolean((pendingChanges.sftp_ip ?? config.sftp_ip) && 
                        (pendingChanges.sftp_user ?? config.sftp_user) && 
                        (pendingChanges.sftp_password ?? config.sftp_password))}
        >
          Configure SFTP (IP, User, Password)
        </ConfigButton>
      </div>

      <div className='mb-6'>
        <h2 className='text-lg font-semibold mb-2'>Email Configuration</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
          <ConfigButton
            onClick={() => toggleBooleanField('email_configuration')}
            active={pendingChanges.email_configuration ?? config.email_configuration}
          >
            Configure Email (Receive Excel Files)
          </ConfigButton>
          <ConfigButton
            onClick={() => setShowEmailModal(true)}
            active={Boolean(pendingChanges.approved_emails ?? config.approved_emails)}
          >
            Approved Email Addresses
          </ConfigButton>
        </div>
      </div>

      <div className='mb-6'>
        <h2 className='text-lg font-semibold mb-2'>Alert Configuration</h2>
        <ConfigButton
          onClick={() => toggleBooleanField('alert_configuration')}
          active={pendingChanges.alert_configuration ?? config.alert_configuration}
        >
          Configure Alerts (Products without Homologation)
        </ConfigButton>
      </div>

      <Modal
        show={showDBModal}
        onClose={() => setShowDBModal(false)}
        onSave={(data) => {
          handleChange({
            db_ip: data.ip,
            db_user: data.user,
            db_password: data.password
          })
          setShowDBModal(false)
        }}
        initialData={{
          ip: pendingChanges.db_ip ?? config.db_ip,
          user: pendingChanges.db_user ?? config.db_user,
          password: pendingChanges.db_password ?? config.db_password
        }}
        title="Database Configuration"
      />

      <Modal
        show={showSFTPModal}
        onClose={() => setShowSFTPModal(false)}
        onSave={(data) => {
          handleChange({
            sftp_ip: data.ip,
            sftp_user: data.user,
            sftp_password: data.password
          })
          setShowSFTPModal(false)
        }}
        initialData={{
          ip: pendingChanges.sftp_ip ?? config.sftp_ip,
          user: pendingChanges.sftp_user ?? config.sftp_user,
          password: pendingChanges.sftp_password ?? config.sftp_password
        }}
        title="SFTP Configuration"
      />

      <EmailModal
        show={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSave={(emails) => {
          handleChange({ approved_emails: emails })
          setShowEmailModal(false)
        }}
        initialEmails={pendingChanges.approved_emails ?? config.approved_emails}
      />

      <button
        className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        onClick={saveConfiguration}
      >
        Save Changes
      </button>
    </div>
  )
}

export default function Page() {
  return <HomologationConfigurations />
}
