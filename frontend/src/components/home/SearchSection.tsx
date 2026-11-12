import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { paths } from '../../routes/paths'
import { toSearchString } from '../../utils/searchParams'
import { SearchBar, type SearchValues } from '../domain/SearchBar'
import { Container } from '../layout/Container'
import { revealOnScroll, riseIn, stagger } from './homeMotion'

export function SearchSection() {
  const navigate = useNavigate()

  function handleSearch(values: SearchValues) {
    navigate(`${paths.services}${toSearchString({ q: values.q, location: values.location })}`)
  }

  return (
    <section aria-labelledby="search-heading" className="py-10 lg:py-14">
      <Container>
        <motion.div variants={stagger} {...revealOnScroll} className="mx-auto max-w-4xl text-center">
          <motion.h2
            variants={riseIn}
            id="search-heading"
            className="text-3xl/[1.15] font-bold tracking-[-0.025em] text-text sm:text-[40px]/[1.12]"
          >
            O que sua propriedade precisa hoje?
          </motion.h2>
          <motion.p variants={riseIn} className="mt-3 text-lg text-text-muted">
            Encontre profissionais e serviços agrícolas perto de você.
          </motion.p>
          <motion.div variants={riseIn} className="mt-8 text-left">
            <SearchBar variant="hero" onSearch={handleSearch} />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
