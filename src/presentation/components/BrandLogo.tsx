export function BrandLogo({ className = 'h-12' }: { className?: string }) {
  return (
    <img
      src="/logo-full-lock.webp"
      alt="Full Lock. Rastreamento e monitoramento."
      width={420}
      height={168}
      className={`mx-auto w-auto max-w-full object-contain ${className}`}
    />
  )
}

export function LogoFrame({ className = 'h-12' }: { className?: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-logo px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      <BrandLogo className={className} />
    </div>
  )
}
