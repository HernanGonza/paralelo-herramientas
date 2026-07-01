
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  section TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tools TO authenticated;
GRANT ALL ON public.tools TO service_role;

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Personal-use app without auth for now: allow open access.
-- TODO: tighten these policies once auth is added.
CREATE POLICY "Public can read tools" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Public can insert tools" ON public.tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update tools" ON public.tools FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete tools" ON public.tools FOR DELETE USING (true);

CREATE INDEX tools_section_idx ON public.tools(section);
CREATE INDEX tools_category_idx ON public.tools(category);
CREATE INDEX tools_favorite_idx ON public.tools(is_favorite);
