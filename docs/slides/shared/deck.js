(() => {
  const stage = document.getElementById('stage')
  const seed = document.getElementById('seed')
  const slides = [...document.querySelectorAll('.slide')]
  const counter = document.getElementById('counter')
  const bar = document.getElementById('bar')
  const chrome = document.getElementById('chrome')
  const hint = document.getElementById('hint')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const BEAT = 110
  const SPRINGS = {
    snappy: { stiffness: 380, damping: 30 },
    smooth: { stiffness: 170, damping: 24 },
    heavy: { stiffness: 120, damping: 22 },
    playful: { stiffness: 260, damping: 15 },
  }
  const cache = new Map()
  let current = -1
  let timers = []
  let loops = []

  function spring(name) {
    if (cache.has(name)) return cache.get(name)
    const { stiffness, damping } = SPRINGS[name]
    const w0 = Math.sqrt(stiffness)
    const zeta = damping / (2 * Math.sqrt(stiffness))
    const position = (t) => {
      if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta)
        return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      }
      return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    }
    let duration = 0.1
    while (duration < 3) {
      let settled = true
      for (let t = duration; t < duration + 0.25; t += 0.01) if (Math.abs(1 - position(t)) > 0.002) settled = false
      if (settled) break
      duration += 0.02
    }
    const steps = 48
    const points = []
    for (let i = 0; i <= steps; i += 1) points.push(position((duration * i) / steps).toFixed(4))
    points[steps] = '1'
    const result = { easing: `linear(${points.join(', ')})`, duration: Math.round(duration * 1000) }
    cache.set(name, result)
    return result
  }

  function run(el, keyframes, { kind = 'smooth', delay = 0, duration, easing, iterations = 1 } = {}) {
    const s = spring(kind)
    return el.animate(keyframes, {
      duration: reduce ? 1 : duration ?? s.duration,
      easing: easing ?? s.easing,
      delay: reduce ? 0 : delay,
      fill: 'both',
      iterations: reduce ? 1 : iterations,
    })
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, reduce ? 0 : ms))
  }

  function splitWords(el) {
    if (el.dataset.split) return
    el.dataset.split = '1'
    const words = el.textContent.trim().split(/\s+/)
    el.innerHTML = words.map((word) => `<span class="w"><span>${word}</span></span>`).join(' ')
  }

  function fmt(value, prefix) {
    return `${prefix || ''}${Math.round(value).toLocaleString('pt-BR')}`
  }

  function countUp(el, delay) {
    const to = Number(el.dataset.to)
    const prefix = el.dataset.prefix
    if (reduce) { el.textContent = fmt(to, prefix); return }
    el.textContent = fmt(0, prefix)
    later(() => {
      const start = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - start) / 1100)
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), prefix)
        if (p < 1 && el.isConnected) loops.push(requestAnimationFrame(step))
      }
      loops.push(requestAnimationFrame(step))
    }, delay)
  }

  function animateIn(slide) {
    slide.querySelectorAll('[data-a]').forEach((el) => {
      const type = el.dataset.a
      const delay = Number(el.dataset.b || 0) * BEAT
      if (type === 'rise') run(el, [{ opacity: 0, transform: 'translateY(46px)' }, { opacity: 1, transform: 'none' }], { delay })
      if (type === 'pop') run(el, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { kind: 'playful', delay })
      if (type === 'wipe') run(el, [{ clipPath: 'inset(0 0 0 100% round 16px)' }, { clipPath: 'inset(0 0 0 0% round 16px)' }], { kind: 'heavy', delay })
      if (type === 'mask') {
        splitWords(el)
        el.querySelectorAll('.w > span').forEach((word, i) => {
          run(word, [{ transform: 'translateY(108%)' }, { transform: 'none' }], { kind: 'heavy', delay: delay + i * BEAT * 0.55 })
        })
      }
      if (type === 'draw') {
        const length = el.getTotalLength()
        el.style.strokeDasharray = `${length}`
        el.removeAttribute('marker-end')
        const drawing = run(el, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { delay, duration: 520, easing: 'cubic-bezier(.65,0,.35,1)' })
        if (el.dataset.arrow) drawing.finished.then(() => el.setAttribute('marker-end', `url(#${el.dataset.arrow})`)).catch(() => {})
      }
      if (type === 'count') countUp(el, delay)
      if (type === 'grow') run(el, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { kind: 'heavy', delay, duration: Number(el.dataset.d || 0) || undefined, easing: el.dataset.d ? 'cubic-bezier(.65,0,.35,1)' : undefined })
      if (type === 'line') run(el, [{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { kind: 'snappy', delay })
    })
  }

  function reset(slide) {
    slide.getAnimations({ subtree: true }).forEach((a) => a.cancel())
  }

  function travel(dot, path, { delay = 0, duration = 2600, iterations = Infinity, direction = 'normal' } = {}) {
    if (reduce) return
    const length = path.getTotalLength()
    const frames = []
    const count = 60
    for (let i = 0; i <= count; i += 1) {
      const p = path.getPointAtLength((length * i) / count)
      frames.push({ transform: `translate(${p.x}px, ${p.y}px)`, opacity: i === 0 || i === count ? 0 : 1 })
    }
    dot.animate(frames, { duration, delay, iterations, direction, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' })
  }

  function focusFrame(cam, fx, fy, scale) {
    const w = 1000
    const h = 625
    const tx = Math.min(0, Math.max(w * (1 - scale), w * 0.5 - fx * w * scale))
    const ty = Math.min(0, Math.max(h * (1 - scale), h * 0.5 - fy * h * scale))
    return `translate(${tx}px, ${ty}px) scale(${scale})`
  }

  const scripts = window.DECK_SCRIPTS || {}

  function parseSeed(slide) {
    const [x, y, w, h, r, color] = slide.dataset.seed.split(',')
    return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${r}px`, background: color }
  }

  function morphSeed(slide, instant) {
    const target = parseSeed(slide)
    const style = getComputedStyle(seed)
    const from = { left: style.left, top: style.top, width: style.width, height: style.height, borderRadius: style.borderRadius, background: style.backgroundColor }
    seed.getAnimations().forEach((a) => a.cancel())
    Object.assign(seed.style, target)
    if (instant || reduce) return
    run(seed, [from, target], { kind: 'heavy' })
  }

  function show(index, instant = false) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index))
    if (nextIndex === current) return
    const forward = nextIndex > current
    timers.forEach(clearTimeout)
    timers = []
    loops.forEach(cancelAnimationFrame)
    loops = []
    const previous = slides[current]
    if (previous) {
      reset(previous)
      previous.classList.remove('is-active')
      if (!instant && !reduce) {
        previous.classList.add('is-leaving')
        const out = previous.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${forward ? -60 : 60}px)` }], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)' })
        out.onfinish = () => previous.classList.remove('is-leaving')
      }
    }
    current = nextIndex
    const slide = slides[current]
    slide.classList.add('is-active')
    morphSeed(slide, instant)
    animateIn(slide)
    const script = scripts[slide.dataset.script]
    if (script) script(slide, { run, later, travel, focusFrame, BEAT, reduce })
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`
    bar.style.width = `${((current + 1) / slides.length) * 100}%`
    chrome.classList.toggle('on-dark', slide.dataset.darkChrome === 'true')
    document.body.style.backgroundColor = slide.dataset.darkChrome === 'true' ? '#173F2A' : '#F7F8F5'
    history.replaceState(null, '', `#${current + 1}`)
    if (current > 0) hint.style.opacity = '0'
  }

  function fit() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080)
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`
  }

  addEventListener('resize', fit)
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); show(current + 1) }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); show(current - 1) }
    if (e.key === 'Home') show(0)
    if (e.key === 'End') show(slides.length - 1)
    if (e.key === 'r' || e.key === 'R') { const i = current; current = -1; show(i, true) }
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen?.()
    }
  })
  addEventListener('click', (e) => {
    if (e.clientX > innerWidth / 3) show(current + 1)
    else show(current - 1)
  })
  let touchX = null
  addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX }, { passive: true })
  addEventListener('touchend', (e) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1))
    touchX = null
  })

  if (matchMedia('(pointer: coarse)').matches) hint.textContent = 'Toque à direita para avançar · à esquerda para voltar'
  fit()
  const start = Number(location.hash.slice(1)) || 1
  document.fonts.ready.then(() => show(start - 1, true))
  window.deck = { show: (n) => show(n - 1), count: slides.length }
})()
