import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { saveSession } from '../../utils/storage'
import { users } from '../../data/users'
import { ServiceImage } from '../domain/ServiceImage'
import { FileUploadField, type UploadedFile } from './FileUploadField'

function Harness({ imagesOnly = false }: { imagesOnly?: boolean }) {
  const [value, setValue] = useState<UploadedFile | null>(null)
  return <FileUploadField label="Documento" value={value} onChange={setValue} purpose="verification" imagesOnly={imagesOnly} />
}

describe('FileUploadField', () => {
  it('uploads a PDF, shows its name and removes it', async () => {
    saveSession('mock.prv-1', users.find((user) => user.id === 'prv-1') ?? users[0])
    render(<Harness />)

    await userEvent.upload(screen.getByLabelText('Documento'), new File(['%PDF-1.4'], 'contrato.pdf', { type: 'application/pdf' }))

    expect(await screen.findByText('contrato.pdf')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover contrato.pdf' }))
    expect(screen.queryByText('contrato.pdf')).not.toBeInTheDocument()
  })

  it('explains unsupported files', async () => {
    saveSession('mock.prv-1', users[0])
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness imagesOnly />)

    await user.upload(screen.getByLabelText('Documento'), new File(['x'], 'nota.pdf', { type: 'application/pdf' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Envie uma imagem JPG, PNG ou WEBP.')
  })
})

describe('ServiceImage', () => {
  it('shows the broken image icon when a mock file is missing', async () => {
    render(<ServiceImage src="mockfile:upl-missing" alt="Foto ausente" className="size-10" />)

    const image = await screen.findByRole('img', { name: 'Foto ausente' })
    expect(image.tagName).toBe('DIV')
    expect(image).not.toHaveAttribute('aria-busy')
  })
})
