import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Servicio {
  id: string
  nombre: string
  duracion_min: number
  activo: boolean
  created_at: string
}

/**
 * Hook para gestionar servicios
 */
export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServicios()
  }, [])

  async function loadServicios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error

      setServicios(data || [])
    } catch (err: any) {
      console.error('Error loading servicios:', err)
      toast.error('Error al cargar los servicios')
    } finally {
      setLoading(false)
    }
  }

  return {
    servicios,
    loading,
    refetch: loadServicios,
  }
}

