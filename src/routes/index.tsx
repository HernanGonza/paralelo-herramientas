import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search, Star, Settings, Sparkles } from "lucide-react";
import { fetchHerramientas, alternarFavorito, type Herramienta } from "@/lib/tools-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Index,
});

function nombreSeccion(h: Herramienta) {
  return h.categoria?.seccion?.nombre ?? "";
}
function nombreCategoria(h: Herramienta) {
  return h.categoria?.nombre ?? "";
}

function Index() {
  const qc = useQueryClient();
  const { data: herramientas = [], isLoading } = useQuery({
    queryKey: ["herramientas"],
    queryFn: fetchHerramientas,
  });

  const [seccion, setSeccion] = useState<string>("Todas");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [q, setQ] = useState("");
  const [soloFav, setSoloFav] = useState(false);
  const [activa, setActiva] = useState<Herramienta | null>(null);

  const secciones = useMemo(() => {
    const s = new Set<string>();
    herramientas.forEach((h) => s.add(nombreSeccion(h)));
    return ["Todas", ...Array.from(s).sort()];
  }, [herramientas]);

  const categorias = useMemo(() => {
    const c = new Set<string>();
    herramientas
      .filter((h) => seccion === "Todas" || nombreSeccion(h) === seccion)
      .forEach((h) => c.add(nombreCategoria(h)));
    return ["Todas", ...Array.from(c).sort()];
  }, [herramientas, seccion]);

  const filtradas = useMemo(() => {
    const query = q.trim().toLowerCase();
    return herramientas.filter((h) => {
      if (seccion !== "Todas" && nombreSeccion(h) !== seccion) return false;
      if (categoria !== "Todas" && nombreCategoria(h) !== categoria) return false;
      if (soloFav && !h.favorito) return false;
      if (!query) return true;
      return (
        h.nombre.toLowerCase().includes(query) ||
        (h.descripcion?.toLowerCase().includes(query) ?? false) ||
        h.etiquetas.some((tag) => tag.toLowerCase().includes(query)) ||
        nombreCategoria(h).toLowerCase().includes(query)
      );
    });
  }, [herramientas, seccion, categoria, q, soloFav]);

  const favMut = useMutation({
    mutationFn: ({ id, siguiente }: { id: string; siguiente: boolean }) =>
      alternarFavorito(id, siguiente),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["herramientas"] }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-mono text-base font-semibold tracking-tight sm:text-lg">
                herramientas<span className="text-primary">.</span>
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Biblioteca personal de recursos dev
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {/* Buscador + favoritos */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, tag, descripción…"
              className="h-11 pl-9 font-mono text-sm"
            />
          </div>
          <Button
            variant={soloFav ? "default" : "outline"}
            onClick={() => setSoloFav((v) => !v)}
            className="gap-1.5"
          >
            <Star className={"h-4 w-4 " + (soloFav ? "fill-current" : "")} />
            Favoritos
          </Button>
        </div>

        {/* Tabs de sección */}
        <div className="mt-5 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {secciones.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSeccion(s);
                setCategoria("Todas");
              }}
              className={
                "shrink-0 rounded-md px-3 py-1.5 font-mono text-xs transition-colors " +
                (seccion === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted")
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chips de categoría */}
        {categorias.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={
                  "rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors " +
                  (categoria === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Grilla */}
        <div className="mt-6">
          {isLoading ? (
            <p className="py-16 text-center font-mono text-sm text-muted-foreground">
              cargando…
            </p>
          ) : filtradas.length === 0 ? (
            <EmptyState hasAny={herramientas.length > 0} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((h) => (
                <ToolCard
                  key={h.id}
                  herramienta={h}
                  onOpen={() => setActiva(h)}
                  onFav={() => favMut.mutate({ id: h.id, siguiente: !h.favorito })}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
          {filtradas.length} / {herramientas.length} recursos
        </p>
      </main>

      <ToolDetail herramienta={activa} onClose={() => setActiva(null)} />
    </div>
  );
}

function ToolCard({
  herramienta,
  onOpen,
  onFav,
}: {
  herramienta: Herramienta;
  onOpen: () => void;
  onFav: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(herramienta.url)}?w=600`;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/60 hover:shadow-[var(--shadow-card)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {!imgError && (
        <button
          onClick={onOpen}
          className="block aspect-[16/9] w-full overflow-hidden bg-muted"
        >
          <img
            src={thumbUrl}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top transition-transform group-hover:scale-105"
          />
        </button>
      )}

      <div className="flex flex-1 flex-col p-4">
      <div className="flex items-start gap-2">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <h3 className="truncate font-mono text-sm font-semibold text-foreground group-hover:text-primary">
            {herramienta.nombre}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {nombreSeccion(herramienta)} / {nombreCategoria(herramienta)}
          </p>
        </button>
        <button
          onClick={onFav}
          aria-label="Favorito"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
        >
          <Star className={"h-4 w-4 " + (herramienta.favorito ? "fill-primary text-primary" : "")} />
        </button>
      </div>

      {herramienta.descripcion && (
        <p
          onClick={onOpen}
          className="mt-3 line-clamp-3 cursor-pointer text-sm text-muted-foreground"
        >
          {herramienta.descripcion}
        </p>
      )}

      {herramienta.etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {herramienta.etiquetas.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
              {tag}
            </Badge>
          ))}
          {herramienta.etiquetas.length > 4 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              +{herramienta.etiquetas.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <button
          onClick={onOpen}
          className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          Ver detalle
        </button>
        <a
          href={herramienta.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
        >
          Abrir <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      </div>
    </article>
  );
}

function ToolDetail({
  herramienta,
  onClose,
}: {
  herramienta: Herramienta | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!herramienta} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {herramienta && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono">{herramienta.nombre}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {nombreSeccion(herramienta)} / {nombreCategoria(herramienta)}
              </DialogDescription>
            </DialogHeader>
            {herramienta.descripcion && (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {herramienta.descripcion}
              </p>
            )}
            {herramienta.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {herramienta.etiquetas.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button asChild>
                <a href={herramienta.url} target="_blank" rel="noreferrer noopener">
                  Abrir <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">
        {hasAny ? "No hay resultados con estos filtros." : "Todavía no hay herramientas cargadas."}
      </p>
      {!hasAny && (
        <Button asChild className="mt-4" variant="default">
          <Link to="/admin">Agregar la primera</Link>
        </Button>
      )}
    </div>
  );
}
