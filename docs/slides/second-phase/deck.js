(() => {
  const stage = document.getElementById('stage')
  const marker = document.getElementById('marker')
  const slides = [...document.querySelectorAll('.slide')]
  const counter = document.getElementById('counter')
  const bar = document.getElementById('bar')
  const chrome = document.getElementById('chrome')
  const hint = document.getElementById('hint')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const BEAT = 90
  const EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)'
  const EASE_IO = 'cubic-bezier(.65, 0, .35, 1)'
  const scripts = window.DECK_SCRIPTS || {}
  let current = -1
  let step = 0
  let timers = []
  let frames = []

  function play(el, keyframes, { delay = 0, duration = 900, easing = EASE_OUT, iterations = 1, direction = 'normal' } = {}) {
    return el.animate(keyframes, {
      delay: reduce ? 0 : delay,
      duration: reduce ? 1 : duration,
      easing,
      iterations: reduce ? 1 : iterations,
      direction,
      fill: 'both',
    })
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, reduce ? 0 : ms))
  }

  function splitWords(el) {
    if (el.dataset.split) return
    el.dataset.split = '1'
    const html = el.innerHTML.trim()
    const parts = html.split(/(<[^>]+>[^<]*<\/[^>]+>|\s+)/).filter((part) => part && part.trim())
    el.innerHTML = parts.map((part) => `<span class="w"><span>${part}</span></span>`).join(' ')
  }

  function format(value, el) {
    return `${el.dataset.prefix || ''}${Math.round(value).toLocaleString('pt-BR')}${el.dataset.suffix || ''}`
  }

  function countUp(el, delay) {
    const to = Number(el.dataset.to)
    const from = Number(el.dataset.from || 0)
    if (reduce) { el.textContent = format(to, el); return }
    el.textContent = format(from, el)
    later(() => {
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1400)
        el.textContent = format(from + (to - from) * (1 - Math.pow(1 - p, 4)), el)
        if (p < 1) frames.push(requestAnimationFrame(tick))
      }
      frames.push(requestAnimationFrame(tick))
    }, delay)
  }

  function animate(el, base = 0) {
    const type = el.dataset.a
    const delay = base + Number(el.dataset.b || 0) * BEAT
    if (type === 'rise') play(el, [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'none' }], { delay })
    if (type === 'fade') play(el, [{ opacity: 0 }, { opacity: 1 }], { delay, duration: 700, easing: EASE_IO })
    if (type === 'scale') play(el, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { delay })
    if (type === 'clip-up') play(el, [{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(30px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { delay, duration: 1100 })
    if (type === 'clip-left') play(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { delay, duration: 1100, easing: EASE_IO })
    if (type === 'reveal') {
      play(el, [{ clipPath: 'inset(8% 6% 8% 6% round 14px)', opacity: 0 }, { clipPath: 'inset(0 0 0 0 round 14px)', opacity: 1 }], { delay, duration: 1200 })
      const img = el.querySelector('.shot img')
      if (img && !el.hasAttribute('data-cam')) play(img, [{ transform: 'scale(1.08)' }, { transform: 'none' }], { delay, duration: 1800 })
    }
    if (type === 'mask') {
      splitWords(el)
      el.querySelectorAll('.w > span').forEach((word, i) => {
        play(word, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { delay: delay + i * BEAT * 0.6, duration: 1000 })
      })
    }
    if (type === 'draw') {
      const length = el.getTotalLength()
      el.style.strokeDasharray = `${length}`
      play(el, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { delay, duration: Number(el.dataset.d || 800), easing: EASE_IO })
    }
    if (type === 'grow') play(el, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { delay, duration: Number(el.dataset.d || 900), easing: EASE_IO })
    if (type === 'grow-y') play(el, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { delay, duration: Number(el.dataset.d || 900), easing: EASE_IO })
    if (type === 'count') {
      play(el, [{ opacity: 0 }, { opacity: 1 }], { delay, duration: 300 })
      countUp(el, delay)
    }
    if (type === 'line') play(el, [{ opacity: 0, transform: 'translateX(-18px)' }, { opacity: 1, transform: 'none' }], { delay, duration: 700 })
    if (type === 'code') {
      play(el, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { delay, duration: 800 })
      el.querySelectorAll('.ln').forEach((ln, i) => {
        const anim = play(ln, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { delay: delay + 200 + i * 38, duration: 500 })
        anim.finished.then(() => anim.cancel()).catch(() => {})
      })
    }
  }

  function camera(slide) {
    slide.querySelectorAll('[data-cam]').forEach((frame) => {
      const img = frame.querySelector('.shot img')
      const view = frame.querySelector('.shot')
      if (!img || !view) return
      const [fx, fy, scale, beats] = frame.dataset.cam.split(',').map(Number)
      const w = view.clientWidth
      const h = view.clientHeight
      const ih = img.clientHeight
      const tx = Math.min(0, Math.max(w * (1 - scale), w * 0.5 - fx * w * scale))
      const ty = Math.min(0, Math.max(h - ih * scale, h * 0.5 - fy * ih * scale))
      play(img, [{ transform: 'none' }, { transform: `translate(${tx}px, ${ty}px) scale(${scale})` }], { delay: (beats || 18) * BEAT, duration: 2600, easing: EASE_IO })
    })
  }

  function stepItems(slide) {
    return [...slide.querySelectorAll('[data-step]')]
  }

  function totalSteps(slide) {
    return Number(slide.dataset.steps || 0)
  }

  function parseRanges(text) {
    const lines = new Set()
    text.split(',').filter(Boolean).forEach((part) => {
      const [a, b] = part.split('-').map(Number)
      for (let i = a; i <= (b || a); i += 1) lines.add(i)
    })
    return lines
  }

  function applyFocus(slide) {
    slide.querySelectorAll('pre[data-focus]').forEach((pre) => {
      const groups = Object.fromEntries(pre.dataset.focus.split(';').map((group) => {
        const [at, ranges] = group.split(':')
        return [Number(at), parseRanges(ranges)]
      }))
      const lines = groups[step] || new Set()
      pre.classList.toggle('focusing', lines.size > 0)
      pre.querySelectorAll('.ln').forEach((ln) => ln.classList.toggle('is-focus', lines.has(Number(ln.dataset.l))))
    })
  }

  function applyLit(slide) {
    slide.querySelectorAll('[data-lit]').forEach((el) => {
      const at = el.dataset.lit.split(',').map(Number)
      el.classList.toggle('is-lit', at.includes(step))
      el.classList.toggle('is-past', step > Math.max(...at))
    })
    slide.querySelectorAll('[data-building]').forEach((el) => el.classList.toggle('is-building', step > 0))
    applyFocus(slide)
  }

  const TOKEN = /(\/\/.*$)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(@\w+)|\b(import|from|export|const|let|return|async|await|class|interface|type|new|if|else|for|of|throw|true|false|null|undefined|private|readonly|public|function|extends|implements|this|try|catch|expect|it|describe)\b|\b(\d[\d_.]*)\b|\b([A-Z][A-Za-z0-9]*)\b|\b([a-zA-Z_]\w*)(?=\()/gm
  const CLASSES = ['m', 's', 'd', 'k', 'n', 't', 'fn']

  function escape(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function paint(line) {
    let html = ''
    let last = 0
    line.replace(TOKEN, (match, ...groups) => {
      const offset = groups[groups.length - 2]
      const index = groups.slice(0, 7).findIndex((group) => group !== undefined)
      html += escape(line.slice(last, offset)) + `<span class="${CLASSES[index]}">${escape(match)}</span>`
      last = offset + match.length
      return match
    })
    return html + escape(line.slice(last))
  }

  function highlight(pre) {
    if (pre.dataset.done) return
    pre.dataset.done = '1'
    const lines = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '').split('\n')
    const marks = parseRanges(pre.dataset.mark || '')
    pre.innerHTML = lines.map((line, i) => `<span class="ln${marks.has(i + 1) ? ' mark' : ''}" data-l="${i + 1}">${paint(line) || ' '}</span>`).join('')
  }

  document.querySelectorAll('pre[data-code]').forEach(highlight)

  function revealStep(slide, instant) {
    stepItems(slide).forEach((el) => {
      const at = Number(el.dataset.step)
      if (at > step) { el.style.visibility = 'hidden'; return }
      const fresh = el.style.visibility === 'hidden'
      el.style.visibility = ''
      if (fresh && !instant && el.dataset.a) animate(el, 0)
    })
    applyLit(slide)
    const script = scripts[slide.dataset.script]
    if (script && script.step) script.step(slide, step, api)
  }

  function parseMarker(slide) {
    const [x, y, w, h, color] = (slide.dataset.marker || '120,120,48,4,#286B4D').split(',')
    return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, background: color }
  }

  function morphMarker(slide, instant) {
    const target = parseMarker(slide)
    const style = getComputedStyle(marker)
    const from = { left: style.left, top: style.top, width: style.width, height: style.height, background: style.backgroundColor }
    marker.getAnimations().forEach((a) => a.cancel())
    Object.assign(marker.style, target)
    if (!instant && !reduce) play(marker, [from, target], { duration: 1000, easing: EASE_IO })
  }

  function setTheme(slide) {
    const theme = slide.dataset.theme || 'paper'
    stage.classList.toggle('is-dark', theme === 'dark')
    stage.classList.toggle('is-white', theme === 'white')
    document.body.classList.toggle('is-dark', theme === 'dark')
    document.body.classList.toggle('is-white', theme === 'white')
    chrome.classList.toggle('on-dark', theme === 'dark')
  }

  function clearRuntime() {
    timers.forEach(clearTimeout)
    timers = []
    frames.forEach(cancelAnimationFrame)
    frames = []
  }

  function show(index, { instant = false, built = false } = {}) {
    const next = Math.max(0, Math.min(slides.length - 1, index))
    if (next === current) return
    const forward = next > current
    clearRuntime()
    const previous = slides[current]
    if (previous) {
      previous.getAnimations({ subtree: true }).forEach((a) => a.cancel())
      previous.classList.remove('is-active')
      if (!instant && !reduce) {
        previous.classList.add('is-leaving')
        const out = previous.animate(
          [{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: `translateX(${forward ? -48 : 48}px) scale(.985)`, filter: 'blur(4px)' }],
          { duration: 420, easing: 'cubic-bezier(.5, 0, .75, 0)' },
        )
        out.onfinish = () => previous.classList.remove('is-leaving')
      }
    }
    current = next
    const slide = slides[current]
    step = built ? totalSteps(slide) : 0
    slide.classList.add('is-active')
    setTheme(slide)
    morphMarker(slide, instant)
    const base = previous && !instant ? 260 : 0
    if (!instant && !reduce) play(slide, [{ opacity: 0 }, { opacity: 1 }], { delay: base * 0.6, duration: 600, easing: EASE_IO })
    slide.querySelectorAll('[data-a]').forEach((el) => { if (!el.hasAttribute('data-step')) animate(el, base) })
    stepItems(slide).forEach((el) => { el.style.visibility = 'hidden' })
    const script = scripts[slide.dataset.script]
    if (script && script.enter) script.enter(slide, api)
    revealStep(slide, true)
    camera(slide)
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`
    bar.style.width = `${((current + 1) / slides.length) * 100}%`
    history.replaceState(null, '', `#${current + 1}`)
    if (current > 0) hint.style.opacity = '0'
  }

  function forward() {
    const slide = slides[current]
    if (step < totalSteps(slide)) {
      step += 1
      revealStep(slide, false)
      return
    }
    show(current + 1)
  }

  function back() {
    if (current === 0) return
    show(current - 1, { built: true })
  }

  function travel(dot, path, { delay = 0, duration = 2400, iterations = 1, direction = 'normal' } = {}) {
    if (reduce || !dot || !path) return null
    const length = path.getTotalLength()
    const points = []
    const count = 64
    for (let i = 0; i <= count; i += 1) {
      const p = path.getPointAtLength((length * i) / count)
      points.push({ transform: `translate(${p.x}px, ${p.y}px)`, opacity: i === 0 || i === count ? 0 : 1 })
    }
    return dot.animate(points, { delay, duration, iterations, direction, easing: EASE_IO, fill: 'both' })
  }

  const api = { play, later, travel, BEAT, EASE_OUT, EASE_IO, reduce }

  function fit() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080)
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`
  }

  addEventListener('resize', fit)
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); forward() }
    if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); back() }
    if (e.key === 'Home') show(0)
    if (e.key === 'End') show(slides.length - 1, { built: true })
    if (e.key === 'r' || e.key === 'R') { const i = current; current = -1; show(i, { instant: true }) }
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen?.()
    }
  })
  addEventListener('click', (e) => {
    if (e.clientX > innerWidth / 3) forward()
    else back()
  })
  let touchX = null
  addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX }, { passive: true })
  addEventListener('touchend', (e) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 40) { if (dx < 0) forward(); else back() }
    touchX = null
  })

  if (matchMedia('(pointer: coarse)').matches) hint.textContent = 'Toque à direita para avançar'
  fit()
  const start = Number(location.hash.slice(1)) || 1
  document.fonts.ready.then(() => show(start - 1, { instant: true }))
  window.deck = { show: (n, built = false) => show(n - 1, { built }), next: forward, count: slides.length }
})()
