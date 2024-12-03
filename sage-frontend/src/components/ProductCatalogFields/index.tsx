import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import FieldDefinePopup from '@components/FieldDefinePopup'

const ProductCatalogFields = ({ fields, setFields, onClose }) => {
  const [showDefinePopup, setShowDefinePopup] = useState(false)
  const [currentField, setCurrentField] = useState(null)

  const handleDefine = field => {
    setCurrentField(field)
    setShowDefinePopup(true)
  }

  const handleSave = updatedField => {
    setFields(fields.map(f => (f.id === updatedField.id ? updatedField : f)))
    setShowDefinePopup(false)
  }

  const handleAddField = () => {
    const newField = {
      id: fields.length + 1,
      name: 'New Field',
      type: 'VARCHAR',
      length: 50,
      null: false,
      primaryKey: false
    }
    setFields([...fields, newField])
    handleDefine(newField)
  }

  return (
    <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto'>
      <div className='p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-bold text-blue-600'>Fields for Schema</h1>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            <X size={24} />
          </button>
        </div>

        <table className='min-w-full bg-white border border-gray-300'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='py-2 px-4 border-b text-left'>Name</th>
              <th className='py-2 px-4 border-b text-left'>Type</th>
              <th className='py-2 px-4 border-b text-center'>Length</th>
              <th className='py-2 px-4 border-b text-center'>Null</th>
              <th className='py-2 px-4 border-b text-center'>Primary Key (PK)</th>
              <th className='py-2 px-4 border-b text-center'>Validations</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field.id} className='border-b hover:bg-gray-50'>
                <td className='py-2 px-4'>{field.name}</td>
                <td className='py-2 px-4'>{field.type}</td>
                <td className='py-2 px-4 text-center'>{field.length}</td>
                <td className='py-2 px-4 text-center'>
                  <input
                    type='checkbox'
                    checked={!(field.isRequired || field.isPrimaryKey)}
                    readOnly
                    className='form-checkbox h-5 w-5 text-blue-600'
                  />
                </td>
                <td className='py-2 px-4 text-center'>
                  <input
                    type='checkbox'
                    checked={field.isPrimaryKey}
                    readOnly
                    className='form-checkbox h-5 w-5 text-blue-600'
                  />
                </td>
                <td className='py-2 px-4 text-center'>
                  <button
                    onClick={() => handleDefine(field)}
                    className='bg-blue-500 text-white py-1 px-3 rounded-md text-xs hover:bg-blue-600'
                  >
                    Define
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={handleAddField}
          className='mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center'
        >
          <Plus size={20} className='mr-2' />
          Add Field
        </button>
      </div>

      {showDefinePopup && (
        <FieldDefinePopup field={currentField} onClose={() => setShowDefinePopup(false)} onSave={handleSave} />
      )}
    </div>
  )
}

export default ProductCatalogFields
