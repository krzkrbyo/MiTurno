/**
 * Tipos de base de datos generados para Supabase
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'agente' | 'cliente'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'agente' | 'cliente'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'admin' | 'agente' | 'cliente'
          avatar_url?: string | null
          created_at?: string
        }
      }
      sucursales: {
        Row: {
          id: string
          nombre: string
          codigo: string
          activa: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          codigo: string
          activa?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          codigo?: string
          activa?: boolean
          created_at?: string
        }
      }
      servicios: {
        Row: {
          id: string
          nombre: string
          duracion_min: number
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          duracion_min: number
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          duracion_min?: number
          activo?: boolean
          created_at?: string
        }
      }
      turnos: {
        Row: {
          id: string
          codigo: string
          cliente: string
          servicio_id: string
          sucursal_id: string
          estado: 'pendiente' | 'en_cola' | 'atendiendo' | 'completado' | 'cancelado'
          scheduled_for: string | null
          atendido_at: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo?: string
          cliente: string
          servicio_id: string
          sucursal_id: string
          estado?: 'pendiente' | 'en_cola' | 'atendiendo' | 'completado' | 'cancelado'
          scheduled_for?: string | null
          atendido_at?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          cliente?: string
          servicio_id?: string
          sucursal_id?: string
          estado?: 'pendiente' | 'en_cola' | 'atendiendo' | 'completado' | 'cancelado'
          scheduled_for?: string | null
          atendido_at?: string | null
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

