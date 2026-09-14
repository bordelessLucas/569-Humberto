export function BrandLogo({ className = 'h-[4.25rem]' }: { className?: string }) {
  return (
    <img
      src="/logo-lock-brasil.png"
      alt="Lock Brasil. Rastreamento e monitoramento."
      width={990}
      height={831}
      className={`mx-auto w-auto max-w-full object-contain ${className}`}
    />
  )
}

export function LogoFrame({ className = 'h-[4.25rem]' }: { className?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-logo p-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      <BrandLogo className={className} />
    </div>
  )
}
