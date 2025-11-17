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
          role: 'admin'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'admin'
          avatar_url?: string | null
          created_at?: string
        }
      }
      empleados: {
        Row: {
          id: string
          codigo_qr: string
          nombre_completo: string
          foto_url: string | null
          activo: boolean
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          codigo_qr: string
          nombre_completo: string
          foto_url?: string | null
          activo?: boolean
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          codigo_qr?: string
          nombre_completo?: string
          foto_url?: string | null
          activo?: boolean
          created_at?: string
          created_by?: string
        }
      }
      registros_asistencia: {
        Row: {
          id: string
          empleado_id: string
          tipo_evento: 'entrada' | 'salida' | 'salida_almuerzo' | 'entrada_almuerzo'
          fecha_hora: string
          created_at: string
        }
        Insert: {
          id?: string
          empleado_id: string
          tipo_evento: 'entrada' | 'salida' | 'salida_almuerzo' | 'entrada_almuerzo'
          fecha_hora?: string
          created_at?: string
        }
        Update: {
          id?: string
          empleado_id?: string
          tipo_evento?: 'entrada' | 'salida' | 'salida_almuerzo' | 'entrada_almuerzo'
          fecha_hora?: string
          created_at?: string
        }
      }
    }
  }
}

