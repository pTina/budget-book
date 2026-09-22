export function SettingsIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.2 12.9 5.5c.4.1.8.3 1.2.5l2.3-.6 1.5 1.5-.6 2.3c.2.4.4.8.5 1.2L20.8 12 18.5 12.9c-.1.4-.3.8-.5 1.2l.6 2.3-1.5 1.5-2.3-.6c-.4.2-.8.4-1.2.5L12 20.8 11.1 18.5c-.4-.1-.8-.3-1.2-.5l-2.3.6-1.5-1.5.6-2.3c-.2-.4-.4-.8-.5-1.2L3.2 12 5.5 11.1c.1-.4.3-.8.5-1.2l-.6-2.3 1.5-1.5 2.3.6c.4-.2.8-.4 1.2-.5L12 3.2Z" />
    </svg>
  )
}
