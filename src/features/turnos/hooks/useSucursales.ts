import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Sucursal {
  id: string
  nombre: string
  codigo: string
  activa: boolean
  created_at: string
}

/**
 * Hook para gestionar sucursales
 */
export function useSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSucursales()
  }, [])

  async function loadSucursales() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .eq('activa', true)
        .order('nombre')

      if (error) throw error

      setSucursales(data || [])
    } catch (err: any) {
      console.error('Error loading sucursales:', err)
      toast.error('Error al cargar las sucursales')
    } finally {
      setLoading(false)
    }
  }

  return {
    sucursales,
    loading,
    refetch: loadSucursales,
  }
}

