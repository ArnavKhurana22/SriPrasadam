export const PHONE_DISPLAY = '+91 92202 45424'
export const PHONE_HREF = 'tel:+919220245424'
export const HOURS = '9 am to 5 pm, Monday to Saturday'

export function rupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatTimestamp(value: string) {
  // SQLite datetime('now') returns UTC without a timezone marker.
  const d = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const STATUS_STEPS = ['booked', 'puja_done', 'dispatched', 'delivered'] as const

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  booked: 'Booked',
  puja_done: 'Puja performed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const STATUS_BLURB: Record<string, string> = {
  pending_payment: 'Your booking is saved. Complete the payment to confirm it.',
  booked: 'We have your booking. Your name and gotra go to the pandit ji.',
  puja_done: 'The puja is done and your prasadam has been offered. The video is on its way.',
  dispatched: 'Your prasadam has left for delivery.',
  delivered: 'Delivered. Thank you for offering through SriPrasadam.',
  cancelled: 'This booking was cancelled.',
}

export function deityImage(deityId: string) {
  return `/deities/${deityId}.svg`
}

/** Expected delivery window: 4–5 days from the puja date. */
export function deliveryWindow(pujaDate: string) {
  const d = new Date(`${pujaDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const from = new Date(d)
  from.setDate(from.getDate() + 4)
  const to = new Date(d)
  to.setDate(to.getDate() + 5)
  const toIso = to.toISOString().slice(0, 10)
  // Within one month, say "4–5 September" rather than repeating the month.
  const fromLabel =
    from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
      ? String(from.getDate())
      : formatDateShort(from.toISOString().slice(0, 10))
  return `${fromLabel} – ${formatDate(toIso)}`
}
