import { toast } from 'sonner'
import { Segmented } from '@/components/kit'
import { useUpdateContractor, type Availability } from '@/features/contractors/use-contractors'
import { errorMessage } from '@/lib/forms'
import { CONTRACTOR_AVAILABILITY_LABELS } from '@/lib/organizations'

const HINT: Record<Availability, string> = {
  AVAILABLE: 'Puedes tomar nuevos trabajos: apareces como disponible en el directorio.',
  LIMITED: 'Tomas trabajos con capacidad reducida: los compradores verán que tu disponibilidad es limitada.',
  UNAVAILABLE: 'No tomas trabajos por ahora: los compradores verán que no estás disponible.',
}

/** Cambia la disponibilidad al instante: es lo que ven los compradores en el directorio y en cada servicio. */
export function AvailabilityControl({ contractorId, value, disabled }: { contractorId: string; value: Availability; disabled?: boolean }) {
  const update = useUpdateContractor(contractorId)
  return (
    <div className="space-y-2">
      <div className={disabled || update.isPending ? 'pointer-events-none opacity-60' : undefined}>
        <Segmented<Availability>
          label="Disponibilidad"
          value={value}
          onChange={(availability) =>
            update.mutate({ availability }, { onSuccess: () => toast.success(`Disponibilidad: ${CONTRACTOR_AVAILABILITY_LABELS[availability]}`), onError: (e) => toast.error(errorMessage(e) ?? 'No se pudo actualizar') })
          }
          options={(Object.keys(CONTRACTOR_AVAILABILITY_LABELS) as Availability[]).map((v) => ({ value: v, label: CONTRACTOR_AVAILABILITY_LABELS[v] }))}
        />
      </div>
      <p className="text-xs text-muted-foreground">{HINT[value]}</p>
    </div>
  )
}
