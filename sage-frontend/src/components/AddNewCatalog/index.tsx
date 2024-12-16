import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { Upload, X, FileSpreadsheet, Building2, Database, Clock, Settings } from 'lucide-react'
import type { Field } from '@/types/field';
import 'react-datepicker/dist/react-datepicker.css'
import CreatableSelect from 'react-select/creatable'
import axios from 'axios'
import { AxiosError } from 'axios'
import Select from 'react-select'
import type { StylesConfig } from 'react-select'
import type { MultiValue } from 'react-select'
import type { CSSObjectWithLabel } from 'react-select'
import { toast, ToastContainer } from 'react-toastify'
import { useRouter } from 'next/navigation'

import 'react-toastify/dist/ReactToastify.css'

const predefinedTags = [
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'customer', label: 'Customer' },
  { value: 'product', label: 'Product' },
  { value: 'financial', label: 'Financial' }
]


type AddNewCatalogProps = {
  fields: Field[]
  onDefineFields: (shouldUpdate: boolean) => void
}

type User = {
  id: string
  username: string
  email: string
  [key: string]: any
}

type Errors = {
  [key: string]: string
}

type Option = {
  label: string
  value: string | number
}

type FormData = {
  catalogName: string
  tags: string
  corporate: string
  responsibleUser: string | number
  menu: string
  product: string
  domain: string
  description: string
  mandatory: string
  frequency: string
  apiKey: string
  submissionEmail: string
  authorizedEmails: string
  sftpFolder: string
}

interface Tag {
  label: string
  value: string
}

const AddNewCatalog: React.FC<AddNewCatalogProps> = ({ fields, onDefineFields }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [users, setUsers] = useState<{ value: string; label: string; user: User }[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Option | null>(null)

  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [selectedTags, setSelectedTags] = useState<MultiValue<Tag>>([])
  const [formData, setFormData] = useState<FormData>({
    catalogName: '',
    tags: '',
    corporate: '',
    responsibleUser: '', // Can be string or number
    menu: '',
    product: '',
    domain: '',
    description: '',
    mandatory: 'Is Mandatory',
    frequency: 'Daily',
    apiKey: '',
    submissionEmail: '',
    authorizedEmails: '',
    sftpFolder: ''
  })
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    const getUsers = async () => {
      setIsLoadingUsers(true)
      setUserError(null)
      try {
        const fetchedUsers = await fetchUsers(API_URL, token)
        const userOptions = fetchedUsers.map((user: User) => ({
          value: user.id,
          label: `${user.username} (${user.email})`,
          user // Store full user object
        }))
        setUsers(userOptions)
      } catch (error) {
        setUserError('Failed to load users')
        console.error('Error loading users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    getUsers()
  }, [API_URL, token])


  if (!token) {
    // Redirect to login page if access token is not found
    router.push('/login')

    return
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setIconPreview(null)
    }
  }

  const removeIcon = () => {
    setIconPreview(null)
  }

  // const handleDefineFields = () => {
  //   onDefineFields({
  //     ...formData,
  //     icon: iconPreview,
  //     deadline: deadline
  //   })
  // }

  const handleTagChange = (newValue: MultiValue<Tag>) => {
    setSelectedTags(newValue as Tag[])
    setFormData(prev => ({
      ...prev,
      tags: newValue.map(tag => tag.value).join(',')
    }))
  }

  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200'

    const customStyles: StylesConfig<Tag, true> = {
      control: (base: CSSObjectWithLabel, state: any): CSSObjectWithLabel => ({
        ...base,
        minHeight: '42px',
        borderColor: state.isFocused ? '#60A5FA' : '#D1D5DB',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(96, 165, 250, 0.2)' : 'none',
        '&:hover': {
          borderColor: '#60A5FA'
        }
      }),
      multiValue: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
        ...base,
        backgroundColor: '#EFF6FF',
        borderRadius: '6px',
        padding: '2px'
      }),
      multiValueLabel: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
        ...base,
        color: '#2563EB',
        fontSize: '0.875rem'
      }),
      multiValueRemove: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
        ...base,
        color: '#2563EB',
        cursor: 'pointer',
      })
    }

  // Reset form
  const resetForm = () => {
    setFormData({
      catalogName: '',
      tags: '',
      corporate: '',
      responsibleUser: '',
      menu: '',
      product: '',
      domain: '',
      description: '',
      mandatory: 'Is Mandatory',
      frequency: 'Daily',
      apiKey: '',
      submissionEmail: '',
      authorizedEmails: '',
      sftpFolder: ''
    })
    setSelectedTags([])
    setIconPreview(null)
    setDeadline(null)
    setErrors([])
  }

  const handleDefineFields = async () => {
    try {
      setIsLoading(true)
      setErrors([])

      // First create the schema to get the ID
      // const productId = await handleSchemaSubmit()

      onDefineFields(true)

      // Then call the onDefineFields with the product ID
      // onDefineFields({
      //   ...formData,
      //   // productId,
      //   icon: iconPreview,
      //   deadline: deadline,
      //   tags: selectedTags
      // })
    } catch (err) {
      setErrors(prevErrors => [...prevErrors, 'Failed to define schema fields. Please try again.'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errorsInForm = validateForm()

    if (Object.keys(errorsInForm).length > 0) {
      const errorMessages = Object.values(errorsInForm).join('\n')
      setErrors(prevErrors => [...prevErrors, `Please fix the form errors before submitting:\n${errorMessages}`])
      console.log(errorsInForm)

      return
    }

    try {
      setIsLoading(true)
      setErrors([])

      // First, create the schema and get productId
      const productId = await handleSchemaSubmit()
      await handleFieldsSubmit(productId)

      // Prepare catalog data as an object (not FormData)
      const catalogData = {
        product_id: productId,
        name: formData.catalogName,
        corporate: formData.corporate,
        responsible_user_id: formData.responsibleUser,
        menu: formData.menu,
        mandatory: formData.mandatory,
        frequency: formData.frequency,
        api_key: formData.apiKey,
        submission_email: formData.submissionEmail,
        authorized_emails_list: formData.authorizedEmails.split('\n').map(email => email.trim()), // Array of emails
        tags: formData.tags.split(',').map(tag => tag.trim()), // Array of tags
        deadline:
          deadline && deadline instanceof Date && !isNaN(deadline.getTime())
            ? deadline.toISOString().split('T')[0]
            : '',
        sftp_folder: formData.sftpFolder,
        ...(iconPreview && { icon: iconPreview })
      }

      console.log(catalogData)

      // Send POST request with JSON payload
      const response = await axios.post('http://127.0.0.1:8000/api/catalogs/', catalogData, {
        headers: {
          'Content-Type': 'application/json', // Set content type to JSON
          Authorization: `Bearer ${token}`
        }
      })
      if (response.status === 201) {
        // Check if the status is 201 (created)
        toast.success('Catalog created successfully!', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined
        })
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        // Safely access the response data here
        setErrors(prevErrors => [
          ...prevErrors,
          err.response?.data?.message || 'Failed to create catalog. Please try again.'
        ])
      } else {
        // Handle unexpected error types here
        setErrors(prevErrors => [...prevErrors, 'An unexpected error occurred. Please try again.'])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchemaSubmit = async () => {
    try {
      setIsLoading(true)

      const schemaData = {
        schema_name: formData.product,
        domain: formData.domain,
        description: formData.description
      }
      const url = 'http://127.0.0.1:8000/api/products/'

      const response = await axios.post(url, schemaData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      return response.data.id
    } catch (err) {
      setErrors(prevErrors => [...prevErrors, 'Failed to create schema. Please try again.'])
      throw err
    }
  }

  const handleFieldsSubmit = async (productId: string) => {
    const url = `http://127.0.0.1:8000/api/product/${productId}/field/`

    try {
      console.log(`Product id: : ${productId}`)

      // Create a set to track names
      const fieldNames = new Set()

      for (const field of fields) {
        // Check if the field name is already in the set
        if (fieldNames.has(field.name)) {
          console.error(`Field name "${field.name}" is not unique.`)
          setErrors(prevErrors => [...prevErrors, `Field name "${field.name}" is not unique.`])
          throw new Error(`Field name "${field.name}" is not unique.`)
        }

        // Add the field name to the set
        fieldNames.add(field.name)

        const fieldPayload = {
          name: field.name,
          field_type: field.type.toLowerCase(),
          length: field.length,
          is_null: field.null,
          is_primary_key: field.primaryKey
        }
        console.log(fieldPayload)

        // Post the field to the API and get the response
        const response = await axios.post(url, fieldPayload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        // Save the returned field ID in the corresponding field
        field.id = response.data.id
        console.log(`Field created with ID: ${field.id}`)

        try {
          const response2 = await handleValidationRuleSubmit(productId, field)
          console.log(`Validation rule created with id: ${response2.data.id}`)
        } catch (validationError) {
          console.error(`Validation rule creation failed for field ID: ${field.id}`, validationError)
          setErrors(prevErrors => [
            ...prevErrors,
            `Validation rule creation failed for field ID: ${field.id}` + validationError
          ])
        }
      }
    } catch (err) {
      console.error('Failed to create product fields:', err)
      setErrors(prevErrors => [...prevErrors, 'Failed to create product fields.'])
      throw new Error('Error creating fields')
    }
  }

  const handleValidationRuleSubmit = async (productId: string, field: Field) => {
    const url = `http://127.0.0.1:8000/api/product/${productId}/field/${field.id}/validation-rule/`

    try {
      const validationPayload = {
        is_unique: field.isUnique || false,
        is_picklist: field.isPicklist || false,
        picklist_values: field.picklistValues || '',
        has_min_max: !!(field.minValue || field.maxValue),
        min_value: field.minValue || null,
        max_value: field.maxValue || null,
        is_email_format: field.emailFormat || false,
        is_phone_format: field.phoneFormat || false,
        has_max_decimal: !!field.decimalPlaces,
        max_decimal_places: field.decimalPlaces || null,
        has_date_format: field.hasDateFormat || false,
        date_format: field.dateFormat || '',
        has_max_days_of_age: field.hasMaxDaysOfAge || false,
        max_days_of_age: field.maxDaysOfAge || null,
        custom_validation: field.customValidation || ''
      }

      console.log(validationPayload)
      const response = await axios.post(url, validationPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(`Validation rule created successfully for field ID: ${field.id}`)

      return response
    } catch (err) {
      console.error(`Failed to create validation rule for field ID: ${field.id}`, err)
      setErrors(prevErrors => [...prevErrors, `Failed to create validation rule for field ID: ${field.id}` + err])
      throw new Error('Error creating validation rule')
    }
  }

  const validateForm = () => {
    const errors: Errors = {}

    if (!formData.catalogName.trim()) {
      errors.catalogName = 'Catalog name is required'
    }

    if (!formData.product.trim()) {
      errors.product = 'Schema name is required'
    }

    if (!formData.domain.trim()) {
      errors.domain = 'Domain is required'
    }

    if (formData.submissionEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.submissionEmail)) {
      errors.submissionEmail = 'Invalid email format'
    }

    // Validate authorized emails
    if (formData.authorizedEmails) {
      const emails = formData.authorizedEmails.split('\n')
      const invalidEmails = emails.filter(email => email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      if (invalidEmails.length > 0) {
        errors.authorizedEmails = 'Some emails are invalid'
      }
    }

    // Validate deadline
    if (!deadline) {
      errors.deadline = 'Deadline is required'
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set time to midnight for accurate comparison

      if (deadline <= today) {
        errors.deadline = 'Deadline must be a future date'
      }
    }

    return errors
  }

  const fetchUsers = async (API_URL: string, token: string | null): Promise<User[]> => {
    try {
      const response = await axios.get<{ users: User[] }>(`${API_URL}/api/auth/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data.users // Return the users array
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users') // Throw error for consistent error handling
    }
  }

  const handleUserChange = (newValue: unknown) => {
    const selectedOption = newValue as Option;  // Type-cast newValue to Option
    setSelectedUser(selectedOption);
  
    // Update form data
    setFormData(prev => ({
      ...prev,
      responsibleUser: selectedOption ? selectedOption.value : ''
    }));
  }

  const userSelectStyles: StylesConfig = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderColor: state.isFocused ? '#60A5FA' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(96, 165, 250, 0.2)' : 'none',
      '&:hover': {
        borderColor: '#60A5FA'
      }
    }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      backgroundColor: isSelected ? '#3B82F6' : isFocused ? '#DBEAFE' : 'transparent',
      color: isSelected ? 'white' : '#374151',
      ':active': {
        backgroundColor: '#2563EB'
      }
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8'>
      <ToastContainer />
      <div className='max-w-7xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden'>
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center gap-3'>
          <FileSpreadsheet className='w-8 h-8 text-white' />
          <h1 className='text-2xl font-bold text-white'>Add New Catalog</h1>
        </div>

        {/* Add error message display */}
        {/* {error && <div className='p-4 mb-4 text-red-700 bg-red-100 rounded-lg'>{error}</div>} */}
        {errors.length > 0 && (
          <div className='p-4 mb-4 text-red-700 bg-red-100 rounded-lg'>
            {errors.map((error, index) => (
              <div key={index} className='error-message'>
                {error}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className='p-6 space-y-8'>
          {/* Catalog Information */}
          <div className='space-y-6'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-200'>
              <Building2 className='w-6 h-6 text-blue-500' />
              <h2 className='text-lg font-semibold text-blue-600'>Catalog Information</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Catalog Name</label>
                <input
                  type='text'
                  name='catalogName'
                  value={formData.catalogName}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Icon</label>
                <div className='mt-1 flex items-center'>
                  {iconPreview ? (
                    <div className='relative inline-block'>
                      <img
                        src={iconPreview}
                        alt='Icon preview'
                        className='h-16 w-16 object-cover rounded-lg shadow-md'
                      />
                      <button
                        type='button'
                        onClick={removeIcon}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className='flex items-center justify-center h-16 w-16 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50'>
                      <Upload className='h-8 w-8 text-blue-400' />
                    </div>
                  )}
                  <label
                    htmlFor='icon-upload'
                    className='ml-5 bg-blue-500 py-2 px-4 rounded-lg shadow-md text-white text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer'
                  >
                    Select Image
                  </label>
                  <input
                    id='icon-upload'
                    name='icon'
                    type='file'
                    className='sr-only'
                    accept='image/*'
                    onChange={handleIconChange}
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Tags</label>
                <CreatableSelect
                  isMulti
                  required
                  options={predefinedTags}
                  value={selectedTags}
                  onChange={handleTagChange}
                  styles={customStyles}
                  placeholder='Select or create tags...'
                  className='react-select-container'
                  classNamePrefix='react-select'
                  theme={theme => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: '#3B82F6',
                      primary25: '#DBEAFE',
                      primary50: '#BFDBFE'
                    }
                  })}
                />
                <p className='mt-1 text-sm text-gray-500'>
                  You can select existing tags or create new ones by typing and pressing enter
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Corporate</label>
                <input
                  type='text'
                  name='corporate'
                  value={formData.corporate}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Responsible User</label>
                <Select
                  value={selectedUser}
                  onChange={handleUserChange}
                  options={users}
                  isLoading={isLoadingUsers}
                  isDisabled={isLoadingUsers}
                  styles={userSelectStyles}
                  placeholder='Select responsible user...'
                  noOptionsMessage={() => userError || 'No users available'}
                  isClearable
                  className='react-select-container'
                  classNamePrefix='react-select'
                  required
                />
                {userError && <p className='mt-1 text-sm text-red-600'>{userError}</p>}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Menu</label>
                <input
                  type='text'
                  name='menu'
                  value={formData.menu}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
            </div>
          </div>

          {/* Schema Information */}
          <div className='space-y-6'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-200'>
              <Database className='w-6 h-6 text-purple-500' />
              <h2 className='text-lg font-semibold text-purple-600'>Schema Information</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Schema Name</label>
                <input
                  type='text'
                  name='product'
                  value={formData.product}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Domain</label>
                <input
                  type='text'
                  name='domain'
                  value={formData.domain}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className='space-y-6'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-200'>
              <Clock className='w-6 h-6 text-green-500' />
              <h2 className='text-lg font-semibold text-green-600'>Submission Details</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Mandatory</label>
                <select
                  name='mandatory'
                  value={formData.mandatory}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  <option>Is Mandatory</option>
                  <option>Not Mandatory</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Frequency</label>
                <select
                  name='frequency'
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Deadline</label>
                <DatePicker
                  selected={deadline}
                  onChange={(date: any) => setDeadline(date)}
                  className={inputClasses}
                  placeholderText='Select deadline'
                  dateFormat='dd/MM/yyyy'
                />
              </div>
            </div>
          </div>

          {/* API & Submission Settings */}
          <div className='space-y-6'>
            <div className='flex items-center gap-2 pb-2 border-b border-gray-200'>
              <Settings className='w-6 h-6 text-orange-500' />
              <h2 className='text-lg font-semibold text-orange-600'>API & Submission Settings</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>API Key</label>
                <input
                  type='text'
                  name='apiKey'
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Submission Email</label>
                <input
                  type='email'
                  name='submissionEmail'
                  value={formData.submissionEmail}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Authorized Emails</label>
                <textarea
                  name='authorizedEmails'
                  value={formData.authorizedEmails}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                  required
                ></textarea>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>SFTP Folder</label>
                <input
                  type='text'
                  name='sftpFolder'
                  value={formData.sftpFolder}
                  onChange={handleInputChange}
                  className={inputClasses}
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex justify-start space-x-4 pt-6'>
            <button
              type='button'
              onClick={handleDefineFields}
              disabled={isLoading}
              className='px-6 py-3 rounded-lg shadow-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors duration-200 disabled:opacity-50'
            >
              {isLoading ? 'Processing...' : 'Define Schema Fields'}
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-6 py-3 rounded-lg shadow-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50'
            >
              {isLoading ? 'Saving...' : 'Save Catalog'}
            </button>
            <button
              type='button'
              onClick={resetForm}
              disabled={isLoading}
              className='px-6 py-3 rounded-lg shadow-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50'
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNewCatalog
