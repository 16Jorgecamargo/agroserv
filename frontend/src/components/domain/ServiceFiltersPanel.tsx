import { useState } from 'react'
import type { PriceUnit } from '../../types/entities'
import { getTodayInBrasilia } from '../../utils/date'
import { priceUnitOptions } from '../../utils/serviceStatus'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export interface AdvancedFilterValues {
  priceUnit: PriceUnit | ''
  minPrice: string
  maxPrice: string
  minRating: string
  verified: boolean
  date: string
}

export type AdvancedFilterKey = keyof AdvancedFilterValues

interface ServiceFiltersPanelProps {
  values: AdvancedFilterValues
  onChange: (next: Partial<Record<AdvancedFilterKey, string>>) => void
  idPrefix: string
}

const ratingOptions = [
  { value: '3', label: '3 estrelas ou mais' },
  { value: '4', label: '4 estrelas ou mais' },
  { value: '4.5', label: '4,5 estrelas ou mais' },
]

function PriceInput({ id, label, value, onCommit }: { id: string; label: string; value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  return (
    <Input
      id={id}
      label={label}
      type="number"
      inputMode="decimal"
      min={0}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onCommit(draft)
        }
      }}
    />
  )
}

export function ServiceFiltersPanel({ values, onChange, idPrefix }: ServiceFiltersPanelProps) {
  return (
    <div className="space-y-5">
      <Select
        id={`${idPrefix}-unit`}
        label="Unidade de cobrança"
        value={values.priceUnit}
        onChange={(event) => onChange({ priceUnit: event.target.value, minPrice: '', maxPrice: '' })}
      >
        <option value="">Todas</option>
        {priceUnitOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {values.priceUnit ? (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">Faixa de preço (R$)</legend>
          <div className="grid grid-cols-2 gap-3" key={values.priceUnit}>
            <PriceInput id={`${idPrefix}-min`} label="Preço mínimo" value={values.minPrice} onCommit={(value) => onChange({ minPrice: value })} />
            <PriceInput id={`${idPrefix}-max`} label="Preço máximo" value={values.maxPrice} onCommit={(value) => onChange({ maxPrice: value })} />
          </div>
        </fieldset>
      ) : (
        <p className="text-xs text-text-muted">Escolha a unidade para filtrar por preço.</p>
      )}
      <Select id={`${idPrefix}-rating`} label="Avaliação mínima" value={values.minRating} onChange={(event) => onChange({ minRating: event.target.value })}>
        <option value="">Qualquer nota</option>
        {ratingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        id={`${idPrefix}-date`}
        label="Disponível em"
        type="date"
        min={getTodayInBrasilia()}
        value={values.date}
        onChange={(event) => onChange({ date: event.target.value })}
      />
      <Checkbox
        id={`${idPrefix}-verified`}
        label="Só prestadores verificados"
        checked={values.verified}
        onChange={(event) => onChange({ verified: event.target.checked ? 'true' : '' })}
      />
    </div>
  )
}
