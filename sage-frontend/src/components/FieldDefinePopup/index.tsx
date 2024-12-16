import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Field } from '@/types/field'

interface FieldDefinePopupProps {
  field: Field
  onClose: () => void
  onSave: (fieldData: Field) => void
}

const FieldDefinePopup: React.FC<FieldDefinePopupProps> = ({ field, onClose, onSave }) => {
  const [fieldData, setFieldData] = useState<Field>(field)

  useEffect(() => {
    setFieldData(field)
  }, [field])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFieldData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(fieldData)
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
      <div className='bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold'>Define Field: {fieldData.name}</h2>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Name</label>
            <input
              type='text'
              name='name'
              value={fieldData.name}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Type</label>
            <select
              name='type'
              value={fieldData.type}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='VARCHAR'>VARCHAR</option>
              <option value='INT'>INT</option>
              <option value='DECIMAL'>DECIMAL</option>
              <option value='DATE'>DATE</option>
              <option value='BOOLEAN'>BOOLEAN</option>
            </select>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center'>
              <input
                type='checkbox'
                name='isPrimaryKey'
                checked={fieldData.isPrimaryKey}
                onChange={handleChange}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='ml-2 block text-sm text-gray-900'>Primary Key</label>
            </div>
            <div className='flex items-center'>
              <input
                type='checkbox'
                name='isRequired'
                checked={fieldData.isRequired}
                onChange={handleChange}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='ml-2 block text-sm text-gray-900'>Required</label>
            </div>
            <div className='flex items-center'>
              <input
                type='checkbox'
                name='isUnique'
                checked={fieldData.isUnique}
                onChange={handleChange}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='ml-2 block text-sm text-gray-900'>Unique</label>
            </div>
          </div>
          {fieldData.type === 'VARCHAR' && (
            <div>
              <label className='block text-sm font-medium text-gray-700'>Length</label>
              <input
                type='number'
                name='length'
                value={fieldData.length}
                onChange={handleChange}
                className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
              <div className='flex items-center space-x-4 mt-4'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    name='phoneFormat'
                    checked={fieldData.phoneFormat}
                    onChange={handleChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='ml-2 block text-sm text-gray-900'>Phone Format</label>
                </div>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    name='emailFormat'
                    checked={fieldData.emailFormat}
                    onChange={handleChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label className='ml-2 block text-sm text-gray-900'>Email Format</label>
                </div>
              </div>
            </div>
          )}
          {(fieldData.type === 'INT' || fieldData.type === 'DECIMAL') && (
            <div>
              <div className='flex items-center space-x-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Min</label>
                  <input
                    type='number'
                    name='minValue'
                    value={fieldData.minValue ?? ''}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Max</label>
                  <input
                    type='number'
                    name='maxValue'
                    value={fieldData.maxValue ?? ''}
                    onChange={handleChange}
                    className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>
            </div>
          )}
          {fieldData.type === 'DECIMAL' && (
            <div>
              <label className='block text-sm font-medium text-gray-700'>Decimal Places</label>
              <input
                type='number'
                name='decimalPlaces'
                value={fieldData.decimalPlaces ?? ''}
                onChange={handleChange}
                className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          )}

          {fieldData.type === 'DATE' && (
            <div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Date Validation</label>
                <select
                  name='dateValidation'
                  value={fieldData.dateValidation ?? ''}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='any'>Any Date</option>
                  <option value='past'>Past Dates Only</option>
                  <option value='future'>Future Dates Only</option>
                  <option value='custom'>Custom Range</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Date Format</label>
                <select
                  name='dateFormat'
                  value={fieldData.dateFormat ?? ''}
                  onChange={handleChange}
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value=''>Select Date Format</option>
                  <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                  <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
                  <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
                  <option value='MM-DD-YYYY'>MM-DD-YYYY</option>
                  <option value='DD-MM-YYYY'>DD-MM-YYYY</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className='block text-sm font-medium text-gray-700'>Picklist Values</label>
            <input
              type='text'
              name='picklist_values'
              value={fieldData.picklist_values ?? ''}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Custom Validation</label>
            <input
              type='text'
              name='customValidation'
              value={fieldData.customValidation}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
          <div className='mt-4 flex justify-end space-x-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
            >
              Cancel
            </button>
            <button type='submit' className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FieldDefinePopup
