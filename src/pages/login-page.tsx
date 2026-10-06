import { Navigate } from 'react-router-dom'
import { AuthForm } from '@/components/auth-form'
import { useAuth } from '@/features/auth/auth-context'

export function LoginPage() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-fur-navy-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-fur-gold-500 font-extrabold text-fur-navy-950">FUR</span>
          <span className="text-lg font-bold">Ecosistema FUR</span>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold tracking-widest text-fur-gold-400 uppercase">Servicios Profesionales</p>
          <h1 className="max-w-md text-4xl leading-tight font-bold">Ofrece tus servicios profesionales a las plantas del ecosistema.</h1>
          <p className="mt-4 max-w-md text-white/70">Publica tus servicios por especialidad y etapa del proceso, indica tu disponibilidad y mantén el perfil de tu empresa.</p>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[28px] border-fur-gold-500/15" />
      </aside>
      <main className="grid place-items-center bg-background p-6">
        <AuthForm subtitle="Accede con tu cuenta de contratista." registerSubtitle="Crea tu cuenta y registra después tu empresa contratista." />
      </main>
    </div>
  )
}
