import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { useMyContractors, type MyContractor } from './use-contractors'

const STORAGE_KEY = 'fur.services.contractorId'

type ContractorContextValue = {
  /** Empresas contratistas de las que la persona es miembro. */
  contractors: MyContractor[]
  /** Empresa con la que se está trabajando (null si todavía no tiene ninguna). */
  contractor: MyContractor | null
  isLoading: boolean
  isError: boolean
  select: (id: string) => void
}

const ContractorContext = createContext<ContractorContextValue | null>(null)

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Una persona puede gestionar varias empresas: la elegida se recuerda en este navegador. */
export function ContractorProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const mine = useMyContractors(status === 'authenticated')
  const [storedId, setStoredId] = useState<string | null>(readStored)

  const contractors = useMemo(() => mine.data ?? [], [mine.data])
  const contractor = contractors.find((c) => c.id === storedId) ?? contractors[0] ?? null

  const select = useCallback((id: string) => {
    setStoredId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* almacenamiento no disponible */
    }
  }, [])

  const value = useMemo<ContractorContextValue>(
    () => ({ contractors, contractor, isLoading: status === 'loading' || (status === 'authenticated' && mine.isLoading), isError: mine.isError, select }),
    [contractors, contractor, status, mine.isLoading, mine.isError, select],
  )
  return <ContractorContext.Provider value={value}>{children}</ContractorContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContractorContext() {
  const ctx = useContext(ContractorContext)
  if (!ctx) throw new Error('useContractorContext debe usarse dentro de <ContractorProvider>')
  return ctx
}
