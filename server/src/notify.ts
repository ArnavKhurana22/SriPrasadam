/**
 * All outbound messaging funnels through here so an SMS/WhatsApp provider
 * (MSG91, Twilio, WhatsApp Cloud API) can be dropped in behind one function
 * without touching the routes.
 *
 * Until a provider is configured, messages are written to the server console.
 */

type Message = {
  mobile: string
  text: string
  kind: 'otp' | 'booking_confirmed' | 'status_update'
}

export async function sendMessage({ mobile, text, kind }: Message) {
  // TODO: replace with a real provider call, e.g.
  //   await fetch('https://api.msg91.com/api/v5/flow/', { ... })
  console.log(`\n[notify:${kind}] → +91${mobile}\n${text}\n`)
}

export function otpText(code: string) {
  return `${code} is your SriPrasadam verification code. It is valid for 10 minutes. Please do not share it with anyone.`
}

export function bookingConfirmedText(ref: string, deity: string, amount: number) {
  return `Jai Shri Ram! Your prasadam booking ${ref} for ${deity} (Rs ${amount}) is confirmed. The puja video will be shared with your name and gotra, and delivery follows in 4-5 days. Track it at /track — SriPrasadam`
}

export function statusUpdateText(ref: string, status: string) {
  const label: Record<string, string> = {
    puja_done: 'the puja has been performed and your prasadam has been offered',
    dispatched: 'your prasadam has been dispatched',
    delivered: 'your prasadam has been delivered',
  }
  return `Update on booking ${ref}: ${label[status] ?? status}. — SriPrasadam`
}
