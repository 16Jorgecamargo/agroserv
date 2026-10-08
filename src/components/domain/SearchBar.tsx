import { MapPin, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
  className?: string
}

export function SearchBar({ initialQuery = '', initialLocation = '', onSearch, className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch({ q: query.trim(), location: location.trim() })
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
