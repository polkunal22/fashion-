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
const formatINR = value => `INR ${Number(value).toLocaleString('en-IN')}`

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
  const shipping = sub === 0 || sub >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE

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
  $('.summary-shipping').textContent = shipping ? formatINR(shipping) : 'Complimentary'
  $('.summary-grand-total').textContent = formatINR(sub + shipping)

  $('.shipping-message').textContent = !sub
    ? 'Add a piece to see delivery options.'
    : sub >= FREE_DELIVERY_FROM
      ? 'Your order qualifies for complimentary delivery.'
      : `Add ${formatINR(FREE_DELIVERY_FROM - sub)} more for complimentary delivery.`

  $('.shipping-progress').classList.toggle('is-qualified', sub >= FREE_DELIVERY_FROM && sub > 0)
  const shippingBarFill = $('.shipping-bar-fill')
  if (shippingBarFill) {
    const pct = Math.min(100, Math.round((sub / FREE_DELIVERY_FROM) * 100))
    shippingBarFill.style.width = `${pct}%`
  }

  $('#checkout-form').hidden = cart.length === 0
  $('.empty-checkout').hidden = cart.length !== 0
}

renderSummary()

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

checkoutForm.addEventListener('submit', event => {
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
    submitLabel.textContent = 'PREPARING ORDER REVIEW...'
  }

  setTimeout(() => {
    form.hidden = true
    $('.checkout-intro').hidden = true
    $('.demo-notice').hidden = true
    $('.checkout-kicker').hidden = true
    $('.checkout-main > .eyebrow').hidden = true
    $('#checkout-title').hidden = true
    $('.order-success').hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 420)
})
