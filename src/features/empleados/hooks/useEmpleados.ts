import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Database } from '@/types/db'

type Empleado = Database['public']['Tables']['empleados']['Row']
type EmpleadoInsert = Database['public']['Tables']['empleados']['Insert']
type EmpleadoUpdate = Database['public']['Tables']['empleados']['Update']

/**
 * Hook para gestionar empleados (solo admin)
 */
export function useEmpleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar empleados
  const loadEmpleados = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('empleados')
        .select('*')
        .order('nombre_completo', { ascending: true })

      if (fetchError) throw fetchError

      setEmpleados(data || [])
    } catch (err: any) {
      console.error('Error loading empleados:', err)
      setError(err.message || 'Error al cargar empleados')
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }

  // Cargar empleados al montar
  useEffect(() => {
    loadEmpleados()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('empleados_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'empleados',
        },
        () => {
          loadEmpleados()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Generar PIN único
  const generateUniquePIN = async (): Promise<string> => {
    let pin: string
    let exists = true
    
    while (exists) {
      // Generar PIN de 4 dígitos (0000-9999)
      pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      
      // Verificar si el PIN ya existe
      const { data, error } = await supabase
        .from('empleados')
        .select('id')
        .eq('pin', pin)
        .maybeSingle()
      
      // Si hay error o no hay datos, el PIN está disponible
      exists = !error && !!data
    }
    
    return pin!
  }

  // Crear empleado
  const createEmpleado = async (empleado: Omit<EmpleadoInsert, 'id' | 'created_at' | 'codigo_qr' | 'pin'> & { codigo_qr?: string; pin?: string }) => {
    try {
      // Generar código QR único si no se proporciona
      const codigo_qr = empleado.codigo_qr || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Generar PIN único si no se proporciona
      const pin = empleado.pin || await generateUniquePIN()
      
      const { data, error: createError } = await supabase
        .from('empleados')
        .insert({
          ...empleado,
          codigo_qr,
          pin,
        } as any)
        .select()
        .single()

      if (createError) throw createError

      toast.success('Empleado creado correctamente')
      await loadEmpleados()
      return { success: true, data }
    } catch (err: any) {
      console.error('Error creating empleado:', err)
      toast.error(err.message || 'Error al crear empleado')
      return { success: false, error: err.message }
    }
  }

  // Actualizar empleado
  const updateEmpleado = async (id: string, updates: EmpleadoUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('empleados')
        // @ts-ignore - Supabase type inference issue
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      toast.success('Empleado actualizado correctamente')
      await loadEmpleados()
      return { success: true, data }
    } catch (err: any) {
      console.error('Error updating empleado:', err)
      toast.error(err.message || 'Error al actualizar empleado')
      return { success: false, error: err.message }
    }
  }

  // Eliminar empleado
  const deleteEmpleado = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      toast.success('Empleado eliminado correctamente')
      await loadEmpleados()
      return { success: true }
    } catch (err: any) {
      console.error('Error deleting empleado:', err)
      toast.error(err.message || 'Error al eliminar empleado')
      return { success: false, error: err.message }
    }
  }

  // Obtener empleado por código QR
  const getEmpleadoByQR = async (codigo_qr: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('empleados')
        .select('*')
        .eq('codigo_qr', codigo_qr)
        .eq('activo', true)
        .single()

      if (fetchError) throw fetchError

      return { success: true, data }
    } catch (err: any) {
      console.error('Error fetching empleado by QR:', err)
      return { success: false, error: err.message, data: null }
    }
  }

  // Obtener empleado por ID
  const getEmpleadoById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('empleados')
        .select('*')
        .eq('id', id)
        .eq('activo', true)
        .single()

      if (fetchError) throw fetchError

      return { success: true, data }
    } catch (err: any) {
      console.error('Error fetching empleado by ID:', err)
      return { success: false, error: err.message, data: null }
    }
  }

  // Obtener empleado por PIN
  const getEmpleadoByPIN = async (pin: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('empleados')
        .select('*')
        .eq('pin', pin)
        .eq('activo', true)
        .single()

      if (fetchError) throw fetchError

      return { success: true, data }
    } catch (err: any) {
      console.error('Error fetching empleado by PIN:', err)
      return { success: false, error: err.message, data: null }
    }
  }

  return {
    empleados,
    loading,
    error,
    loadEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    getEmpleadoByQR,
    getEmpleadoById,
    getEmpleadoByPIN,
  }
}

