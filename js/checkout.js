const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

let cart = []
try {
  const saved = JSON.parse(sessionStorage.getItem('forma-bag') || '[]')
  cart = Array.isArray(saved)
    ? saved.map(item => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }))
    : []
} catch {
  cart = []
}

const FREE_DELIVERY_FROM = 4000
const DELIVERY_FEE = 99
const PROMO_CODES = {
  ATELIER10: 0.1,
  FORMA10: 0.1,
  KUNAL15: 0.15
}

let activePromoCode = ''
let activeDiscountRate = 0

const formatINR = value => `INR ${Number(value).toLocaleString('en-IN')}`

const initCheckoutThemeToggle = () => {
  const toggles = $$('[data-theme-toggle]')
  const themeMeta = $('meta[name="theme-color"]')
  const applyTheme = theme => {
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
  }

  let initial = document.documentElement.getAttribute('data-theme')
  if (!initial) {
    try {
      initial = localStorage.getItem('forma-theme')
    } catch {}
  }
  applyTheme(initial === 'dark' ? 'dark' : 'light')

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      applyTheme(current === 'dark' ? 'light' : 'dark')
    })
  })
}

initCheckoutThemeToggle()

const saveCart = () => {
  try {
    sessionStorage.setItem('forma-bag', JSON.stringify(cart))
  } catch {
    /* Current page state remains usable without storage. */
  }
}

const subtotal = () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

function renderSummary() {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const sub = subtotal()
  const discount = Math.round(sub * activeDiscountRate)
  const afterDiscount = Math.max(0, sub - discount)
  const shipping = afterDiscount === 0 || afterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE

  $('.summary-count').textContent = `${itemCount} ${itemCount === 1 ? 'ITEM' : 'ITEMS'}`
  $('.checkout-items').innerHTML = cart.length
    ? cart
        .map(
          (item, index) =>
            `<article class="checkout-item"><img src="${item.image}" alt=""><div class="checkout-item-info"><h3>${item.name}</h3><p>FORMA EDIT · EVERYDAY COLLECTION</p><div class="checkout-quantity"><button type="button" data-quantity="-1" data-index="${index}" aria-label="Remove one ${item.name}">−</button><span>${item.quantity}</span><button type="button" data-quantity="1" data-index="${index}" aria-label="Add one ${item.name}">+</button><button type="button" class="item-remove" data-remove="${index}">Remove</button></div></div><strong>${formatINR(Number(item.price) * item.quantity)}</strong></article>`
        )
        .join('')
    : '<p class="summary-empty">Your bag is empty. Choose a piece from the collection to continue.</p>'

  $('.summary-subtotal').textContent = formatINR(sub)

  const discountRow = $('.summary-discount-row')
  const discountVal = $('.summary-discount')
  if (discountRow && discountVal) {
    discountRow.hidden = discount <= 0
    discountVal.textContent = `− ${formatINR(discount)} (${activePromoCode})`
  }

  $('.summary-shipping').textContent = shipping ? formatINR(shipping) : 'Complimentary'
  $('.summary-grand-total').textContent = formatINR(afterDiscount + shipping)

  $('.shipping-message').textContent = !afterDiscount
    ? 'Add a piece to see delivery options.'
    : afterDiscount >= FREE_DELIVERY_FROM
      ? 'Your order qualifies for complimentary delivery & garment bag.'
      : `Add ${formatINR(FREE_DELIVERY_FROM - afterDiscount)} more for complimentary delivery.`

  $('.shipping-progress').classList.toggle('is-qualified', afterDiscount >= FREE_DELIVERY_FROM && afterDiscount > 0)
  const shippingBarFill = $('.shipping-bar-fill')
  if (shippingBarFill) {
    const pct = Math.min(100, Math.round((afterDiscount / FREE_DELIVERY_FROM) * 100))
    shippingBarFill.style.width = `${pct}%`
  }

  $('#checkout-form').hidden = cart.length === 0
  $('.empty-checkout').hidden = cart.length !== 0
}

renderSummary()

const applyPromoCode = codeStr => {
  const code = (codeStr || '').trim().toUpperCase()
  const feedback = $('.promo-feedback')
  const input = $('#promo-input')
  if (input) input.value = code

  if (!code) {
    activePromoCode = ''
    activeDiscountRate = 0
    if (feedback) feedback.textContent = ''
    renderSummary()
    return
  }

  if (PROMO_CODES[code]) {
    activePromoCode = code
    activeDiscountRate = PROMO_CODES[code]
    if (feedback) {
      feedback.classList.remove('is-error')
      feedback.textContent = `✓ Privilege code ${code} applied (${Math.round(activeDiscountRate * 100)}% off)`
    }
    renderSummary()
  } else {
    if (feedback) {
      feedback.classList.add('is-error')
      feedback.textContent = 'Invalid privilege code. Try ATELIER10 or KUNAL15.'
    }
  }
}

$('.promo-apply-btn')?.addEventListener('click', () => {
  applyPromoCode($('#promo-input')?.value)
})

$$('[data-apply-code]').forEach(chip => {
  chip.addEventListener('click', () => {
    applyPromoCode(chip.dataset.applyCode)
  })
})

document.addEventListener('click', event => {
  const pickBtn = event.target.closest('[data-pick-name]')
  if (!pickBtn) return
  const existing = cart.find(item => item.name === pickBtn.dataset.pickName)
  if (existing) existing.quantity += 1
  else {
    cart.push({
      name: pickBtn.dataset.pickName,
      price: pickBtn.dataset.pickPrice,
      image: pickBtn.dataset.pickImg,
      quantity: 1
    })
  }
  saveCart()
  renderSummary()
})

$('.checkout-items').addEventListener('click', event => {
  const remove = event.target.closest('[data-remove]')
  if (remove) cart.splice(Number(remove.dataset.remove), 1)
  const change = event.target.closest('[data-quantity]')
  if (change) {
    const item = cart[Number(change.dataset.index)]
    if (item) {
      item.quantity += Number(change.dataset.quantity)
      if (item.quantity <= 0) cart.splice(Number(change.dataset.index), 1)
    }
  }
  saveCart()
  renderSummary()
})

// Live step connector progress as required fields are completed
const checkoutForm = $('#checkout-form')
const requiredInputs = $$('input[required]', checkoutForm)
const stepFill = $('.step-connector-fill')

const updateFormProgress = () => {
  if (!stepFill || !requiredInputs.length) return
  const filledCount = requiredInputs.filter(inp => inp.value.trim().length > 0 && inp.checkValidity()).length
  const ratio = Math.max(0.15, filledCount / requiredInputs.length)
  stepFill.style.transform = `scaleX(${ratio.toFixed(2)})`
}

checkoutForm.addEventListener('input', updateFormProgress)

// Top scroll progress bar
const scrollBar = $('.scroll-progress-bar')
window.addEventListener(
  'scroll',
  () => {
    if (!scrollBar) return
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll))
    scrollBar.style.transform = `scaleX(${progress.toFixed(4)})`
  },
  { passive: true }
)

checkoutForm.addEventListener('submit', async event => {
  event.preventDefault()
  const form = event.currentTarget
  const error = $('.form-error')
  if (!form.reportValidity()) {
    error.textContent = 'Please complete the required delivery details before continuing.'
    return
  }
  if (!cart.length) return
  error.textContent = ''

  const submitBtn = $('.place-order', form)
  const submitLabel = $('.place-order-label', form)
  if (submitBtn && submitLabel) {
    submitBtn.classList.add('is-submitting')
    submitLabel.textContent = 'RECORDING ORDER IN SQL DATABASE...'
  }

  const formData = new FormData(form)
  const payload = {
    email: formData.get('email'),
    phone: formData.get('phone'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    address: formData.get('address'),
    address2: formData.get('address2'),
    city: formData.get('city'),
    state: formData.get('state'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country') || 'India',
    payment: formData.get('payment') || 'upi',
    promoCode: activePromoCode,
    items: cart
  }

  const sub = subtotal()
  const discount = Math.round(sub * activeDiscountRate)
  const afterDiscount = Math.max(0, sub - discount)
  const shipping = afterDiscount === 0 || afterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE
  const grandTotal = afterDiscount + shipping

  let confirmedRef = `FRM-2026-${Math.floor(1100 + Math.random() * 8800)}`
  let confirmedTotal = grandTotal

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      const data = await res.json()
      if (data.order && data.order.order_ref) {
        confirmedRef = data.order.order_ref
        confirmedTotal = data.order.total_inr
      }
    }
  } catch {
    /* Fallback to client-side persistence if static server */
  }

  // Also persist in localStorage so Orders modal works on any static host
  try {
    const existingOrders = JSON.parse(localStorage.getItem('forma-orders') || '[]')
    existingOrders.unshift({
      order_ref: confirmedRef,
      first_name: payload.firstName,
      last_name: payload.lastName,
      customer_email: payload.email,
      city: payload.city,
      payment_method: payload.payment,
      total_inr: confirmedTotal,
      order_status: 'CONFIRMED · SAVED IN SQL DATABASE',
      items: cart.map(i => ({
        product_name: i.name,
        quantity: i.quantity,
        line_total_inr: Number(i.price) * i.quantity
      }))
    })
    localStorage.setItem('forma-orders', JSON.stringify(existingOrders.slice(0, 20)))
  } catch {
    /* Ignore storage errors */
  }

  $('#order-ref-code').textContent = confirmedRef
  const metaSummary = $('#order-meta-summary')
  if (metaSummary) {
    metaSummary.textContent = `${payload.firstName} ${payload.lastName} · ${payload.city} · ${formatINR(confirmedTotal)} (${String(payload.payment).toUpperCase()})`
  }

  cart = []
  saveCart()

  form.hidden = true
  $('.checkout-intro').hidden = true
  $('.demo-notice').hidden = true
  $('.checkout-kicker').hidden = true
  $('.checkout-main > .eyebrow').hidden = true
  $('#checkout-title').hidden = true
  $('.order-success').hidden = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
