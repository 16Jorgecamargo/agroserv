import { MapPin, Search, type LucideIcon } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export interface SearchValues {
  q: string
  location: string
}

interface SearchBarProps {
  initialQuery?: string
  initialLocation?: string
  onSearch: (values: SearchValues) => void
  variant?: 'compact' | 'hero'
  className?: string
}

interface HeroFieldProps {
  label: string
  placeholder: string
  icon: LucideIcon
  value: string
  onChange: (value: string) => void
  className?: string
}

function HeroField({ label, placeholder, icon: Icon, value, onChange, className }: HeroFieldProps) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'group/field flex cursor-text items-center gap-3.5 rounded-[20px] px-5 py-3.5 transition-colors duration-300 hover:bg-surface-muted/60 focus-within:bg-primary-soft/70 hover:focus-within:bg-primary-soft/70 sm:rounded-full sm:px-6',
        className,
      )}
    >
      <Icon
        className="size-5 shrink-0 text-text-muted transition-[color,transform] duration-300 group-focus-within/field:scale-110 group-focus-within/field:text-primary"
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-text">{label}</span>
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="mt-0.5 block w-full truncate bg-transparent text-base text-text placeholder:text-text-muted/80 focus:outline-none focus-visible:outline-none"
        />
      </span>
    </label>
  )
}

export function SearchBar({ initialQuery = '', initialLocation = '', onSearch, variant = 'compact', className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch({ q: query.trim(), location: location.trim() })
  }

  if (variant === 'hero') {
    return (
      <form
        role="search"
        onSubmit={handleSubmit}
        className={cn(
          'grid gap-1 rounded-[28px] border border-border bg-surface p-2 shadow-search transition-[border-color,box-shadow] duration-300 focus-within:border-primary/40 sm:grid-cols-[1.25fr_auto_1fr_auto] sm:items-center sm:rounded-full',
          className,
        )}
      >
        <HeroField
          label="O que você procura?"
          placeholder="Ex.: Pulverização, colheita, plantio..."
          icon={Search}
          value={query}
          onChange={setQuery}
        />
        <span className="mx-5 h-px bg-border sm:mx-0 sm:h-9 sm:w-px" aria-hidden />
        <HeroField label="Onde?" placeholder="Ex.: Santa Helena - PR" icon={MapPin} value={location} onChange={setLocation} />
        <button
          type="submit"
          className="group/submit mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-primary-strong active:scale-[0.97] sm:mt-0"
        >
          <Search className="size-4 transition-transform duration-300 group-hover/submit:scale-110" aria-hidden />
          Pesquisar
        </button>
      </form>
    )
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'grid gap-1 rounded-card border border-border bg-surface p-2 shadow-card sm:grid-cols-[1.3fr_1fr_auto] sm:items-center sm:divide-x sm:divide-border',
        className,
      )}
    >
      <Input
        label="Qual serviço você precisa?"
        hideLabel
        variant="bare"
        icon={Search}
        placeholder="Qual serviço você precisa?"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        containerClassName="sm:pr-1"
      />
      <Input
        label="Localização"
        hideLabel
        variant="bare"
        icon={MapPin}
        placeholder="Localização"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        containerClassName="border-t border-border pt-1 sm:border-t-0 sm:px-1 sm:pt-0"
      />
      <div className="sm:pl-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Search className="size-4" aria-hidden />
          Buscar
        </Button>
      </div>
    </form>
  )
}
