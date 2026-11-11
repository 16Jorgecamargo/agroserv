import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'
import { ConfirmDialog } from './ConfirmDialog'
import { DatePicker } from './DatePicker'
import { FileInput } from './FileInput'
import { Modal } from './Modal'
import { Select } from './Select'
import { Tabs } from './Tabs'
import { Textarea } from './Textarea'
import { ToastProvider, useToast } from './ToastProvider'

describe('form components', () => {
  it('associates labels and validation messages with fields', () => {
    render(
      <>
        <Textarea label="Descrição" error="Informe a descrição." />
        <Select label="Categoria" error="Selecione uma categoria.">
          <option value="">Selecione</option>
        </Select>
        <Checkbox label="Aceito os termos" error="Aceite os termos." />
        <DatePicker label="Data" error="Escolha uma data." />
        <FileInput label="Documento" error="Selecione um documento." />
      </>,
    )

    for (const [label, error] of [
      ['Descrição', 'Informe a descrição.'],
      ['Categoria', 'Selecione uma categoria.'],
      ['Aceito os termos', 'Aceite os termos.'],
      ['Data', 'Escolha uma data.'],
      ['Documento', 'Selecione um documento.'],
    ]) {
      const field = screen.getByLabelText(label)
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(field).toHaveAccessibleDescription(error)
    }
  })

  it('rejects a disabled date', () => {
    const onChange = vi.fn()

    render(
      <DatePicker
        label="Data"
        disabledDates={['2026-11-20']}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-11-20' },
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects tabs with the keyboard and renders the active panel', async () => {
    render(
      <Tabs
        tabs={[
          { id: 'profile', label: 'Perfil', content: <p>Dados do perfil</p> },
          { id: 'settings', label: 'Configurações', content: <p>Preferências</p> },
        ]}
      />,
    )

    const profileTab = screen.getByRole('tab', { name: 'Perfil' })
    profileTab.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Configurações' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Preferências')
  })
})

describe('Modal', () => {
  it('traps focus and closes with Escape', async () => {
    const onClose = vi.fn()

    render(
      <Modal isOpen onClose={onClose} title="Detalhes">
        <button type="button">Primeiro botão</button>
        <button type="button">Último botão</button>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog')
    const buttons = within(dialog).getAllByRole('button')
    buttons[buttons.length - 1].focus()
    await userEvent.keyboard('{Tab}')

    expect(buttons[0]).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn()

    render(
      <Modal isOpen onClose={onClose} title="Detalhes">
        <p>Conteúdo</p>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement
    if (!backdrop) throw new Error('Modal backdrop not found')

    fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ConfirmDialog', () => {
  it('disables confirmation until a required reason is entered', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Excluir item"
        description="Confirme a exclusão."
        reasonRequired
      />,
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirmButton).toBeDisabled()

    await user.type(screen.getByLabelText('Motivo (obrigatório)'), 'Duplicado')
    expect(confirmButton).toBeEnabled()

    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith('Duplicado')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a success toast and dismisses it after four seconds', () => {
    vi.useFakeTimers()

    function ToastTrigger() {
      const toast = useToast()

      return (
        <button type="button" onClick={() => toast.success('Salvo com sucesso.')}>
          Mostrar aviso
        </button>
      )
    }

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar aviso' }))
    expect(screen.getByRole('status')).toHaveTextContent('Salvo com sucesso.')

    act(() => {
      vi.advanceTimersByTime(3999)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('allows closing an error toast manually', () => {
    function ToastTrigger() {
      const toast = useToast()

      return (
        <button type="button" onClick={() => toast.error('Não foi possível salvar.')}>
          Mostrar erro
        </button>
      )
    }

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar erro' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.')

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})