import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { MarketplaceOverview } from '../../hooks/useMarketplaceOverview'
import { usePanelPath } from '../../hooks/usePanelPath'
import { paths } from '../../routes/paths'
import type { Service } from '../../types/entities'
import { formatLocation, formatRating } from '../../utils/format'
import { Container } from '../layout/Container'
import { Skeleton } from '../ui/Skeleton'
import { HeroVisual } from './HeroVisual'
import { heroSequence, maskLine, riseIn } from './homeMotion'

const titleLines = ['Encontre o serviço', 'agrícola certo para', 'sua propriedade.']

const ctaClasses =
  'group inline-flex h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97]'

interface HeroSectionProps {
  overview: MarketplaceOverview | null
  isOverviewLoading: boolean
  spotlight?: Service
  spotlightIcon?: string
}

function buildHighlights(overview: MarketplaceOverview) {
  return [
    {
      value: String(overview.verifiedProviders),
      label: overview.verifiedProviders === 1 ? 'prestador verificado' : 'prestadores verificados',
    },
    ...(overview.averageRating === null ? [] : [{ value: formatRating(overview.averageRating), label: 'nota média' }]),
    { value: String(overview.cities), label: overview.cities === 1 ? 'cidade atendida' : 'cidades atendidas' },
  ]
}

export function HeroSection({ overview, isOverviewLoading, spotlight, spotlightIcon }: HeroSectionProps) {
  const panelPath = usePanelPath()
  const providersNearby = spotlight && overview ? overview.providersByCity[formatLocation(spotlight.city, spotlight.state)] : undefined

  return (
    <section className="pt-10 pb-16 sm:pt-14 lg:pt-20 lg:pb-24">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <motion.div variants={heroSequence} initial="hidden" animate="visible">
          <motion.p variants={riseIn} className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Marketplace de serviços agrícolas
          </motion.p>
          <h1
            aria-label={titleLines.join(' ')}
            className="mt-5 text-[clamp(2rem,8.4vw,3.75rem)]/[1.06] font-extrabold tracking-[-0.035em] text-text lg:text-[clamp(2.75rem,4.5vw,3.875rem)]/[1.06]"
          >
            {titleLines.map((line) => (
              <span key={line} aria-hidden className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
                <motion.span variants={maskLine} className="block whitespace-nowrap">
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={riseIn} className="mt-6 max-w-xl text-lg/8 text-text-muted">
            Conectamos você a profissionais, máquinas e serviços agrícolas da sua região. Encontre quem precisa, compare
            opções e negocie com confiança.
          </motion.p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <motion.div variants={riseIn} className="flex">
              <Link to={paths.services} className={`${ctaClasses} flex-1 bg-primary text-white hover:bg-primary-strong`}>
                Encontrar serviços
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </motion.div>
            <motion.div variants={riseIn} className="flex">
              <Link
                to={panelPath}
                className={`${ctaClasses} flex-1 border border-border bg-surface text-text hover:border-primary/40 hover:text-primary`}
              >
                Acessar meu painel
              </Link>
            </motion.div>
          </div>
          {overview ? (
            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex max-w-xl flex-wrap gap-x-10 gap-y-5 border-t border-border pt-7"
            >
              {buildHighlights(overview).map((highlight) => (
                <div key={highlight.label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-sm text-text-muted">{highlight.label}</dt>
                  <dd className="text-3xl/9 font-bold tracking-[-0.02em] text-text tabular-nums">{highlight.value}</dd>
                </div>
              ))}
            </motion.dl>
          ) : (
            isOverviewLoading && (
              <div role="status" className="mt-12 flex max-w-xl gap-10 border-t border-border pt-7">
                <span className="sr-only">Carregando indicadores…</span>
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index}>
                    <Skeleton className="h-9 w-14 rounded-md" />
                    <Skeleton className="mt-2 h-4 w-28 rounded-md" />
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>
        <HeroVisual service={spotlight} categoryIcon={spotlightIcon} providersNearby={providersNearby} />
      </Container>
    </section>
  )
}
