import { api, type BookingCreated } from './api'

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; contact: string }
  notes: Record<string, string>
  theme: { color: string }
  handler: (response: RazorpayResponse) => void
  modal: { ondismiss: () => void }
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, cb: (payload: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise: Promise<void> | null = null

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the payment window. Please check your connection.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Opens Razorpay Checkout and resolves once the server has verified the
 * signature. Rejects if the customer closes the window or verification fails.
 */
export async function payForBooking(booking: BookingCreated, deityName: string) {
  if (!booking.razorpayEnabled || !booking.orderId || !booking.razorpayKeyId) {
    // Offline mode: the server already recorded the booking as confirmed.
    return booking.ref
  }

  await loadCheckout()
  if (!window.Razorpay) throw new Error('Payment window is unavailable. Please try again.')

  return new Promise<string>((resolve, reject) => {
    let settled = false
    const rzp = new window.Razorpay!({
      key: booking.razorpayKeyId!,
      amount: booking.amountPaise,
      currency: 'INR',
      name: 'SriPrasadam',
      description: `${deityName} — prasadam booking ${booking.ref}`,
      order_id: booking.orderId!,
      prefill: booking.prefill,
      notes: { booking_ref: booking.ref },
      theme: { color: '#2B3A67' },
      handler: (response) => {
        settled = true
        api
          .verifyPayment({ ...response })
          .then((res) => resolve(res.ref))
          .catch(reject)
      },
      modal: {
        ondismiss: () => {
          if (settled) return
          void api.paymentFailed(booking.orderId!).catch(() => {})
          reject(new Error('Payment was cancelled. Your booking is saved and can be paid for later.'))
        },
      },
    })
    rzp.on('payment.failed', () => {
      if (settled) return
      settled = true
      void api.paymentFailed(booking.orderId!).catch(() => {})
      reject(new Error('The payment did not go through. Please try again or use another method.'))
    })
    rzp.open()
  })
}
