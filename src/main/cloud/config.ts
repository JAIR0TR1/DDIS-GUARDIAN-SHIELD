/**
 * Proyecto de Supabase (cuentas y base de datos en la nube).
 * La clave «publishable» es PÚBLICA por diseño: puede ir dentro de la app. La seguridad la pone
 * la base de datos con Row Level Security (ver supabase/schema.sql): cada usuario solo puede
 * leer y escribir sus propias filas. La clave secreta (service_role) NUNCA va en la app.
 * En desarrollo se pueden reemplazar con SUPABASE_URL y SUPABASE_KEY en el entorno.
 */
const DEFAULT_URL = 'https://gjbbylfssbtfrmyliunm.supabase.co'
const DEFAULT_KEY = 'sb_publishable_alUnXEEAYtzgnjOnXYiglw_1cfUK14p'

export interface CloudConfig {
  url: string
  key: string
}

/** `null` si falta la configuración: la app sigue funcionando solo en local. */
export function cloudConfig(): CloudConfig | null {
  const url = process.env['SUPABASE_URL'] ?? DEFAULT_URL
  const key = process.env['SUPABASE_KEY'] ?? DEFAULT_KEY
  if (!url || !key) return null
  return { url, key }
}
