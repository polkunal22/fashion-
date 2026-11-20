const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

const header = $('.site-header')
const menuToggle = $('.menu-toggle')
const mainNav = $('.main-nav')
const overlay = $('.overlay')
const searchPanel = $('.search-panel')
const bagPanel = $('.bag-panel')
const toast = $('.toast')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let toastTimer

const announce = message => {
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600)
}

const closePanels = () => {
  overlay.hidden = true
  searchPanel.classList.remove('is-open')
  bagPanel.classList.remove('is-open')
  searchPanel.setAttribute('aria-hidden', 'true')
  bagPanel.setAttribute('aria-hidden', 'true')
  searchPanel.setAttribute('inert', '')
  bagPanel.setAttribute('inert', '')
  document.body.classList.remove('locked')
}
const openPanel = panel => {
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
  panel.classList.add('is-open')
  panel.setAttribute('aria-hidden', 'false')
  panel.removeAttribute('inert')
  overlay.hidden = false
  document.body.classList.add('locked')
  if (panel === searchPanel) setTimeout(() => $('.search-input').focus(), 100)
}

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu')
  mainNav.classList.toggle('is-open', !expanded)
  if (!expanded && matchMedia('(max-width: 700px)').matches) setTimeout(() => mainNav.querySelector('a')?.focus(), 120)
})
$$('.main-nav a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
}))
window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true })
header.classList.add('header-ready')
header.classList.toggle('is-scrolled', window.scrollY > 20)
document.addEventListener('pointerdown', event => {
  if (!mainNav.classList.contains('is-open') || header.contains(event.target)) return
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
})
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  const menuWasOpen = mainNav.classList.contains('is-open')
  mainNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open menu')
  if (menuWasOpen) menuToggle.focus()
})
if ('IntersectionObserver' in window) {
  const navLinks = $$('.main-nav a')
  const navSections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean)
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
    if (!visible) return
    navLinks.forEach(link => {
      const active = link.hash === `#${visible.target.id}`
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
  }, { rootMargin: '-28% 0px -55% 0px', threshold: [0, .15, .35] })
  navSections.forEach(section => navObserver.observe(section))
}
const hero = $('.hero')
const heroImage = $('.hero-image')
if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    heroImage.style.transform = `scale(1.06) translate3d(${x * -12}px, ${y * -9}px, 0)`
  })
  hero.addEventListener('pointerleave', () => { heroImage.style.transform = 'scale(1.02)' })
}
$('.search-toggle').addEventListener('click', () => openPanel(searchPanel))
$('.bag-toggle').addEventListener('click', () => openPanel(bagPanel))
$$('.panel-close').forEach(button => button.addEventListener('click', closePanels))
overlay.addEventListener('click', closePanels)
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanels() })

let bag = []
try {
  const savedBag = JSON.parse(sessionStorage.getItem('forma-bag') || '[]')
  bag = Array.isArray(savedBag) ? savedBag.map(item => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) })) : []
} catch { bag = [] }
const updateBag = () => {
  try { sessionStorage.setItem('forma-bag', JSON.stringify(bag)) } catch { /* Bag still works until the page is closed. */ }
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0)
  $$('.bag-count').forEach(node => { node.textContent = itemCount })
  const items = $('.bag-items')
  items.innerHTML = bag.length ? bag.map((item, index) => `<div class="bag-item"><img src="${item.image}" alt=""><div>${item.name}<div class="bag-quantity"><button type="button" data-quantity="-1" data-index="${index}" aria-label="Remove one ${item.name}">−</button><span>Qty ${item.quantity}</span><button type="button" data-quantity="1" data-index="${index}" aria-label="Add one ${item.name}">+</button></div></div><div>INR ${(Number(item.price) * item.quantity).toLocaleString('en-IN')}<br><button type="button" data-remove="${index}">Remove</button></div></div>`).join('') : '<p class="bag-empty">Your bag is taking a quiet moment.<br/>Find a piece that feels like you.</p>'
  const total = bag.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  $('.bag-total strong').textContent = `INR ${total.toLocaleString('en-IN')}`
}
updateBag()

document.addEventListener('click', event => {
  const addButton = event.target.closest('.quick-add')
  if (addButton) {
    event.preventDefault()
    const card = addButton.closest('.product-card')
    const image = $('img', card)
    const existing = bag.find(item => item.name === card.dataset.product)
    if (existing) existing.quantity += 1
    else bag.push({ name: card.dataset.product, price: card.dataset.price, image: image.src, quantity: 1 })
    updateBag()
    announce(`${card.dataset.product} added to your bag`)
    return
  }
  const removeButton = event.target.closest('[data-remove]')
  if (removeButton) {
    bag.splice(Number(removeButton.dataset.remove), 1)
    updateBag()
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
  if (!bag.length) { announce('Add a piece to your bag before checking out.'); return }
  window.location.assign('checkout.html')
})

const searchInput = $('.search-input')
const resultBox = $('.search-results')
const searchableCards = $$('.product-card')
const runSearch = () => {
  const term = searchInput.value.trim().toLowerCase()
  if (!term) { resultBox.innerHTML = ''; return }
  const matches = searchableCards.filter(card => `${card.dataset.product} ${$('.product-meta p', card).textContent}`.toLowerCase().includes(term)).slice(0, 8)
  resultBox.innerHTML = matches.length ? matches.map(card => `<button class="search-result" type="button" data-find="${card.dataset.product}">${card.dataset.product}<span>INR ${Number(card.dataset.price).toLocaleString('en-IN')}</span></button>`).join('') : '<p class="bag-empty">No pieces found. Try another search.</p>'
}
searchInput.addEventListener('input', runSearch)
resultBox.addEventListener('click', event => {
  const match = event.target.closest('[data-find]')
  if (!match) return
  const card = searchableCards.find(item => item.dataset.product === match.dataset.find)
  closePanels()
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  card?.classList.add('search-highlight')
  setTimeout(() => card?.classList.remove('search-highlight'), 1600)
})

$('.newsletter-form').addEventListener('submit', event => {
  event.preventDefault()
  $('.form-message').textContent = "Thanks for your interest. This preview isn't connected to an email service yet."
  event.currentTarget.reset()
})

if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    observer.unobserve(entry.target)
  }), { threshold: 0.12, rootMargin: '0px 0px -45px 0px' })
  $$('.reveal').forEach(node => observer.observe(node))
} else {
  $$('.reveal').forEach(node => node.classList.add('is-visible'))
}
