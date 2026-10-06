import { Pencil, Plus, Power, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckGroup } from '@/components/check-group'
import { FormDialog, type Values } from '@/components/form-dialog'
import { DataTable, Empty, Failed, Loading, Panel, Pill, ScreenHeader, Segmented, td } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStageMasters } from '@/features/catalog/use-catalog'
import { useContractorContext } from '@/features/contractors/contractor-context'
import { useContractor, useCreateService, useSpecialties, useUpdateService, type Service, type ServiceStatus } from '@/features/contractors/use-contractors'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/forms'
import { specialtyLabel } from '@/lib/organizations'

type View = 'ALL' | ServiceStatus

const opt = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const nul = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** Alta o edición de un servicio. Los activos aparecen en el directorio, filtrables por etapa y especialidad. */
function ServiceFormDialog({ contractorId, service, onClose }: { contractorId: string; service?: Service; onClose: () => void }) {
  const create = useCreateService(contractorId)
  const update = useUpdateService(contractorId)
  const stages = useStageMasters()
  const specialties = useSpecialties()
  const [stageCodes, setStageCodes] = useState<string[]>(service?.stages.map((s) => s.code) ?? [])
  const m = service ? update : create

  function submit(v: Values) {
    const done = { onSuccess: () => { toast.success(service ? 'Servicio actualizado' : 'Servicio creado'); onClose() } }
    if (service) update.mutate({ id: service.id, name: String(v.name).trim(), serviceType: String(v.serviceType).trim(), description: nul(v.description), stageCodes }, done)
    else create.mutate({ name: String(v.name).trim(), serviceType: String(v.serviceType).trim(), description: opt(v.description), stageCodes }, done)
  }

  return (
    <FormDialog
      title={service ? 'Editar servicio' : 'Nuevo servicio'}
      description="Los servicios activos aparecen en el directorio de Servicios Profesionales, filtrables por etapa y especialidad."
      fields={[
        { name: 'name', label: 'Nombre del servicio', required: true, wide: true, placeholder: 'Alineación láser de equipos rotativos' },
        {
          name: 'serviceType',
          label: 'Especialidad',
          required: true,
          wide: true,
          placeholder: 'Mecánica, Electricidad, Instrumentación…',
          hint: specialties.data && specialties.data.length > 0 ? `Ya existen: ${specialties.data.map(specialtyLabel).join(', ')}. Usa una de ellas para que te encuentren en el mismo filtro.` : 'Mínimo 2 caracteres.',
        },
        { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Qué incluye el servicio, alcance, entregables' },
      ]}
      initial={service ? { name: service.name, serviceType: specialtyLabel(service.serviceType), description: service.description ?? '' } : {}}
      submitLabel={service ? 'Guardar cambios' : 'Crear servicio'}
      busy={m.isPending}
      error={errorMessage(m.error)}
      extra={
        <CheckGroup
          legend="Etapas del proceso que atiendes"
          options={(stages.data ?? []).map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
          value={stageCodes}
          onChange={setStageCodes}
          help="Así te encuentran las plantas que buscan ayuda en una etapa concreta."
        />
      }
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

export function ServicesPage() {
  const { contractor } = useContractorContext()
  const id = contractor!.id
  const active = contractor!.status === 'ACTIVE'
  const q = useContractor(id)
  const update = useUpdateService(id)
  const [view, setView] = useState<View>('ALL')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<{ service?: Service } | null>(null)

  const all = q.data?.services ?? []
  const term = search.trim().toLowerCase()
  const rows = all.filter((s) => (view === 'ALL' || s.status === view) && (!term || `${s.name} ${s.serviceType} ${s.description ?? ''}`.toLowerCase().includes(term)))
  const count = (st: ServiceStatus) => all.filter((s) => s.status === st).length

  const toggle = (s: Service) =>
    update.mutate(
      { id: s.id, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
      { onSuccess: () => toast.success(s.status === 'ACTIVE' ? 'Servicio desactivado: ya no es visible' : 'Servicio activado'), onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudo actualizar el servicio') },
    )

  return (
    <>
      <ScreenHeader
        title="Servicios"
        description="Lo que ofreces a las plantas. Un servicio inactivo no es visible; se conserva para reactivarlo cuando quieras."
        actions={
          <Button onClick={() => setForm({})} disabled={!active} title={active ? undefined : 'Disponible cuando el administrador apruebe tu empresa'}>
            <Plus /> Nuevo servicio
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          label="Estado"
          value={view}
          onChange={setView}
          options={[
            { value: 'ALL', label: 'Todos', count: all.length },
            { value: 'ACTIVE', label: 'Activos', count: count('ACTIVE') },
            { value: 'INACTIVE', label: 'Inactivos', count: count('INACTIVE') },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fur-gray-500" aria-hidden />
          <Input className="w-64 pl-9" placeholder="Buscar servicio" aria-label="Buscar servicios" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Panel className="mt-3" flush>
        {q.isLoading ? (
          <div className="p-4"><Loading rows={5} /></div>
        ) : q.isError ? (
          <Failed what="tus servicios" onRetry={() => void q.refetch()} />
        ) : rows.length > 0 ? (
          <DataTable head={['Servicio', 'Especialidad', 'Etapas', 'Estado', { label: 'Acciones', right: true }]}>
            {rows.map((s) => (
              <tr key={s.id} className={s.status === 'INACTIVE' ? 'opacity-70' : undefined}>
                <td className={td}>
                  <p className="max-w-80 truncate font-medium text-fur-navy-900" title={s.name}>{s.name}</p>
                  <p className="max-w-80 truncate text-xs text-muted-foreground">{s.description ?? 'Sin descripción'}</p>
                </td>
                <td className={td}><Pill label={specialtyLabel(s.serviceType)} color="var(--fur-navy-700)" /></td>
                <td className={td}>
                  {s.stages.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin etapas</span>
                  ) : (
                    <span className="text-xs" title={s.stages.map((st) => st.name).join(', ')}>{s.stages.slice(0, 3).map((st) => st.code).join(', ')}{s.stages.length > 3 ? ` +${s.stages.length - 3}` : ''}</span>
                  )}
                </td>
                <td className={td}><Pill label={s.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} color={s.status === 'ACTIVE' ? 'var(--fur-green-500)' : 'var(--fur-steel-500)'} /></td>
                <td className={`${td} text-right`}>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button size="xs" variant="outline" aria-label={`Editar ${s.name}`} disabled={!active} onClick={() => setForm({ service: s })}><Pencil /> Editar</Button>
                    <Button size="xs" variant="secondary" aria-label={`${s.status === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${s.name}`} disabled={update.isPending || !active} onClick={() => toggle(s)}>
                      <Power /> {s.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty>{all.length === 0 ? 'Aún no tienes servicios. Crea el primero.' : 'No hay servicios con estos filtros.'}</Empty>
        )}
      </Panel>

      {form && <ServiceFormDialog contractorId={id} service={form.service} onClose={() => setForm(null)} />}
    </>
  )
}
