import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '../components/layout/Container'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'

export function NotFoundPage() {
  usePageTitle('Página não encontrada')
  return (
    <Container className="py-20">
      <EmptyState
        icon={Compass}
        titleAs="h1"
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi alterado."
        action={
          <Link to={paths.home} className={buttonClasses('primary', 'md')}>
            Voltar para o início
          </Link>
        }
      />
    </Container>
  )
}
