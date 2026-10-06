import { BadgeCheck, Globe, Info, Mail, MapPin, Pencil, ShieldCheck, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AvailabilityControl } from '@/components/availability-control'
import { FormDialog, type Values } from '@/components/form-dialog'
import { Empty, Failed, Loading, Panel, Pill, ScreenHeader } from '@/components/kit'
import { ImagePicker } from '@/components/image-picker'
import { Button } from '@/components/ui/button'
import { useContractorContext } from '@/features/contractors/contractor-context'
import { useContractor, useRemoveLogo, useUpdateContractor, useUploadLogo, type ContractorDetail } from '@/features/contractors/use-contractors'
import { errorMessage } from '@/lib/forms'
import { NO_IMAGE_CHANGE, type ImageChange } from '@/lib/image-file'
import { imageSrc } from '@/lib/media'
import { AVAILABILITY_COLOR, CONTRACTOR_AVAILABILITY_LABELS, countryName, ORG_STATUS_LABELS, parseList, ratingText, specialtyLabel } from '@/lib/organizations'

const nul = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null)

function EditProfile({ c, onClose }: { c: ContractorDetail; onClose: () => void }) {
  const update = useUpdateContractor(c.id)
  const upload = useUploadLogo(c.id)
  const removeLogo = useRemoveLogo(c.id)
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /** Guarda los datos y, después, aplica el cambio de logo. Si el logo falla, los datos ya quedaron guardados y se avisa. */
  async function submit(v: Values) {
    setSaving(true)
    setSaveError(null)
    try {
      await update.mutateAsync({ city: nul(v.city), description: nul(v.description), website: nul(v.website), contactEmail: nul(v.contactEmail), certifications: parseList(String(v.certifications ?? '')) })
      try {
        if (image.file) await upload.mutateAsync(image.file)
        else if (image.remove) await removeLogo.mutateAsync()
      } catch (e) {
        toast.error(`Perfil actualizado, pero el logo no se pudo guardar: ${errorMessage(e) ?? 'error desconocido'}`)
        onClose()
        return
      }
      toast.success('Perfil actualizado')
      onClose()
    } catch (e) {
      setSaveError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Editar perfil de la empresa"
      fields={[
        { name: 'city', label: 'Ciudad' },
        { name: 'contactEmail', label: 'Correo de contacto', type: 'email', hint: 'Solo lo ven usuarios con sesión iniciada.' },
        { name: 'website', label: 'Sitio web', type: 'url', placeholder: 'https://…', wide: true },
        { name: 'certifications', label: 'Certificaciones', placeholder: 'ISO 9001, OSHA 30', hint: 'Separadas por comas.', wide: true },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      initial={{ city: c.city ?? '', contactEmail: c.contactEmail ?? '', website: c.website ?? '', certifications: c.certifications.join(', '), description: c.description ?? '' }}
      busy={saving}
      error={saveError}
      extra={<ImagePicker label="Logo de la empresa" currentUrl={c.logoUrl} value={image} onChange={setImage} />}
      onClose={onClose}
      onSubmit={(v) => void submit(v)}
    />
  )
}

export function ProfilePage() {
  const { contractor } = useContractorContext()
  const q = useContractor(contractor!.id)
  const [editing, setEditing] = useState(false)
  const c = q.data

  if (q.isLoading) return <Loading rows={5} />
  if (q.isError || !c) return <Panel><Failed what="el perfil" onRetry={() => void q.refetch()} /></Panel>

  const logo = imageSrc(c.logoUrl)
  const editable = c.canManage && c.status !== 'SUSPENDED'
  const statusColor = c.status === 'ACTIVE' ? 'var(--fur-green-500)' : c.status === 'PENDING' ? 'var(--fur-orange-500)' : 'var(--fur-red-500)'

  return (
    <>
      <ScreenHeader
        title="Perfil de la empresa"
        description="Así te ven los compradores en el directorio de servicios profesionales."
        actions={editable && <Button onClick={() => setEditing(true)}><Pencil /> Editar perfil</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white text-xl font-extrabold text-fur-navy-900">
              {logo ? <img src={logo} alt={`Logo de ${c.organizationName}`} className="size-full object-contain" /> : c.organizationName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-fur-navy-900">{c.organizationName}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{[c.city, countryName(c.countryCode)].filter(Boolean).join(', ')}</span>
                {c.website && <a href={c.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><Globe className="size-3.5" aria-hidden />{c.website.replace(/^https?:\/\//, '')}</a>}
                {c.contactEmail && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" aria-hidden />{c.contactEmail}</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill label={ORG_STATUS_LABELS[c.status]} color={statusColor} icon={ShieldCheck} />
                {c.verified && <Pill label="Verificada" color="var(--fur-green-500)" icon={BadgeCheck} />}
                <Pill label={ratingText(c.rating)} color="var(--fur-steel-500)" icon={Star} />
                <Pill label={CONTRACTOR_AVAILABILITY_LABELS[c.availability]} color={AVAILABILITY_COLOR[c.availability]} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm whitespace-pre-wrap text-fur-gray-800">{c.description ?? <span className="text-muted-foreground">Aún no has escrito una descripción. Cuéntales a los compradores qué servicios prestas.</span>}</p>
          {c.certifications.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Certificaciones">
              {c.certifications.map((x) => <li key={x}><Pill label={x} color="var(--fur-navy-700)" icon={ShieldCheck} /></li>)}
            </ul>
          )}
        </Panel>

        <Panel title="Datos registrados" subtitle="Los fija el administrador del ecosistema">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted-foreground">Razón social</dt><dd className="font-medium text-fur-navy-900">{c.organizationName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Identificación tributaria</dt><dd>{c.taxId ?? <span className="text-muted-foreground">Sin registrar</span>}</dd></div>
            <div><dt className="text-xs text-muted-foreground">País</dt><dd>{countryName(c.countryCode)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Tu rol</dt><dd>{c.myRole === 'OWNER' ? 'Responsable' : c.myRole === 'MEMBER' ? 'Miembro' : '—'}</dd></div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />Para cambiar la razón social, el NIF, el país o pedir la verificación, contacta al administrador del ecosistema.</p>
        </Panel>

        <Panel title="Disponibilidad" subtitle="Lo que ven los compradores en el directorio" className="lg:col-span-3">
          <AvailabilityControl contractorId={c.id} value={c.availability} disabled={!editable} />
        </Panel>

        <Panel title="Cobertura" subtitle="Se deriva de tus servicios activos" className="lg:col-span-3">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Etapas del proceso</h3>
              {c.stages.length > 0 ? <ul className="flex flex-wrap gap-1.5">{c.stages.map((s) => <li key={s.code}><Pill label={`${s.code} · ${s.name}`} color="var(--fur-navy-700)" /></li>)}</ul> : <Empty>Indica etapas en tus servicios.</Empty>}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Especialidades</h3>
              {c.specialties.length > 0 ? <ul className="flex flex-wrap gap-1.5">{c.specialties.map((s) => <li key={s}><Pill label={specialtyLabel(s)} color="var(--fur-teal-500)" /></li>)}</ul> : <Empty>Crea servicios para aparecer por especialidad.</Empty>}
            </div>
          </div>
        </Panel>
      </div>

      {editing && <EditProfile c={c} onClose={() => setEditing(false)} />}
    </>
  )
}
