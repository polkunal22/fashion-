const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

const header = $('.site-header')
const menuToggle = $('.menu-toggle')
const mainNav = $('.main-nav')
const overlay = $('.overlay')
const searchPanel = $('.search-panel')
const bagPanel = $('.bag-panel')
const wishlistPanel = $('.wishlist-panel')
const ordersModal = $('.orders-modal')
const quickViewModal = $('.quickview-modal')
const toast = $('.toast')
const backToTopBtn = $('.back-to-top')
const scrollProgressBar = $('.scroll-progress-bar')
const progressRingBar = $('.progress-ring-bar')

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const FREE_DELIVERY_FROM = 4000

let toastTimer

const announce = message => {
  if (!toast) return
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800)
}

/* ==========================================================================
   1. Reusable Split-Text Reveal Engine
   ========================================================================== */

const initSplitText = () => {
  const targets = $$('[data-split]')
  targets.forEach(target => {
    if (target.dataset.splitReady === 'true') return
    target.dataset.splitReady = 'true'

    let wordCounter = 0
    const processNode = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        if (!text.trim()) return document.createTextNode(text)
        const fragment = document.createDocumentFragment()
        const parts = text.split(/(\s+)/)
        parts.forEach(part => {
          if (!part) return
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(' '))
          } else {
            const wrap = document.createElement('span')
            wrap.className = 'split-word-wrap'
            const word = document.createElement('span')
            word.className = 'split-word'
            word.style.setProperty('--word-index', String(wordCounter++))
            word.textContent = part
            wrap.appendChild(word)
            fragment.appendChild(wrap)
          }
        })
        return fragment
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') return node.cloneNode(false)
        const clone = node.cloneNode(false)
        ;[...node.childNodes].forEach(child => clone.appendChild(processNode(child)))
        return clone
      }
      return node.cloneNode(true)
    }

    const children = [...target.childNodes].map(processNode)
    target.innerHTML = ''
    children.forEach(child => target.appendChild(child))

    if (reduceMotion) {
      target.classList.add('is-split-visible')
    }
  })

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const splitObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-split-visible')
          splitObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    )
    targets.forEach(target => splitObserver.observe(target))
  } else {
    targets.forEach(target => target.classList.add('is-split-visible'))
  }
}

/* ==========================================================================
   2. Unified Scroll Progress, Header, Back-To-Top & Parallax Controller
   ========================================================================== */

const initScrollEngine = () => {
  const parallaxNodes = !reduceMotion && isDesktopPointer ? $$('[data-parallax]') : []
  const circumference = 2 * Math.PI * 19
  let ticking = false

  const updateScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll))

    if (header) {
      header.classList.toggle('is-scrolled', scrollY > 20)
    }

    if (scrollProgressBar) {
      scrollProgressBar.style.transform = `scaleX(${progress.toFixed(4)})`
    }

    if (backToTopBtn) {
      backToTopBtn.classList.toggle('is-visible', scrollY > 520)
      if (progressRingBar) {
        const offset = circumference - progress * circumference
        progressRingBar.style.strokeDashoffset = String(offset.toFixed(2))
      }
    }

    if (parallaxNodes.length && window.innerWidth > 900) {
      const viewportH = window.innerHeight
      parallaxNodes.forEach(node => {
        const rect = node.parentElement ? node.parentElement.getBoundingClientRect() : node.getBoundingClientRect()
        if (rect.bottom < -100 || rect.top > viewportH + 100) return
        const speed = Number(node.dataset.parallax) || 0.1
        const centerOffset = (rect.top + rect.height * 0.5 - viewportH * 0.5) / viewportH
        const yMove = centerOffset * speed * -120
        node.style.transform = `translate3d(0, ${yMove.toFixed(2)}px, 0)`
      })
    }

    ticking = false
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll)
        ticking = true
      }
    },
    { passive: true }
  )

  if (header) header.classList.add('header-ready')
  updateScroll()

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    })
  }
}

/* ==========================================================================
   3. Magnetic Micro-Interactions & Full 3D Spatial Tilt + Specular Glare Engine
   ========================================================================== */

const initMagneticAndTilt = () => {
  if (reduceMotion || !isDesktopPointer) return

  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', event => {
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - rect.left - rect.width / 2) * 0.24
      const y = (event.clientY - rect.top - rect.height / 2) * 0.24
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 14px)`
    })
    el.addEventListener('pointerleave', () => {
      el.style.transform = ''
    })
  })

  // Attach 3D Specular Light Glare & Multi-Axis Perspective Tilt to all Product Cards
  $$('.product-card').forEach(card => {
    if (!$('.card-3d-glare', card)) {
      const glare = document.createElement('span')
      glare.className = 'card-3d-glare'
      glare.setAttribute('aria-hidden', 'true')
      card.appendChild(glare)
    }

    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      const relX = px - 0.5
      const relY = py - 0.5

      const rotateX = (relY * -13).toFixed(2)
      const rotateY = (relX * 13).toFixed(2)
      const shadowX = (relX * -22).toFixed(1)
      const shadowY = (18 + relY * -16).toFixed(1)

      card.classList.add('is-tilting')
      card.style.setProperty('--rx', `${rotateX}deg`)
      card.style.setProperty('--ry', `${rotateY}deg`)
      card.style.setProperty('--tz', '12px')
      card.style.setProperty('--sx', `${shadowX}px`)
      card.style.setProperty('--sy', `${shadowY}px`)
      card.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`)
      card.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`)
    })

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting')
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
      card.style.setProperty('--tz', '0px')
      card.style.setProperty('--sx', '0px')
      card.style.setProperty('--sy', '10px')
    })
  })

  // Attach 3D Perspective Tilt + Specular Glare to Category Cards, Ad Banners, Story Image & Newsletter Card
  $$('[data-tilt], .atelier-ad-banner, .story-image, .newsletter-card').forEach(card => {
    if (!$('.card-3d-glare', card)) {
      const glare = document.createElement('span')
      glare.className = 'card-3d-glare'
      glare.setAttribute('aria-hidden', 'true')
      card.appendChild(glare)
    }

    const maxDeg = card.matches('[data-tilt]') ? 8 : 4.5
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      const relX = px - 0.5
      const relY = py - 0.5
      const rotateX = (relY * -maxDeg).toFixed(2)
      const rotateY = (relX * maxDeg).toFixed(2)

      card.style.transform = `perspective(1300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(0, -4px, 10px)`
      card.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`)
      card.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`)
    })
    card.addEventListener('pointerleave', () => {
      card.style.transform = ''
    })
  })
}

/* ==========================================================================
   4. Hero Lookbook Interactive Slider & Pointer Parallax
   ========================================================================== */

const initHeroLookbook = () => {
  const hero = $('.hero')
  const heroImages = $$('.hero-image')
  const slideBtns = $$('[data-hero-slide]')
  const counterFill = $('.hero-counter-fill')
  if (!hero || !heroImages.length) return

  let activeSlide = 0
  let slideTimer = null

  const setHeroSlide = index => {
    activeSlide = (index + heroImages.length) % heroImages.length
    heroImages.forEach((img, idx) => {
      img.classList.toggle('is-active', idx === activeSlide)
    })
    slideBtns.forEach((btn, idx) => {
      btn.classList.toggle('is-active', idx === activeSlide)
      btn.setAttribute('aria-pressed', String(idx === activeSlide))
    })
    if (counterFill) {
      const ratio = (activeSlide + 1) / heroImages.length
      counterFill.style.transform = `scaleX(${ratio.toFixed(2)})`
    }
  }

  const startAutoSlide = () => {
    if (reduceMotion) return
    clearInterval(slideTimer)
    slideTimer = setInterval(() => {
      setHeroSlide(activeSlide + 1)
    }, 6200)
  }

  slideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setHeroSlide(Number(btn.dataset.heroSlide))
      startAutoSlide()
    })
  })

  hero.addEventListener('pointerenter', () => clearInterval(slideTimer))
  hero.addEventListener('pointerleave', startAutoSlide)
  startAutoSlide()

  if (!reduceMotion && isDesktopPointer) {
    const heroContent = $('.hero-content', hero)
    const heroBadge = $('.hero-floating-badge', hero)
    hero.addEventListener('pointermove', event => {
      const activeImg = $('.hero-image.is-active', hero)
      const bounds = hero.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5
      if (activeImg) {
        activeImg.style.transform = `scale(1.065) translate3d(${(x * -22).toFixed(2)}px, ${(y * -16).toFixed(2)}px, -30px) rotateX(${(y * -4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`
      }
      if (heroContent) {
        heroContent.style.transform = `translate3d(${(x * 14).toFixed(2)}px, ${(y * 10).toFixed(2)}px, 28px) rotateX(${(y * -3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`
      }
      if (heroBadge) {
        heroBadge.style.transform = `translate3d(${(x * 18).toFixed(2)}px, ${(y * 10).toFixed(2)}px, 40px)`
      }
    })
    hero.addEventListener('pointerleave', () => {
      const activeImg = $('.hero-image.is-active', hero)
      if (activeImg) activeImg.style.transform = ''
      if (heroContent) heroContent.style.transform = ''
      if (heroBadge) heroBadge.style.transform = ''
    })
  }
}

/* ==========================================================================
   5. Animated Number Counters
   ========================================================================== */

const initCounters = () => {
  const counters = $$('[data-counter]')
  if (!counters.length) return

  const animateCounter = el => {
    const target = Number(el.dataset.counter) || 0
    if (reduceMotion) {
      el.textContent = target.toLocaleString('en-IN')
      return
    }
    const duration = 1600
    const startTime = performance.now()

    const step = now => {
      const elapsed = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - elapsed, 3)
      const current = Math.round(target * eased)
      el.textContent = current.toLocaleString('en-IN')
      if (elapsed < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          animateCounter(entry.target)
          counterObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.4 }
    )
    counters.forEach(counter => counterObserver.observe(counter))
  } else {
    counters.forEach(animateCounter)
  }
}

/* ==========================================================================
   6. Wearer Reflections (Testimonials) Carousel
   ========================================================================== */

const initTestimonialsCarousel = () => {
  const cards = $$('.testimonial-card')
  const dots = $$('[data-carousel-dot]')
  const prevBtn = $('.carousel-prev')
  const nextBtn = $('.carousel-next')
  const statusEl = $('.carousel-status')
  const carousel = $('.testimonial-carousel')
  if (!cards.length) return

  let currentIndex = 0
  let touchStartX = 0

  const goToSlide = index => {
    currentIndex = (index + cards.length) % cards.length
    cards.forEach((card, idx) => {
      const active = idx === currentIndex
      card.classList.toggle('is-active', active)
      card.setAttribute('aria-hidden', String(!active))
    })
    dots.forEach((dot, idx) => {
      const active = idx === currentIndex
      dot.classList.toggle('is-active', active)
      dot.setAttribute('aria-pressed', String(active))
    })
    if (statusEl) {
      statusEl.textContent = `0${currentIndex + 1} / 0${cards.length}`
    }
  }

  prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1))
  nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1))
  dots.forEach(dot => {
    dot.addEventListener('click', () => goToSlide(Number(dot.dataset.carouselDot)))
  })

  if (carousel) {
    carousel.addEventListener(
      'touchstart',
      e => {
        touchStartX = e.changedTouches[0].screenX
      },
      { passive: true }
    )
    carousel.addEventListener(
      'touchend',
      e => {
        const diff = e.changedTouches[0].screenX - touchStartX
        if (Math.abs(diff) > 40) {
          goToSlide(diff < 0 ? currentIndex + 1 : currentIndex - 1)
        }
      },
      { passive: true }
    )
  }
}

/* ==========================================================================
   7. Product Collection Filters & Interactive Swatches
   ========================================================================== */

const initCollectionFilters = () => {
  const filterBtns = $$('.filter-pill')
  const resetLinks = $$('[data-reset-filter]')

  const applyFilter = (group, filterValue) => {
    const grid = $(`[data-grid-group="${group}"]`)
    if (!grid) return
    const cards = $$('.product-card', grid)

    $$(`.filter-pill[data-filter-group="${group}"]`).forEach(btn => {
      const active = btn.dataset.filter === filterValue
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-pressed', String(active))
    })

    grid.classList.toggle('is-filtered', filterValue !== 'all')

    let visibleIndex = 0
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(/\s+/)
      const match = filterValue === 'all' || tags.includes(filterValue)
      card.classList.toggle('is-filtered-out', !match)
      if (match) {
        card.classList.add('is-visible')
        if (!reduceMotion) {
          card.style.transitionDelay = `${visibleIndex * 45}ms`
          setTimeout(() => {
            card.style.transitionDelay = ''
          }, 500)
        }
        visibleIndex++
      }
    })

    const statusWrap = $(`[data-status-group="${group}"]`)
    if (statusWrap) {
      statusWrap.innerHTML = `SHOWING <strong>${visibleIndex}</strong> OF ${cards.length} SIGNATURE PIECES`
    }
  }

  // Dynamically sync filter pill counters from the actual DOM cards
  ;['women', 'men'].forEach(group => {
    const grid = $(`[data-grid-group="${group}"]`)
    if (!grid) return
    const cards = $$('.product-card', grid)
    $$(`.filter-pill[data-filter-group="${group}"]`).forEach(btn => {
      const f = btn.dataset.filter
      const countEl = $('.pill-count', btn)
      if (!countEl) return
      const count =
        f === 'all'
          ? cards.length
          : cards.filter(c => (c.dataset.tags || '').split(/\s+/).includes(f)).length
      countEl.textContent = String(count).padStart(2, '0')
    })
  })

  // Interactive Price Sort Toggle (Curated -> Low to High -> High to Low)
  $$('[data-sort-group]').forEach(sortBtn => {
    const group = sortBtn.dataset.sortGroup
    const grid = $(`[data-grid-group="${group}"]`)
    if (!grid) return
    const originalOrder = $$('.product-card', grid)

    sortBtn.addEventListener('click', () => {
      const currentMode = sortBtn.dataset.sortMode || 'default'
      const nextMode = currentMode === 'default' ? 'asc' : currentMode === 'asc' ? 'desc' : 'default'
      sortBtn.dataset.sortMode = nextMode

      const labelEl = $('b', sortBtn)
      if (labelEl) {
        labelEl.textContent =
          nextMode === 'asc' ? 'PRICE: LOW → HIGH' : nextMode === 'desc' ? 'PRICE: HIGH → LOW' : 'CURATED'
      }

      const sorted = [...originalOrder]
      if (nextMode === 'asc') {
        sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price))
      } else if (nextMode === 'desc') {
        sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price))
      }
      sorted.forEach(card => grid.appendChild(card))
    })
  })

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.filterGroup, btn.dataset.filter)
    })
  })

  resetLinks.forEach(link => {
    link.addEventListener('click', () => {
      applyFilter(link.dataset.resetFilter, 'all')
    })
  })

  // Atelier Ad Banner filter triggers
  $$('[data-trigger-filter]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const [group, filterVal] = (trigger.dataset.triggerFilter || '').split(':')
      if (!group || !filterVal) return
      applyFilter(group, filterVal)
      const grid = $(`[data-grid-group="${group}"]`)
      grid?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    })
  })

  // Interactive size selector bar on each product card
  $$('.card-size-bar').forEach(bar => {
    const btns = $$('[data-card-size]', bar)
    btns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation()
        btns.forEach(b => b.classList.remove('is-active'))
        btn.classList.add('is-active')
      })
    })
  })

  // Resilient image fallback guard
  $$('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return
      img.dataset.fallbackApplied = 'true'
      img.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85'
    })
  })

  // Initialize interactive swatches on all product cards
  const shadeNames = ['Obsidian Charcoal', 'Warm Alabaster', 'Raw Umber']
  $$('.product-card .swatches').forEach(swatchGroup => {
    const dots = $$('i', swatchGroup)
    if (dots[0]) dots[0].classList.add('is-active')
    dots.forEach((dot, idx) => {
      dot.setAttribute('role', 'button')
      dot.setAttribute('tabindex', '0')
      dot.setAttribute('title', shadeNames[idx] || 'Shade')
      dot.setAttribute('aria-label', `Select ${shadeNames[idx] || 'shade'}`)
      const selectSwatch = e => {
        e.stopPropagation()
        dots.forEach(d => d.classList.remove('is-active'))
        dot.classList.add('is-active')
      }
      dot.addEventListener('click', selectSwatch)
      dot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          selectSwatch(e)
        }
      })
    })
  })
}

/* ==========================================================================
   8. Panels, Navigation & Quick View Modal
   ========================================================================== */

const closePanels = () => {
  overlay.hidden = true
  ;[searchPanel, bagPanel, wishlistPanel, ordersModal, quickViewModal].forEach(panel => {
    if (!panel) return
    panel.classList.remove('is-open')
    panel.setAttribute('aria-hidden', 'true')
    panel.setAttribute('inert', '')
  })
  document.body.classList.remove('locked')
}

const openPanel = panel => {
  if (!panel) return
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')

  ;[searchPanel, bagPanel, wishlistPanel, ordersModal, quickViewModal].forEach(p => {
    if (p && p !== panel) {
      p.classList.remove('is-open')
      p.setAttribute('aria-hidden', 'true')
      p.setAttribute('inert', '')
    }
  })

  panel.classList.add('is-open')
  panel.setAttribute('aria-hidden', 'false')
  panel.removeAttribute('inert')
  overlay.hidden = false
  document.body.classList.add('locked')
  if (panel === searchPanel) setTimeout(() => $('.search-input')?.focus(), 100)
}

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu')
  mainNav.classList.toggle('is-open', !expanded)
  if (!expanded && matchMedia('(max-width: 700px)').matches) {
    setTimeout(() => mainNav.querySelector('a')?.focus(), 120)
  }
})

$$('.main-nav a').forEach(link =>
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.setAttribute('aria-label', 'Open menu')
  })
)

document.addEventListener('pointerdown', event => {
  if (!mainNav.classList.contains('is-open') || header.contains(event.target)) return
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
})

document.addEventListener('keydown', event => {
  if (
    (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')
  ) {
    event.preventDefault()
    openPanel(searchPanel)
    return
  }
  if (event.key !== 'Escape') return
  const menuWasOpen = mainNav.classList.contains('is-open')
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
  closePanels()
  if (menuWasOpen) menuToggle.focus()
})

if ('IntersectionObserver' in window) {
  const navLinks = $$('.main-nav a')
  const navSections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean)
  const navObserver = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      navLinks.forEach(link => {
        const active = link.hash === `#${visible.target.id}`
        link.classList.toggle('is-active', active)
        if (active) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    },
    { rootMargin: '-28% 0px -55% 0px', threshold: [0, 0.15, 0.35] }
  )
  navSections.forEach(section => navObserver.observe(section))
}

$('.search-toggle').addEventListener('click', () => openPanel(searchPanel))
$('.bag-toggle').addEventListener('click', () => openPanel(bagPanel))
$('.wishlist-toggle')?.addEventListener('click', () => openPanel(wishlistPanel))
$$('[data-open-orders]').forEach(btn =>
  btn.addEventListener('click', () => {
    openPanel(ordersModal)
    loadSQLOrders()
  })
)
$$('.panel-close').forEach(button => button.addEventListener('click', closePanels))
overlay.addEventListener('click', closePanels)

/* ==========================================================================
   8b. Saved Pieces (Wishlist) & Live SQL Database / Orders Portal
   ========================================================================== */

let wishlist = []
try {
  wishlist = JSON.parse(localStorage.getItem('forma-wishlist') || '[]')
  if (!Array.isArray(wishlist)) wishlist = []
} catch {
  wishlist = []
}

const updateWishlistUI = () => {
  try {
    localStorage.setItem('forma-wishlist', JSON.stringify(wishlist))
  } catch {
    /* Fallback to in-memory state */
  }
  $$('.wishlist-count').forEach(node => {
    node.textContent = String(wishlist.length)
  })
  const addAllBtn = $('.wishlist-add-all-btn')
  if (addAllBtn) addAllBtn.hidden = wishlist.length === 0

  $$('.product-card').forEach(card => {
    const btn = $('.wishlist-card-btn', card)
    if (!btn) return
    const saved = wishlist.some(item => item.name === card.dataset.product)
    btn.classList.toggle('is-saved', saved)
    btn.setAttribute('aria-pressed', String(saved))
  })

  const box = $('.wishlist-items')
  if (!box) return
  box.innerHTML = wishlist.length
    ? wishlist
        .map(
          (item, idx) =>
            `<div class="bag-item"><img src="${item.image}" alt=""><div><span class="bag-item-sub">${item.category || 'ATELIER EDIT'}</span><strong class="bag-item-title">${item.name}</strong><button type="button" data-move-to-bag="${idx}">+ MOVE TO BAG</button></div><div>INR ${Number(item.price).toLocaleString('en-IN')}<br><button type="button" data-remove-wish="${idx}">REMOVE</button></div></div>`
        )
        .join('')
    : `<div class="bag-empty-card"><p class="bag-empty">No saved pieces yet.</p><p class="bag-empty-sub">Tap the heart icon on any garment to curate your personal archive.</p></div>`
}

// Inject floating Heart Wishlist buttons onto all 40 product cards
$$('.product-card').forEach(card => {
  const photo = $('.product-photo', card)
  if (!photo || $('.wishlist-card-btn', photo)) return
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'wishlist-card-btn'
  btn.title = 'Save to Archive'
  btn.setAttribute('aria-label', `Save ${card.dataset.product}`)
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
  btn.addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    const name = card.dataset.product
    const price = card.dataset.price
    const image = $('img', card)?.src || ''
    const category = $('.product-meta p', card)?.textContent || 'ATELIER EDIT'
    const existingIdx = wishlist.findIndex(i => i.name === name)
    if (existingIdx >= 0) {
      wishlist.splice(existingIdx, 1)
      announce(`${name} removed from saved pieces`)
    } else {
      wishlist.push({ name, price, image, category })
      announce(`${name} saved to your archive`)
    }
    updateWishlistUI()
  })
  photo.appendChild(btn)
})
updateWishlistUI()

$('.wishlist-items')?.addEventListener('click', e => {
  const moveBtn = e.target.closest('[data-move-to-bag]')
  if (moveBtn) {
    const idx = Number(moveBtn.dataset.moveToBag)
    const item = wishlist[idx]
    if (item) {
      addProductToBag(item)
      wishlist.splice(idx, 1)
      updateWishlistUI()
    }
    return
  }
  const remBtn = e.target.closest('[data-remove-wish]')
  if (remBtn) {
    wishlist.splice(Number(remBtn.dataset.removeWish), 1)
    updateWishlistUI()
  }
})

$('.wishlist-add-all-btn')?.addEventListener('click', () => {
  if (!wishlist.length) return
  wishlist.forEach(item => addProductToBag(item))
  wishlist = []
  updateWishlistUI()
  openPanel(bagPanel)
})

// Live SQL Database Health & Orders Query
const loadSQLOrders = async (searchTerm = '') => {
  const listEl = $('.orders-list')
  if (!listEl) return
  listEl.innerHTML = '<p class="bag-empty-sub">Querying SQLite relational database...</p>'

  let dbOrders = []
  try {
    const healthRes = await fetch('/api/health')
    if (healthRes.ok) {
      const h = await healthRes.json()
      if (h.stats) {
        $('#sql-stat-products').textContent = String(h.stats.products)
        $('#sql-stat-orders').textContent = String(h.stats.orders)
        $('#sql-stat-subs').textContent = (14200 + Number(h.stats.subscribers || 0)).toLocaleString('en-IN')
      }
    }
    const q = searchTerm
      ? searchTerm.includes('@')
        ? `?email=${encodeURIComponent(searchTerm)}`
        : `?ref=${encodeURIComponent(searchTerm)}`
      : ''
    const res = await fetch(`/api/orders${q}`)
    if (res.ok) {
      const data = await res.json()
      dbOrders = data.orders || []
    }
  } catch {
    /* Offline/static fallback */
  }

  let localOrders = []
  try {
    localOrders = JSON.parse(localStorage.getItem('forma-orders') || '[]')
  } catch {
    localOrders = []
  }
  const allOrders = [...dbOrders]
  localOrders.forEach(lo => {
    if (!allOrders.some(o => o.order_ref === lo.order_ref)) allOrders.unshift(lo)
  })

  const filtered = searchTerm
    ? allOrders.filter(
        o =>
          (o.order_ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allOrders

  listEl.innerHTML = filtered.length
    ? filtered
        .map(
          o => `
        <article class="sql-order-card">
          <div class="sql-order-top">
            <span class="sql-order-ref">ORDER #${o.order_ref}</span>
            <span class="sql-order-status">✓ ${o.order_status || 'CONFIRMED · SQL PERSISTED'}</span>
          </div>
          <div class="sql-order-meta">
            <span><strong>Client:</strong> ${o.first_name || ''} ${o.last_name || ''} (${o.customer_email || ''}) · ${o.city || 'India'}</span>
            <span><strong>Total:</strong> INR ${Number(o.total_inr || 0).toLocaleString('en-IN')} (${(o.payment_method || 'UPI').toUpperCase()})</span>
          </div>
          <div class="sql-order-items">
            ${(o.items || [])
              .map(
                i =>
                  `<span class="sql-order-pill">${i.product_name || i.name} × ${i.quantity} (INR ${Number(i.line_total_inr || Number(i.price) * i.quantity).toLocaleString('en-IN')})</span>`
              )
              .join('')}
          </div>
        </article>`
        )
        .join('')
    : '<div class="bag-empty-card"><p class="bag-empty">No matching orders found in SQL table.</p></div>'
}

$('.orders-lookup-form')?.addEventListener('submit', e => {
  e.preventDefault()
  const val = $('.orders-lookup-input')?.value.trim() || ''
  loadSQLOrders(val)
})

// Check SQL connection on boot
fetch('/api/health')
  .then(r => (r.ok ? r.json() : null))
  .then(data => {
    if (data && data.ok) {
      $$('.sql-status-text').forEach(el => {
        el.textContent = `SQL DB LIVE (${data.stats.products} ITEMS)`
      })
    }
  })
  .catch(() => {})

/* ==========================================================================
   9. Shopping Bag & Quick View Logic
   ========================================================================== */

let bag = []
try {
  const savedBag = JSON.parse(sessionStorage.getItem('forma-bag') || '[]')
  bag = Array.isArray(savedBag)
    ? savedBag.map(item => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }))
    : []
} catch {
  bag = []
}

const updateBag = (bump = false) => {
  try {
    sessionStorage.setItem('forma-bag', JSON.stringify(bag))
  } catch {
    /* Bag still works until the page is closed. */
  }
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0)
  $$('.bag-count').forEach(node => {
    node.textContent = itemCount
    if (bump) {
      node.classList.add('is-bumping')
      setTimeout(() => node.classList.remove('is-bumping'), 380)
    }
  })

  const items = $('.bag-items')
  items.innerHTML = bag.length
    ? bag
        .map(
          (item, index) =>
            `<div class="bag-item"><img src="${item.image}" alt=""><div><span class="bag-item-sub">FORMA ATELIER · READY TO SHIP</span><strong class="bag-item-title">${item.name}</strong><div class="bag-quantity"><button type="button" data-quantity="-1" data-index="${index}" aria-label="Remove one ${item.name}">−</button><span>Qty ${item.quantity}</span><button type="button" data-quantity="1" data-index="${index}" aria-label="Add one ${item.name}">+</button></div></div><div>INR ${(Number(item.price) * item.quantity).toLocaleString('en-IN')}<br><button type="button" data-remove="${index}">REMOVE</button></div></div>`
        )
        .join('')
    : `<div class="bag-empty-card"><span class="bag-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span><p class="bag-empty">Your bag is taking a quiet moment.</p><p class="bag-empty-sub">Find a signature piece crafted to be worn on repeat.</p><div class="bag-empty-links"><a href="#women" class="bag-quick-nav" data-bag-nav>WOMEN'S EDIT <span>↗</span></a><a href="#men-products" class="bag-quick-nav" data-bag-nav>MEN'S EDIT <span>↗</span></a></div></div>`

  const total = bag.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  $('.bag-total strong').textContent = `INR ${total.toLocaleString('en-IN')}`

  const clearBtn = $('.bag-clear-btn')
  if (clearBtn) clearBtn.hidden = bag.length === 0

  const deliveryVal = $('.bag-delivery-val')
  if (deliveryVal) {
    deliveryVal.textContent =
      total === 0 ? 'INR 99 (Free over INR 4,000)' : total >= FREE_DELIVERY_FROM ? 'Complimentary ✓' : 'INR 99'
  }

  const shippingMeter = $('.bag-shipping-meter')
  const shippingFill = $('.bag-shipping-fill')
  const shippingText = $('.bag-shipping-text')
  const shippingPct = $('.bag-shipping-pct')
  if (shippingFill && shippingText) {
    const pct = Math.min(100, Math.round((total / FREE_DELIVERY_FROM) * 100))
    shippingFill.style.width = `${pct}%`
    if (shippingPct) shippingPct.textContent = `${pct}%`
    if (shippingMeter) shippingMeter.classList.toggle('is-unlocked', total >= FREE_DELIVERY_FROM)
    if (total === 0) {
      shippingText.textContent = `Complimentary delivery on orders over INR ${FREE_DELIVERY_FROM.toLocaleString('en-IN')}`
    } else if (total >= FREE_DELIVERY_FROM) {
      shippingText.textContent = '✓ Complimentary delivery & garment bag unlocked'
    } else {
      shippingText.textContent = `Add INR ${(FREE_DELIVERY_FROM - total).toLocaleString('en-IN')} more for complimentary delivery`
    }
  }
}
updateBag()

const addProductToBag = ({ name, price, image }, triggerButton = null) => {
  const existing = bag.find(item => item.name === name)
  if (existing) existing.quantity += 1
  else bag.push({ name, price, image, quantity: 1 })
  updateBag(true)
  announce(`${name} added to your bag`)

  if (triggerButton && triggerButton.classList.contains('quick-add')) {
    const originalHTML = triggerButton.innerHTML
    triggerButton.classList.add('is-added')
    triggerButton.innerHTML = 'ADDED TO BAG <span>✓</span>'
    setTimeout(() => {
      triggerButton.classList.remove('is-added')
      triggerButton.innerHTML = originalHTML
    }, 1300)
  }
}

let activeQuickViewProduct = null

const openQuickView = card => {
  if (!quickViewModal || !card) return
  const name = card.dataset.product
  const price = Number(card.dataset.price)
  const image = $('img', card)?.src || ''
  const badge = $('.badge', card)?.textContent || 'FORMA EDIT'
  const category = $('.product-meta p', card)?.textContent || 'ATELIER COLLECTION'

  activeQuickViewProduct = { name, price: card.dataset.price, image }

  $('.qv-image', quickViewModal).src = image
  $('.qv-image', quickViewModal).alt = name
  $('.qv-badge', quickViewModal).textContent = badge
  $('.qv-category', quickViewModal).textContent = category
  $('.qv-title', quickViewModal).textContent = name
  $('.qv-price', quickViewModal).textContent = `INR ${price.toLocaleString('en-IN')}`

  openPanel(quickViewModal)
}

if (quickViewModal) {
  $$('.qv-swatch', quickViewModal).forEach(swatch => {
    swatch.addEventListener('click', () => {
      $$('.qv-swatch', quickViewModal).forEach(s => s.classList.remove('is-selected'))
      swatch.classList.add('is-selected')
      $('.qv-shade-name', quickViewModal).textContent = swatch.dataset.shade
    })
  })

  $$('.qv-size', quickViewModal).forEach(sizeBtn => {
    sizeBtn.addEventListener('click', () => {
      $$('.qv-size', quickViewModal).forEach(s => s.classList.remove('is-selected'))
      sizeBtn.classList.add('is-selected')
      $('.qv-size-name', quickViewModal).textContent = sizeBtn.dataset.size
    })
  })

  $('.qv-add-btn', quickViewModal)?.addEventListener('click', () => {
    if (!activeQuickViewProduct) return
    addProductToBag(activeQuickViewProduct)
    closePanels()
  })
}

document.addEventListener('click', event => {
  const addButton = event.target.closest('.quick-add')
  if (addButton) {
    event.preventDefault()
    event.stopPropagation()
    const card = addButton.closest('.product-card')
    const image = $('img', card)
    addProductToBag(
      { name: card.dataset.product, price: card.dataset.price, image: image.src },
      addButton
    )
    return
  }

  const qvButton = event.target.closest('.quick-view-btn')
  if (qvButton) {
    event.preventDefault()
    event.stopPropagation()
    openQuickView(qvButton.closest('.product-card'))
    return
  }

  const quickShopBtn = event.target.closest('[data-quick-shop]')
  if (quickShopBtn) {
    event.preventDefault()
    const targetName = quickShopBtn.dataset.quickShop
    const targetCard = $$('.product-card').find(c => c.dataset.product === targetName)
    if (targetCard) openQuickView(targetCard)
    return
  }

  const photoClick = event.target.closest('.product-photo > img')
  if (photoClick) {
    openQuickView(photoClick.closest('.product-card'))
    return
  }

  const removeButton = event.target.closest('[data-remove]')
  if (removeButton) {
    bag.splice(Number(removeButton.dataset.remove), 1)
    updateBag()
    return
  }

  const upsellButton = event.target.closest('[data-upsell-name]')
  if (upsellButton) {
    addProductToBag({
      name: upsellButton.dataset.upsellName,
      price: upsellButton.dataset.upsellPrice,
      image: upsellButton.dataset.upsellImg
    })
    return
  }

  const clearAllBtn = event.target.closest('.bag-clear-btn')
  if (clearAllBtn) {
    bag = []
    updateBag()
    announce('Your shopping bag has been cleared')
    return
  }

  const bagNavLink = event.target.closest('[data-bag-nav]')
  if (bagNavLink) {
    closePanels()
    return
  }

  const quantityButton = event.target.closest('[data-quantity]')
  if (quantityButton) {
    const index = Number(quantityButton.dataset.index)
    const item = bag[index]
    if (!item) return
    item.quantity += Number(quantityButton.dataset.quantity)
    if (item.quantity <= 0) bag.splice(index, 1)
    updateBag()
  }
})

$('.checkout-button').addEventListener('click', () => {
  const targetUrl = window.location.pathname.includes('/html/') ? 'checkout.html' : 'html/checkout.html'
  window.location.assign(targetUrl)
})

/* ==========================================================================
   10. Live Search & Suggestion Chips
   ========================================================================== */

const searchInput = $('.search-input')
const resultBox = $('.search-results')
const searchableCards = $$('.product-card')

const runSearch = () => {
  const term = searchInput.value.trim().toLowerCase()
  if (!term) {
    resultBox.innerHTML = ''
    return
  }
  const matches = searchableCards
    .filter(card =>
      `${card.dataset.product} ${$('.product-meta p', card).textContent}`
        .toLowerCase()
        .includes(term)
    )
    .slice(0, 8)
  resultBox.innerHTML = matches.length
    ? matches
        .map(
          card =>
            `<button class="search-result" type="button" data-find="${card.dataset.product}">${card.dataset.product}<span>INR ${Number(card.dataset.price).toLocaleString('en-IN')}</span></button>`
        )
        .join('')
    : '<p class="bag-empty">No pieces found. Try another search.</p>'
}

searchInput.addEventListener('input', runSearch)

$$('[data-suggest]').forEach(chip => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.dataset.suggest
    runSearch()
  })
})

resultBox.addEventListener('click', event => {
  const match = event.target.closest('[data-find]')
  if (!match) return
  const card = searchableCards.find(item => item.dataset.product === match.dataset.find)
  closePanels()
  if (card) {
    // Ensure card is visible if filtered
    card.classList.remove('is-filtered-out')
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card.classList.add('search-highlight')
    setTimeout(() => card.classList.remove('search-highlight'), 1800)
  }
})

/* ==========================================================================
   11. Newsletter Form Submission, Interest Pills & Reveal Observer
   ========================================================================== */

// Interactive Story Philosophy Pillar Tabs
$$('.story-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.story-tab').forEach(t => {
      t.classList.remove('is-active')
      t.setAttribute('aria-pressed', 'false')
    })
    tab.classList.add('is-active')
    tab.setAttribute('aria-pressed', 'true')

    const detailEl = $('#story-tab-detail')
    const kickerEl = $('#story-craft-kicker')
    const titleEl = $('#story-craft-title')
    const noteEl = $('#story-craft-note')

    if (detailEl && tab.dataset.storyBody) detailEl.textContent = tab.dataset.storyBody
    if (kickerEl && tab.dataset.storyKicker) kickerEl.textContent = tab.dataset.storyKicker
    if (titleEl && tab.dataset.storyTitle) titleEl.textContent = tab.dataset.storyTitle
    if (noteEl && tab.dataset.storyNote) noteEl.textContent = tab.dataset.storyNote
  })
})

$$('.interest-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    $$('.interest-pill').forEach(p => p.classList.remove('is-active'))
    pill.classList.add('is-active')

    const previewImg = $('.newsletter-preview-img')
    const sealText = $('#newsletter-seal-text')
    const quoteText = $('#newsletter-quote-text')

    if (previewImg && pill.dataset.previewImg && previewImg.src !== pill.dataset.previewImg) {
      previewImg.classList.add('is-switching')
      setTimeout(() => {
        previewImg.src = pill.dataset.previewImg
        previewImg.classList.remove('is-switching')
      }, 160)
    }
    if (sealText && pill.dataset.previewSeal) {
      sealText.textContent = pill.dataset.previewSeal
    }
    if (quoteText && pill.dataset.previewQuote) {
      quoteText.textContent = pill.dataset.previewQuote
    }
  })
})

$('.newsletter-form').addEventListener('submit', event => {
  event.preventDefault()
  const form = event.currentTarget
  const input = $('#email')
  const msg = $('.form-message')
  const submitBtn = $('button[type="submit"]', form)
  const selectedEdition = $('.interest-pill.is-active')?.dataset.interest || 'All Dispatches'

  if (!input.value.trim() || !input.checkValidity()) {
    msg.classList.remove('is-success')
    msg.textContent = 'Please enter a valid email address to receive your studio invitation.'
    input.focus()
    return
  }

  // Persist subscriber to SQL database (/api/newsletter)
  fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.value.trim(), edition: selectedEdition })
  })
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (data && data.total_subscribers) {
        const subCountEl = $('.subscriber-count')
        if (subCountEl) {
          subCountEl.textContent = `JOIN ${Number(data.total_subscribers).toLocaleString('en-IN')}+ READERS`
        }
      }
    })
    .catch(() => {})

  msg.classList.add('is-success')
  msg.textContent = `✓ Saved to SQL Studio Registry (${selectedEdition}). Use privilege code ATELIER10 at checkout.`
  if (submitBtn) {
    const originalHTML = submitBtn.innerHTML
    submitBtn.classList.add('is-subscribed')
    submitBtn.innerHTML = '<span class="submit-text">INVITATION SENT</span><span class="submit-arrow" aria-hidden="true">✓</span>'
    setTimeout(() => {
      submitBtn.classList.remove('is-subscribed')
      submitBtn.innerHTML = originalHTML
    }, 3200)
  }
  announce(`Subscribed to Letters from the Studio (${selectedEdition})`)
  form.reset()
})

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  $$('.reveal').forEach(node => observer.observe(node))
} else {
  $$('.reveal').forEach(node => node.classList.add('is-visible'))
}

// Initialize all motion controllers
const initThemeToggle = () => {
  const toggles = $$('[data-theme-toggle]')
  const themeMeta = $('meta[name="theme-color"]')

  const applyTheme = (theme, notify = false) => {
    const isDark = theme === 'dark'
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#121210' : '#f4f1e9')
    }
    toggles.forEach(btn => {
      btn.setAttribute('aria-pressed', String(isDark))
      const label = $('.theme-toggle-label', btn)
      if (label) label.textContent = isDark ? 'NIGHT' : 'DAY'
    })
    try {
      localStorage.setItem('forma-theme', isDark ? 'dark' : 'light')
    } catch {}
    if (notify) {
      announce(isDark ? 'Switched to Night Atelier theme' : 'Switched to Day Atelier theme')
    }
  }

  let initialTheme = document.documentElement.getAttribute('data-theme')
  if (!initialTheme) {
    try {
      initialTheme = localStorage.getItem('forma-theme')
    } catch {}
  }
  applyTheme(initialTheme === 'dark' ? 'dark' : 'light', false)

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      applyTheme(current === 'dark' ? 'light' : 'dark', true)
    })
  })
}

initThemeToggle()
initSplitText()
initScrollEngine()
initMagneticAndTilt()
initHeroLookbook()
initCounters()
initTestimonialsCarousel()
initCollectionFilters()
