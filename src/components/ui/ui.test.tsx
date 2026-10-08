import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'
import { Breadcrumbs } from './Breadcrumbs'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { FilterChip } from './FilterChip'
import { Input } from './Input'
import { Rating } from './Rating'
import { StatusBadge } from './StatusBadge'

describe('UI primitives', () => {
  it('disables the button while loading', () => {
    render(<Button isLoading>Entrar</Button>)
    const button = screen.getByRole('button', { name: 'Entrar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('links the input label and error message', () => {
    render(<Input label="E-mail" error="Informe seu e-mail." />)
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe seu e-mail.')
  })

  it('renders status labels in Portuguese', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('gives the rating an accessible name', () => {
    render(<Rating value={4.9} count={128} />)
    expect(screen.getByRole('img', { name: 'Avaliação 4,9 de 5, 128 avaliações' })).toBeInTheDocument()
  })

  it('renders empty state with action', () => {
    render(<EmptyState icon={Inbox} title="Nada aqui" description="Tente outra busca." action={<button>Limpar</button>} />)
    expect(screen.getByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument()
  })

  it('calls onRetry from the error state', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('exposes pressed state on filter chips', () => {
    render(<FilterChip isActive>Todas</FilterChip>)
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses alert role for danger alerts', () => {
    render(<Alert tone="danger">Falhou</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
  })

  it('marks the last breadcrumb as current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Serviços' }]} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Serviços')).toHaveAttribute('aria-current', 'page')
  })
})
