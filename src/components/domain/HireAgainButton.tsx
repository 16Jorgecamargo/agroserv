import { RotateCcw, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import { categoryService } from '../../services/categoryService'
import { serviceService } from '../../services/serviceService'
import type { Service, ServiceRequestDetail } from '../../types/entities'
import { Button } from '../ui/Button'
import { buttonClasses } from '../ui/buttonClasses'
import { Modal } from '../ui/Modal'
import { RequestServiceForm } from './RequestServiceForm'

type HireState = { kind: 'form'; service: Service } | { kind: 'unavailable'; similarPath: string } | null

export function HireAgainButton({ request }: { request: ServiceRequestDetail }) {
  const [state, setState] = useState<HireState>(null)
  const [isChecking, setIsChecking] = useState(false)

  async function similarPath(): Promise<string> {
    try {
      const categories = await categoryService.list()
      const slug = categories.find((category) => category.id === request.service.categoryId)?.slug
      return slug ? `${paths.services}?category=${encodeURIComponent(slug)}` : paths.services
    } catch {
      return paths.services
    }
  }

  async function open() {
    if (isChecking) return
    setIsChecking(true)
    try {
      const service = request.serviceRemoved ? null : await serviceService.getById(request.serviceId).catch(() => null)
      if (service && service.available) setState({ kind: 'form', service })
      else setState({ kind: 'unavailable', similarPath: await similarPath() })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <>
      <Button className="w-full" isLoading={isChecking} onClick={() => void open()}>
        <RotateCcw className="size-4" aria-hidden />
        Contratar de novo
      </Button>
      <Modal
        isOpen={state?.kind === 'form'}
        onClose={() => setState(null)}
        title="Contratar de novo"
        description={request.serviceTitle}
        closeOnBackdrop={false}
      >
        {state?.kind === 'form' && <RequestServiceForm service={state.service} initialPropertyId={request.propertyId} onCancel={() => setState(null)} />}
      </Modal>
      <Modal isOpen={state?.kind === 'unavailable'} onClose={() => setState(null)} title="Serviço indisponível">
        {state?.kind === 'unavailable' && (
          <div className="space-y-5">
            <div className="flex gap-3">
              <SearchX className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />
              <p className="text-sm text-text">
                {request.serviceTitle} não está mais disponível para novas solicitações. Veja serviços parecidos na mesma categoria.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setState(null)}>
                Fechar
              </Button>
              <Link to={state.similarPath} className={buttonClasses('primary', 'md')}>
                Ver serviços parecidos
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
