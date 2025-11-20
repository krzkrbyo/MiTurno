import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Database } from '@/types/db'

type RegistroAsistencia = Database['public']['Tables']['registros_asistencia']['Row']
type RegistroInsert = Database['public']['Tables']['registros_asistencia']['Insert']

/**
 * Hook para gestionar registros de asistencia
 */
export function useRegistrosAsistencia() {
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar registros con filtros opcionales
  const loadRegistros = async (filters?: {
    empleado_id?: string
    fecha_desde?: Date
    fecha_hasta?: Date
    tipo_evento?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('registros_asistencia')
        .select('*')
        .order('fecha_hora', { ascending: false })

      if (filters?.empleado_id) {
        query = query.eq('empleado_id', filters.empleado_id)
      }

      if (filters?.fecha_desde) {
        query = query.gte('fecha_hora', filters.fecha_desde.toISOString())
      }

      if (filters?.fecha_hasta) {
        query = query.lte('fecha_hora', filters.fecha_hasta.toISOString())
      }

      if (filters?.tipo_evento) {
        query = query.eq('tipo_evento', filters.tipo_evento)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setRegistros(data || [])
    } catch (err: any) {
      console.error('Error loading registros:', err)
      setError(err.message || 'Error al cargar registros')
      toast.error('Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }

  // Crear registro de asistencia
  const createRegistro = async (registro: RegistroInsert) => {
    try {
      const { data, error: createError } = await supabase
        .from('registros_asistencia')
        .insert(registro)
        .select()
        .single()

      if (createError) throw createError

      // No mostrar toast aquí, el componente que llama lo manejará
      return { success: true, data }
    } catch (err: any) {
      console.error('Error creating registro:', err)
      toast.error(err.message || 'Error al crear registro')
      return { success: false, error: err.message }
    }
  }

  // Obtener estadísticas del día
  const getEstadisticasDia = async (fecha?: Date) => {
    try {
      const fechaInicio = fecha || new Date()
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fechaInicio)
      fechaFin.setHours(23, 59, 59, 999)

      const { data, error: fetchError } = await supabase
        .from('registros_asistencia')
        .select(`
          *,
          empleados (
            id,
            nombre_completo,
            foto_url,
            activo
          )
        `)
        .gte('fecha_hora', fechaInicio.toISOString())
        .lte('fecha_hora', fechaFin.toISOString())
        .order('fecha_hora', { ascending: false })

      if (fetchError) throw fetchError

      // Procesar datos para obtener estadísticas
      // Primero, ordenar por fecha_hora ascendente para procesar eventos en orden cronológico
      const registrosOrdenados = [...(data || [])].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      )

      const empleadosPresentes = new Set<string>()
      const empleadosEnAlmuerzo = new Set<string>()

      // Procesar eventos en orden cronológico para determinar el estado actual
      registrosOrdenados.forEach((registro: any) => {
        const empId = registro.empleado_id
        const tipo = registro.tipo_evento

        // Lógica para determinar estado basado en el último evento
        if (tipo === 'entrada') {
          empleadosPresentes.add(empId)
          empleadosEnAlmuerzo.delete(empId)
        } else if (tipo === 'salida') {
          empleadosPresentes.delete(empId)
          empleadosEnAlmuerzo.delete(empId)
        } else if (tipo === 'salida_almuerzo') {
          empleadosEnAlmuerzo.add(empId)
          empleadosPresentes.delete(empId) // Ya no está presente, está en almuerzo
        } else if (tipo === 'entrada_almuerzo') {
          empleadosEnAlmuerzo.delete(empId)
          empleadosPresentes.add(empId) // Vuelve a estar presente
        }
      })

      return {
        success: true,
        data: {
          totalRegistros: data?.length || 0,
          empleadosPresentes: empleadosPresentes.size,
          empleadosEnAlmuerzo: empleadosEnAlmuerzo.size,
          registros: data || [],
        },
      }
    } catch (err: any) {
      console.error('Error getting estadisticas:', err)
      return { success: false, error: err.message, data: null }
    }
  }

  return {
    registros,
    loading,
    error,
    loadRegistros,
    createRegistro,
    getEstadisticasDia,
  }
}

