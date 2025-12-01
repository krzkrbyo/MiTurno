import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Turno, TurnoFilters } from '@/types/turno'
import { toast } from 'sonner'

/**
 * Hook para gestionar turnos con Realtime
 */
export function useTurnos(filters?: TurnoFilters) {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTurnos()

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('turnos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turnos',
        },
        () => {
          loadTurnos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters?.sucursal_id, filters?.estado])

  async function loadTurnos() {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('turnos')
        .select(
          `
          *,
          servicio:servicios(id, nombre, duracion_min),
          sucursal:sucursales(id, nombre, codigo),
          creador:profiles!turnos_created_by_fkey(id, full_name)
        `
        )
        .order('created_at', { ascending: false })

      if (filters?.sucursal_id) {
        query = query.eq('sucursal_id', filters.sucursal_id)
      }

      if (filters?.estado) {
        query = query.eq('estado', filters.estado)
      }

      if (filters?.search) {
        query = query.or(`cliente.ilike.%${filters.search}%,codigo.ilike.%${filters.search}%`)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setTurnos((data || []) as Turno[])
    } catch (err: any) {
      console.error('Error loading turnos:', err)
      setError(err.message)
      toast.error('Error al cargar los turnos')
    } finally {
      setLoading(false)
    }
  }

  async function createTurno(turnoData: {
    cliente: string
    servicio_id: string
    sucursal_id: string
    scheduled_for?: string | null
    notas?: string
  }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuario no autenticado')

      // Generar código único (ULID simple)
      const codigo = `T${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`

      const { data, error: insertError } = await supabase
        .from('turnos')
        .insert({
          ...turnoData,
          codigo,
          estado: 'pendiente',
          created_by: user.id,
        } as any)
        .select()
        .single()

      if (insertError) throw insertError

      toast.success('Turno creado correctamente')
      return { success: true, data }
    } catch (err: any) {
      console.error('Error creating turno:', err)
      toast.error(err.message || 'Error al crear el turno')
      return { success: false, error: err.message }
    }
  }

  async function updateTurnoEstado(
    turnoId: string,
    nuevoEstado: Turno['estado'],
    updatedBy?: string
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuario no autenticado')

      const updateData: any = {
        estado: nuevoEstado,
        updated_by: updatedBy || user.id,
      }

      if (nuevoEstado === 'atendiendo' || nuevoEstado === 'completado') {
        updateData.atendido_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('turnos')
        // @ts-expect-error - Supabase type inference issue
        .update(updateData as any)
        .eq('id', turnoId)

      if (updateError) throw updateError

      toast.success(`Turno ${nuevoEstado} correctamente`)
      return { success: true }
    } catch (err: any) {
      console.error('Error updating turno:', err)
      toast.error(err.message || 'Error al actualizar el turno')
      return { success: false, error: err.message }
    }
  }

  async function getTurnoById(turnoId: string) {
    try {
      const { data, error } = await supabase
        .from('turnos')
        .select(
          `
          *,
          servicio:servicios(id, nombre, duracion_min),
          sucursal:sucursales(id, nombre, codigo),
          creador:profiles!turnos_created_by_fkey(id, full_name)
        `
        )
        .eq('id', turnoId)
        .single()

      if (error) throw error

      return { success: true, data: data as Turno }
    } catch (err: any) {
      console.error('Error getting turno:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    turnos,
    loading,
    error,
    createTurno,
    updateTurnoEstado,
    getTurnoById,
    refetch: loadTurnos,
  }
}

