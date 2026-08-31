export type Slab = {
  id: string
  amount: number
  title: string
  tagline: string
  items: string[]
}

export type Deity = {
  id: string
  name: string
  epithet: string
  blessing: string
  keywords: string[]
}

export type PujaEvent = {
  id: string
  name: string
  date: string
  deityId: string
  description: string
}

export type Catalog = { deities: Deity[]; slabs: Slab[]; events: PujaEvent[] }

export type StatusEntry = { status: string; note: string | null; created_at: string }

export type Booking = {
  ref: string
  deityId: string
  deityName: string
  slabId: string
  slabTitle: string
  slabItems: string[]
  amount: number
  fullName: string
  gotra: string
  mobile: string
  address: string
  city: string
  pincode: string
  pujaDate: string
  eventId: string | null
  notes: string | null
  status: string
  paymentStatus: string
  videoUrl: string | null
  createdAt: string
  history: StatusEntry[]
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    ...init,
  })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : {}
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ?? 'Something went wrong. Please try again.'
    throw new ApiError(message, res.status)
  }
  return data as T
}

export const api = {
  catalog: () => request<Catalog>('/catalog'),

  requestOtp: (mobile: string) =>
    request<{ ok: true; devCode?: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    }),

  verifyOtp: (mobile: string, code: string) =>
    request<{ ok: true; user: SessionUser }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, code }),
    }),

  me: () => request<{ user: SessionUser | null }>('/auth/me'),

  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  createBooking: (payload: BookingInput) =>
    request<BookingCreated>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

  myBookings: () => request<{ bookings: Booking[] }>('/bookings'),

  trackBooking: (ref: string, mobile: string) =>
    request<{ booking: Booking }>(`/bookings/${encodeURIComponent(ref)}?mobile=${encodeURIComponent(mobile)}`),

  verifyPayment: (payload: Record<string, string>) =>
    request<{ ok: true; ref: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  paymentFailed: (orderId: string) =>
    request<{ ok: true }>('/payments/failed', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id: orderId }),
    }),

  sendMessage: (payload: { name: string; mobile: string; email?: string; message: string }) =>
    request<{ ok: true }>('/messages', { method: 'POST', body: JSON.stringify(payload) }),

  adminLogin: (password: string) =>
    request<{ ok: true }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminLogout: () => request<{ ok: true }>('/auth/admin-logout', { method: 'POST' }),

  adminBookings: (params: { status?: string; q?: string } = {}) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    const qs = search.toString()
    return request<{ bookings: Booking[]; counts: { status: string; n: number }[] }>(
      `/admin/bookings${qs ? `?${qs}` : ''}`,
    )
  },

  adminUpdateBooking: (ref: string, payload: { status?: string; videoUrl?: string; note?: string }) =>
    request<{ booking: Booking }>(`/admin/bookings/${encodeURIComponent(ref)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}

export type SessionUser = { mobile: string; fullName: string | null; gotra: string | null }

export type BookingInput = {
  deityId: string
  slabId: string
  eventId?: string | null
  fullName: string
  gotra: string
  mobile: string
  address: string
  pincode: string
  pujaDate: string
  notes?: string
}

export type BookingCreated = {
  ref: string
  amount: number
  amountPaise: number
  orderId: string | null
  razorpayKeyId: string | null
  razorpayEnabled: boolean
  prefill: { name: string; contact: string }
}
