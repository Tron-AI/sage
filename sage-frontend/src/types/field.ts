export type Field = {
  id: string | number
  name: string
  length: number
  null?: boolean
  type: string
  primaryKey?: boolean
  isUnique?: boolean
  isPicklist?: boolean
  picklistValues?: string
  minValue?: number | null
  maxValue?: number | null
  emailFormat?: boolean
  phoneFormat?: boolean
  decimalPlaces?: number | null
  hasDateFormat?: boolean
  dateFormat?: string
  hasMaxDaysOfAge?: boolean
  maxDaysOfAge?: number | null
  isPrimaryKey?: boolean
  customValidation?: string
  isRequired?: boolean
  dateValidation?: string | null
  picklist_values?: string | null
  fieldId?: string | null
  validationRuleId?: string | null
}
