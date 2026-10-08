import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Category, Service } from '../../types/entities'
import { CategoryCard } from './CategoryCard'
import { SearchBar } from './SearchBar'
import { ServiceCard } from './ServiceCard'
import { ServiceImage } from './ServiceImage'

const service: Service = {
  id: 'svc-1',
  title: 'Pulverização Agrícola',
  description: 'Descrição',
  categoryId: 'cat-spraying',
  providerId: 'prv-1',
  providerName: 'Agro Máquinas Paraná',
  city: 'Santa Helena',
  state: 'PR',
  price: 180,
  priceUnit: 'hour',
  rating: 4.9,
  reviewCount: 128,
  available: true,
  imageUrl: '/spraying.jpg',
}

const category: Category = { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can' }

describe('ServiceCard', () => {
  it('shows the service summary and links to the detail page', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={service} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByText('por Agro Máquinas Paraná')).toBeInTheDocument()
    expect(screen.getByText('Santa Helena - PR')).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s180\/h/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver detalhes de Pulverização Agrícola' })).toHaveAttribute(
      'href',
      '/servicos/svc-1',
    )
  })

  it('marks unavailable services', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={{ ...service, available: false }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Indisponível')).toBeInTheDocument()
  })
})

describe('ServiceImage', () => {
  it('falls back to a placeholder when the image fails', () => {
    render(<ServiceImage src="/broken.jpg" alt="Foto do serviço" />)
    fireEvent.error(screen.getByRole('img', { name: 'Foto do serviço' }))
    expect(screen.getByRole('img', { name: 'Foto do serviço' }).tagName).toBe('DIV')
  })
})

describe('CategoryCard', () => {
  it('links to the services page filtered by slug', () => {
    render(
      <MemoryRouter>
        <CategoryCard category={category} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Pulverização' })).toHaveAttribute('href', '/servicos?category=pulverizacao')
  })
})

describe('SearchBar', () => {
  it('submits trimmed values', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} initialLocation="Cascavel" />)
    await userEvent.type(screen.getByLabelText('Qual serviço você precisa?'), '  colheita ')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledWith({ q: 'colheita', location: 'Cascavel' })
  })

  it('submits with Enter', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    await userEvent.type(screen.getByLabelText('Localização'), 'Toledo{Enter}')
    expect(onSearch).toHaveBeenCalledWith({ q: '', location: 'Toledo' })
  })
})
