import { supabase } from './supabase'
import { toast } from 'sonner'

/**
 * Nombres de empleados de ejemplo
 */
const SAMPLE_EMPLOYEES = [
  'María González',
  'Juan Pérez',
  'Ana Martínez',
  'Carlos Rodríguez',
  'Laura Sánchez',
  'Pedro López',
  'Carmen Fernández',
  'Miguel Torres',
  'Isabel García',
  'Roberto Díaz',
  'Elena Ruiz',
  'Francisco Morales',
  'Patricia Jiménez',
  'Antonio Herrera',
  'Sofía Ramírez',
]

/**
 * Genera un PIN único de 4 dígitos
 */
function generatePIN(): string {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
}

/**
 * Genera un código QR único
 */
function generateQRCode(): string {
  return `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Crea empleados de ejemplo
 */
export async function createSampleEmployees(userId: string): Promise<{ success: boolean; count: number }> {
  try {
    // Verificar cuántos empleados ya existen
    const { data: existing } = await supabase
      .from('empleados')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      toast.info('Ya existen empleados en el sistema. Elimínalos primero si deseas crear datos de ejemplo.')
      return { success: false, count: 0 }
    }

    const empleados = SAMPLE_EMPLOYEES.map((nombre) => ({
      codigo_qr: generateQRCode(),
      nombre_completo: nombre,
      pin: generatePIN(),
      activo: true,
      created_by: userId,
      foto_url: null,
    }))

    // Insertar empleados en lotes para evitar problemas
    const batchSize = 5
    let inserted = 0

    for (let i = 0; i < empleados.length; i += batchSize) {
      const batch = empleados.slice(i, i + batchSize)
      
      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from('empleados').insert(batch as any)

      if (error) {
        console.error('Error inserting batch:', error)
        // Continuar con el siguiente lote
        continue
      }

      inserted += batch.length
    }

    toast.success(`${inserted} empleados de ejemplo creados`)
    return { success: true, count: inserted }
  } catch (error: any) {
    console.error('Error creating sample employees:', error)
    toast.error('Error al crear empleados de ejemplo')
    return { success: false, count: 0 }
  }
}

/**
 * Crea registros de asistencia de ejemplo para los últimos N días
 */
export async function createSampleAttendanceRecords(days: number = 7): Promise<{ success: boolean; count: number }> {
  try {
    // Obtener todos los empleados activos
    const { data: empleados, error: empleadosError } = await supabase
      .from('empleados')
      .select('id')
      .eq('activo', true)

    if (empleadosError) throw empleadosError

    if (!empleados || empleados.length === 0) {
      toast.error('No hay empleados en el sistema. Crea empleados primero.')
      return { success: false, count: 0 }
    }

    const registros: Array<{
      empleado_id: string
      tipo_evento: 'entrada' | 'salida' | 'salida_almuerzo' | 'entrada_almuerzo'
      fecha_hora: string
    }> = []

    const now = new Date()

    // Generar registros para cada día
    for (let day = 0; day < days; day++) {
      const fecha = new Date(now)
      fecha.setDate(fecha.getDate() - day)
      fecha.setHours(0, 0, 0, 0)

      // Para cada empleado, generar registros del día
      for (const empleado of empleados as Array<{ id: string }>) {
        // 80% de probabilidad de que el empleado haya asistido ese día
        if (Math.random() > 0.2) {
          // Hora de entrada entre 7:00 y 9:00
          const horaEntrada = new Date(fecha)
          horaEntrada.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0)

          registros.push({
            empleado_id: empleado.id,
            tipo_evento: 'entrada',
            fecha_hora: horaEntrada.toISOString(),
          })

          // 70% de probabilidad de que haya salido a almuerzo
          if (Math.random() > 0.3) {
            // Salida a almuerzo entre 12:00 y 13:00
            const horaSalidaAlmuerzo = new Date(fecha)
            horaSalidaAlmuerzo.setHours(12 + Math.floor(Math.random() * 1), Math.floor(Math.random() * 60), 0, 0)

            registros.push({
              empleado_id: empleado.id,
              tipo_evento: 'salida_almuerzo',
              fecha_hora: horaSalidaAlmuerzo.toISOString(),
            })

            // Entrada de almuerzo entre 13:00 y 14:00
            const horaEntradaAlmuerzo = new Date(horaSalidaAlmuerzo)
            horaEntradaAlmuerzo.setHours(13 + Math.floor(Math.random() * 1), Math.floor(Math.random() * 60), 0, 0)

            registros.push({
              empleado_id: empleado.id,
              tipo_evento: 'entrada_almuerzo',
              fecha_hora: horaEntradaAlmuerzo.toISOString(),
            })
          }

          // Hora de salida entre 17:00 y 19:00
          const horaSalida = new Date(fecha)
          horaSalida.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0)

          registros.push({
            empleado_id: empleado.id,
            tipo_evento: 'salida',
            fecha_hora: horaSalida.toISOString(),
          })
        }
      }
    }

    // Insertar registros en lotes
    const batchSize = 50
    let inserted = 0

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize)
      
      // @ts-expect-error - Supabase type inference issue
      const { error } = await supabase.from('registros_asistencia').insert(batch as any)

      if (error) {
        console.error('Error inserting attendance batch:', error)
        continue
      }

      inserted += batch.length
    }

    toast.success(`${inserted} registros de asistencia de ejemplo creados`)
    return { success: true, count: inserted }
  } catch (error: any) {
    console.error('Error creating sample attendance records:', error)
    toast.error('Error al crear registros de asistencia de ejemplo')
    return { success: false, count: 0 }
  }
}

/**
 * Pobla el sistema con datos de ejemplo (empleados y registros)
 */
export async function populateSampleData(userId: string, days: number = 7): Promise<{ success: boolean }> {
  try {
    // Crear empleados primero
    const empleadosResult = await createSampleEmployees(userId)
    
    if (!empleadosResult.success) {
      return { success: false }
    }

    // Esperar un poco para que los empleados se creen
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Crear registros de asistencia
    const registrosResult = await createSampleAttendanceRecords(days)

    if (!registrosResult.success) {
      return { success: false }
    }

    toast.success('Datos de ejemplo creados correctamente')
    return { success: true }
  } catch (error: any) {
    console.error('Error populating sample data:', error)
    toast.error('Error al poblar datos de ejemplo')
    return { success: false }
  }
}

