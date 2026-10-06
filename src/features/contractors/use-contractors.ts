import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, formBody, jsonBody } from '@/lib/api'

export type Tag = { code: string; name: string }
export type OrgStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type Availability = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'
export type ServiceStatus = 'ACTIVE' | 'INACTIVE'

export type Contractor = {
  id: string
  organizationName: string
  countryCode: string
  city: string | null
  description: string | null
  logoUrl: string | null
  certifications: string[]
  availability: Availability
  status: OrgStatus
  verified: boolean
  /** null = sin calificaciones (no se inventa un valor). */
  rating: number | null
  website: string | null
  contactEmail: string | null
  stages: Tag[]
  specialties: string[]
}
export type MyContractor = Contractor & { myRole: 'OWNER' | 'MEMBER' }

/** Servicio profesional que ofrece el contratista. */
export type Service = { id: string; name: string; description: string | null; serviceType: string; status: ServiceStatus; stages: Tag[] }
export type ContractorDetail = Contractor & { taxId: string | null; canManage: boolean; myRole: string | null; services: Service[] }
export type OrgMember = { userId: string; email: string; firstName: string; lastName: string; role: 'OWNER' | 'MEMBER'; createdAt: string }

// Todo cuelga de ['org', …] para invalidarse junto al editar.
export const useMyContractors = (enabled: boolean) =>
  useQuery({ queryKey: ['org', 'mine'], queryFn: () => api<MyContractor[]>('/contractors/mine'), enabled, staleTime: 30_000 })

/** Detalle con los servicios (quien gestiona ve también los inactivos). */
export const useContractor = (id: string | undefined) =>
  useQuery({ queryKey: ['org', 'contractor', id], queryFn: () => api<ContractorDetail>(`/contractors/${id}`), enabled: !!id, retry: false })

export const useMembers = (id: string | undefined) =>
  useQuery({ queryKey: ['org', 'contractor', id, 'members'], queryFn: () => api<OrgMember[]>(`/contractors/${id}/members`), enabled: !!id, retry: false })

/** Especialidades que ya existen en el ecosistema (para sugerir al crear un servicio). */
export const useSpecialties = () => useQuery({ queryKey: ['specialties'], queryFn: () => api<string[]>('/professional-services/specialties'), staleTime: 5 * 60_000 })

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: ['org'] })
}

export type ContractorInput = {
  organizationName: string
  taxId?: string
  countryCode: string
  city?: string
  description?: string
  website?: string
  contactEmail?: string
  certifications?: string[]
  availability?: Availability
  /** El registro lo hace la propia persona: queda pendiente de aprobación y ella es la responsable. */
  selfRegistration?: boolean
}

/** Solicitud de registro: queda PENDIENTE hasta que el administrador del ecosistema la apruebe. */
export function useCreateContractor() {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (input: ContractorInput) => api<ContractorDetail>('/contractors', { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

/** Lo que un miembro puede cambiar: nombre, NIF, estado, verificación y calificación son del administrador. */
export type ContractorPatch = {
  city?: string | null
  description?: string | null
  website?: string | null
  contactEmail?: string | null
  logoUrl?: string | null
  certifications?: string[]
  availability?: Availability
}

export function useUpdateContractor(id: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (input: ContractorPatch) => api<ContractorDetail>(`/contractors/${id}`, { method: 'PATCH', ...jsonBody(input) }), onSuccess: invalidate })
}

export type ServiceInput = { name: string; description?: string; serviceType: string; stageCodes?: string[] }
export type ServicePatch = Partial<Omit<ServiceInput, 'description'>> & { description?: string | null; status?: ServiceStatus }

export function useCreateService(contractorId: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (input: ServiceInput) => api<ContractorDetail>(`/contractors/${contractorId}/services`, { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

export function useUpdateService(contractorId: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & ServicePatch) => api<ContractorDetail>(`/contractors/${contractorId}/services/${id}`, { method: 'PATCH', ...jsonBody(input) }),
    onSuccess: invalidate,
  })
}

export function useAddMember(id: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (input: { email: string; role: 'OWNER' | 'MEMBER' }) => api<OrgMember[]>(`/contractors/${id}/members`, { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

export function useRemoveMember(id: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (userId: string) => api<void>(`/contractors/${id}/members/${userId}`, { method: 'DELETE' }), onSuccess: invalidate })
}

/** Logo de la empresa (reemplaza el anterior). */
export function useUploadLogo(id: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (file: File) => api<ContractorDetail>(`/contractors/${id}/logo`, { method: 'POST', ...formBody({}, file) }), onSuccess: invalidate })
}
export function useRemoveLogo(id: string) {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: () => api<void>(`/contractors/${id}/logo`, { method: 'DELETE' }), onSuccess: invalidate })
}
