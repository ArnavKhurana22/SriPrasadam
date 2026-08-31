export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--brand)" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="var(--brand)" strokeWidth="0.8" strokeDasharray="1.5 4" />
      {/* diya flame */}
      <path
        d="M20 11c2.6 3 4.2 5.3 4.2 7.6 0 2.4-1.9 4.2-4.2 4.2s-4.2-1.8-4.2-4.2c0-2.3 1.6-4.6 4.2-7.6z"
        fill="var(--accent)"
      />
      <path d="M12.5 25.5h15c-1.3 2.6-4 4.2-7.5 4.2s-6.2-1.6-7.5-4.2z" fill="var(--ink)" />
    </svg>
  )
}
