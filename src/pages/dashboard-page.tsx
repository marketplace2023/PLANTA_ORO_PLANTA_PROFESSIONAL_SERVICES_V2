import { ArrowRight, BadgeCheck, Briefcase, CheckCircle2, Circle, Power, Radio, Star, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvailabilityControl } from '@/components/availability-control'
import { BarRows, DataTable, Empty, Failed, Kpi, Loading, Panel, Pill, Progress, ScreenHeader, td, type BarRow } from '@/components/kit'
import { useContractorContext } from '@/features/contractors/contractor-context'
import { useContractor } from '@/features/contractors/use-contractors'
import { CONTRACTOR_AVAILABILITY_LABELS, ratingText, specialtyLabel } from '@/lib/organizations'

export function DashboardPage() {
  const { contractor } = useContractorContext()
  const q = useContractor(contractor!.id)
  const c = q.data ?? { ...contractor!, canManage: true, myRole: contractor!.myRole, taxId: null, services: [] }
  const services = q.data?.services ?? []
  const active = services.filter((s) => s.status === 'ACTIVE')
  const inactive = services.filter((s) => s.status === 'INACTIVE')

  // Servicios activos por especialidad: lo que ven los compradores al filtrar el directorio.
  const bySpecialty = new Map<string, number>()
  for (const s of active) bySpecialty.set(s.serviceType, (bySpecialty.get(s.serviceType) ?? 0) + 1)
  const rows: BarRow[] = [...bySpecialty.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: specialtyLabel(k), value: v, color: 'var(--fur-navy-800)' }))

  const checklist: Array<{ label: string; done: boolean }> = [
    { label: 'Descripción de la empresa', done: !!c.description },
    { label: 'Ciudad', done: !!c.city },
    { label: 'Sitio web', done: !!c.website },
    { label: 'Correo de contacto', done: !!c.contactEmail },
    { label: 'Logo', done: !!c.logoUrl },
    { label: 'Certificaciones', done: c.certifications.length > 0 },
    { label: 'Al menos un servicio activo', done: active.length > 0 },
    { label: 'Servicios con etapas indicadas', done: active.length > 0 && active.every((s) => s.stages.length > 0) },
  ]
  const doneCount = checklist.filter((i) => i.done).length
  const pct = Math.round((doneCount / checklist.length) * 100)

  return (
    <>
      <ScreenHeader title="Resumen" description={`Estado de ${contractor!.organizationName} en el directorio de servicios profesionales.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Servicios activos" value={q.data ? active.length : '—'} icon={Briefcase} to="/services" tone="ok" hint="Visibles en el directorio" />
        <Kpi label="Inactivos" value={q.data ? inactive.length : '—'} icon={Power} to="/services" hint="Se conservan para reactivarlos" />
        <Kpi label="Especialidades" value={q.data ? bySpecialty.size : '—'} icon={Tags} hint="Con al menos un servicio activo" />
        <Kpi label="Disponibilidad" value={CONTRACTOR_AVAILABILITY_LABELS[c.availability]} icon={Radio} tone={c.availability === 'AVAILABLE' ? 'ok' : c.availability === 'LIMITED' ? 'warning' : 'danger'} hint="Lo que ven los compradores" />
        <Kpi label="Calificación" value={c.rating === null ? '—' : c.rating.toFixed(1)} icon={Star} hint={ratingText(c.rating)} />
        <Kpi label="Verificación" value={c.verified ? 'Verificada' : 'Sin verificar'} icon={BadgeCheck} tone={c.verified ? 'ok' : 'default'} hint={c.verified ? 'Sello del administrador' : 'La concede el administrador'} />
      </div>

      <Panel title="Tu disponibilidad" subtitle="Cámbiala cuando cambie tu capacidad: se actualiza al instante" className="mt-6">
        <AvailabilityControl contractorId={contractor!.id} value={c.availability} disabled={contractor!.status === 'SUSPENDED'} />
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Servicios activos por especialidad">{q.isLoading ? <Loading rows={3} /> : q.isError ? <Failed onRetry={() => void q.refetch()} /> : <BarRows rows={rows} empty="Aún no tienes servicios activos" />}</Panel>

        <Panel title="Perfil de la empresa" subtitle={`${doneCount} de ${checklist.length} datos completos`} action={<Link to="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-fur-navy-900 hover:underline">Completar <ArrowRight className="size-3.5" /></Link>}>
          <Progress pct={pct} label="Perfil completo" />
          <ul className="mt-3 space-y-1.5 text-sm">
            {checklist.map((i) => (
              <li key={i.label} className="flex items-center gap-2">
                {i.done ? <CheckCircle2 className="size-4 text-fur-green-500" aria-hidden /> : <Circle className="size-4 text-fur-gray-300" aria-hidden />}
                <span className={i.done ? 'text-fur-gray-800' : 'text-muted-foreground'}>{i.label}</span>
                <span className="sr-only">{i.done ? 'completo' : 'pendiente'}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Cobertura por etapas" subtitle="Etapas que cubren tus servicios activos">
          {c.stages.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">{c.stages.map((s) => <li key={s.code}><Pill label={`${s.code} · ${s.name}`} color="var(--fur-navy-700)" /></li>)}</ul>
          ) : (
            <Empty>Indica etapas en tus servicios para aparecer en esas búsquedas.</Empty>
          )}
        </Panel>
      </div>

      <Panel title="Servicios" className="mt-6" flush action={<Link to="/services" className="inline-flex items-center gap-1 text-xs font-semibold text-fur-navy-900 hover:underline">Gestionar servicios <ArrowRight className="size-3.5" /></Link>}>
        {q.isLoading ? (
          <div className="p-4"><Loading rows={3} /></div>
        ) : services.length > 0 ? (
          <DataTable head={['Servicio', 'Especialidad', 'Etapas', 'Estado']}>
            {services.slice(0, 6).map((s) => (
              <tr key={s.id}>
                <td className={`${td} font-medium text-fur-navy-900`}>{s.name}</td>
                <td className={td}>{specialtyLabel(s.serviceType)}</td>
                <td className={`${td} text-xs`}>{s.stages.map((st) => st.code).join(', ') || '—'}</td>
                <td className={td}><Pill label={s.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} color={s.status === 'ACTIVE' ? 'var(--fur-green-500)' : 'var(--fur-steel-500)'} /></td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty>Aún no tienes servicios. <Link to="/services" className="font-semibold text-fur-navy-900 underline">Crea el primero</Link>.</Empty>
        )}
      </Panel>
    </>
  )
}
