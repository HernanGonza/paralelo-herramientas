CREATE TABLE public.secciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nombre, seccion_id)
);

CREATE TABLE public.herramientas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  descripcion TEXT,
  etiquetas TEXT[] NOT NULL DEFAULT '{}',
  favorito BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX categorias_seccion_idx ON public.categorias(seccion_id);
CREATE INDEX herramientas_categoria_idx ON public.herramientas(categoria_id);
CREATE INDEX herramientas_favorito_idx ON public.herramientas(favorito);

ALTER TABLE public.secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.herramientas ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.secciones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.herramientas TO anon, authenticated;
GRANT ALL ON public.secciones, public.categorias, public.herramientas TO service_role;

-- Uso personal sin auth por ahora: acceso abierto.
-- TODO: restringir politicas cuando se agregue login.
CREATE POLICY "Lectura publica secciones" ON public.secciones FOR SELECT USING (true);
CREATE POLICY "Escritura publica secciones" ON public.secciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica secciones" ON public.secciones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico secciones" ON public.secciones FOR DELETE USING (true);

CREATE POLICY "Lectura publica categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Escritura publica categorias" ON public.categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica categorias" ON public.categorias FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico categorias" ON public.categorias FOR DELETE USING (true);

CREATE POLICY "Lectura publica herramientas" ON public.herramientas FOR SELECT USING (true);
CREATE POLICY "Escritura publica herramientas" ON public.herramientas FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica herramientas" ON public.herramientas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico herramientas" ON public.herramientas FOR DELETE USING (true);
