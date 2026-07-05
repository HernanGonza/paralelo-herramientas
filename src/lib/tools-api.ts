import { supabase } from "@/integrations/supabase/client";

export type Herramienta = {
  id: string;
  nombre: string;
  url: string;
  categoria_id: string;
  descripcion: string | null;
  etiquetas: string[];
  favorito: boolean;
  creado_en: string;
  categoria?: {
    nombre: string;
    seccion?: { nombre: string } | null;
  } | null;
};

export type HerramientaInput = {
  nombre: string;
  url: string;
  descripcion: string;
  etiquetas: string[];
  favorito: boolean;
  seccion: string;
  categoria: string;
};

const SELECT_CON_RELACIONES = "*, categoria:categorias(nombre, seccion:secciones(nombre))";

async function obtenerOCrearSeccion(nombre: string): Promise<string> {
  const { data: existente, error: errorLectura } = await supabase
    .from("secciones")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();
  if (errorLectura) throw errorLectura;
  if (existente) return existente.id;

  const { data, error } = await supabase.from("secciones").insert({ nombre }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function obtenerOCrearCategoria(nombre: string, seccionId: string): Promise<string> {
  const { data: existente, error: errorLectura } = await supabase
    .from("categorias")
    .select("id")
    .eq("nombre", nombre)
    .eq("seccion_id", seccionId)
    .maybeSingle();
  if (errorLectura) throw errorLectura;
  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre, seccion_id: seccionId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchSecciones() {
  const { data, error } = await supabase.from("secciones").select("*").order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*, seccion:secciones(nombre)")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function fetchHerramientas(): Promise<Herramienta[]> {
  const { data, error } = await supabase
    .from("herramientas")
    .select(SELECT_CON_RELACIONES)
    .order("favorito", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Herramienta[];
}

export async function crearHerramienta(input: HerramientaInput): Promise<Herramienta> {
  const seccionId = await obtenerOCrearSeccion(input.seccion.trim());
  const categoriaId = await obtenerOCrearCategoria(input.categoria.trim(), seccionId);

  const { data, error } = await supabase
    .from("herramientas")
    .insert({
      nombre: input.nombre,
      url: input.url,
      descripcion: input.descripcion || null,
      etiquetas: input.etiquetas,
      favorito: input.favorito,
      categoria_id: categoriaId,
    })
    .select(SELECT_CON_RELACIONES)
    .single();
  if (error) throw error;
  return data as unknown as Herramienta;
}

export async function actualizarHerramienta(
  id: string,
  input: Partial<HerramientaInput>,
): Promise<Herramienta> {
  const patch: Record<string, unknown> = {};
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.url !== undefined) patch.url = input.url;
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion || null;
  if (input.etiquetas !== undefined) patch.etiquetas = input.etiquetas;
  if (input.favorito !== undefined) patch.favorito = input.favorito;

  if (input.seccion !== undefined && input.categoria !== undefined) {
    const seccionId = await obtenerOCrearSeccion(input.seccion.trim());
    patch.categoria_id = await obtenerOCrearCategoria(input.categoria.trim(), seccionId);
  }

  const { data, error } = await supabase
    .from("herramientas")
    .update(patch)
    .eq("id", id)
    .select(SELECT_CON_RELACIONES)
    .single();
  if (error) throw error;
  return data as unknown as Herramienta;
}

export async function eliminarHerramienta(id: string): Promise<void> {
  const { error } = await supabase.from("herramientas").delete().eq("id", id);
  if (error) throw error;
}

export async function alternarFavorito(id: string, siguiente: boolean): Promise<void> {
  const { error } = await supabase.from("herramientas").update({ favorito: siguiente }).eq("id", id);
  if (error) throw error;
}
