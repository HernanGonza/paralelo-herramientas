import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search, Star, Settings, Sparkles } from "lucide-react";
import { fetchTools, toggleFavorite, type Tool } from "@/lib/tools-api";
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

function Index() {
  const qc = useQueryClient();
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
  });

  const [section, setSection] = useState<string>("All");
  const [category, setCategory] = useState<string>("All");
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [active, setActive] = useState<Tool | null>(null);

  const sections = useMemo(() => {
    const s = new Set<string>();
    tools.forEach((t) => s.add(t.section));
    return ["All", ...Array.from(s).sort()];
  }, [tools]);

  const categories = useMemo(() => {
    const c = new Set<string>();
    tools
      .filter((t) => section === "All" || t.section === section)
      .forEach((t) => c.add(t.category));
    return ["All", ...Array.from(c).sort()];
  }, [tools, section]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tools.filter((t) => {
      if (section !== "All" && t.section !== section) return false;
      if (category !== "All" && t.category !== category) return false;
      if (onlyFav && !t.is_favorite) return false;
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        t.category.toLowerCase().includes(query)
      );
    });
  }, [tools, section, category, q, onlyFav]);

  const favMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleFavorite(id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
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
        {/* Search + fav filter */}
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
            variant={onlyFav ? "default" : "outline"}
            onClick={() => setOnlyFav((v) => !v)}
            className="gap-1.5"
          >
            <Star className={"h-4 w-4 " + (onlyFav ? "fill-current" : "")} />
            Favoritos
          </Button>
        </div>

        {/* Section tabs */}
        <div className="mt-5 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSection(s);
                setCategory("All");
              }}
              className={
                "shrink-0 rounded-md px-3 py-1.5 font-mono text-xs transition-colors " +
                (section === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted")
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  "rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors " +
                  (category === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="mt-6">
          {isLoading ? (
            <p className="py-16 text-center font-mono text-sm text-muted-foreground">
              cargando…
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState hasAny={tools.length > 0} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  onOpen={() => setActive(t)}
                  onFav={() =>
                    favMut.mutate({ id: t.id, next: !t.is_favorite })
                  }
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
          {filtered.length} / {tools.length} recursos
        </p>
      </main>

      <ToolDetail tool={active} onClose={() => setActive(null)} />
    </div>
  );
}

function ToolCard({
  tool,
  onOpen,
  onFav,
}: {
  tool: Tool;
  onOpen: () => void;
  onFav: () => void;
}) {
  return (
    <article
      className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/60 hover:shadow-[var(--shadow-card)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="truncate font-mono text-sm font-semibold text-foreground group-hover:text-primary">
            {tool.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {tool.section} / {tool.category}
          </p>
        </button>
        <button
          onClick={onFav}
          aria-label="Favorito"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
        >
          <Star className={"h-4 w-4 " + (tool.is_favorite ? "fill-primary text-primary" : "")} />
        </button>
      </div>

      {tool.description && (
        <p
          onClick={onOpen}
          className="mt-3 line-clamp-3 cursor-pointer text-sm text-muted-foreground"
        >
          {tool.description}
        </p>
      )}

      {tool.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tool.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
              {tag}
            </Badge>
          ))}
          {tool.tags.length > 4 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              +{tool.tags.length - 4}
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
          href={tool.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
        >
          Abrir <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

function ToolDetail({ tool, onClose }: { tool: Tool | null; onClose: () => void }) {
  return (
    <Dialog open={!!tool} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {tool && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono">{tool.name}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {tool.section} / {tool.category}
              </DialogDescription>
            </DialogHeader>
            {tool.description && (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {tool.description}
              </p>
            )}
            {tool.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button asChild>
                <a href={tool.url} target="_blank" rel="noreferrer noopener">
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
