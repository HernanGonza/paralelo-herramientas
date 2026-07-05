import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  crearHerramienta,
  eliminarHerramienta,
  fetchHerramientas,
  actualizarHerramienta,
  type Herramienta,
  type HerramientaInput,
} from "@/lib/tools-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Herramientas" },
      { name: "description", content: "Administrá tu biblioteca de recursos." },
    ],
  }),
  component: AdminPage,
});

const formularioVacio: HerramientaInput = {
  nombre: "",
  url: "",
  seccion: "",
  categoria: "",
  descripcion: "",
  etiquetas: [],
  favorito: false,
};

function AdminPage() {
  const qc = useQueryClient();
  const { data: herramientas = [], isLoading } = useQuery({
    queryKey: ["herramientas"],
    queryFn: fetchHerramientas,
  });

  const [editando, setEditando] = useState<Herramienta | null>(null);
  const [open, setOpen] = useState(false);

  const invalidar = () => qc.invalidateQueries({ queryKey: ["herramientas"] });

  const crearMut = useMutation({
    mutationFn: crearHerramienta,
    onSuccess: () => {
      invalidar();
      toast.success("Herramienta creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<HerramientaInput> }) =>
      actualizarHerramienta(id, input),
    onSuccess: () => {
      invalidar();
      toast.success("Actualizada");
      setOpen(false);
      setEditando(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminarMut = useMutation({
    mutationFn: eliminarHerramienta,
    onSuccess: () => {
      invalidar();
      toast.success("Eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-mono text-base font-semibold">admin</h1>
          <div className="flex-1" />
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditando(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => setEditando(null)}>
                <Plus className="h-4 w-4" /> Nueva
              </Button>
            </DialogTrigger>
            <ToolForm
              initial={editando}
              submitting={crearMut.isPending || actualizarMut.isPending}
              onSubmit={(input) => {
                if (editando) actualizarMut.mutate({ id: editando.id, input });
                else crearMut.mutate(input);
              }}
            />
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {isLoading ? (
          <p className="py-16 text-center font-mono text-sm text-muted-foreground">
            cargando…
          </p>
        ) : herramientas.length === 0 ? (
          <p className="py-16 text-center font-mono text-sm text-muted-foreground">
            Todavía no hay herramientas. Agregá la primera.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {herramientas.map((h) => (
              <li key={h.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium">{h.nombre}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {h.categoria?.seccion?.nombre} / {h.categoria?.nombre} · {h.url}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditando(h);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`¿Eliminar "${h.nombre}"?`)) eliminarMut.mutate(h.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ToolForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial: Herramienta | null;
  submitting: boolean;
  onSubmit: (input: HerramientaInput) => void;
}) {
  const [form, setForm] = useState<HerramientaInput>(
    initial
      ? {
          nombre: initial.nombre,
          url: initial.url,
          seccion: initial.categoria?.seccion?.nombre ?? "",
          categoria: initial.categoria?.nombre ?? "",
          descripcion: initial.descripcion ?? "",
          etiquetas: initial.etiquetas,
          favorito: initial.favorito,
        }
      : formularioVacio,
  );
  const [etiquetasRaw, setEtiquetasRaw] = useState((initial?.etiquetas ?? []).join(", "));

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-mono">
          {initial ? "Editar herramienta" : "Nueva herramienta"}
        </DialogTitle>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const etiquetas = etiquetasRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onSubmit({ ...form, etiquetas });
        }}
      >
        <Field label="Nombre">
          <Input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </Field>
        <Field label="URL">
          <Input
            required
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sección">
            <Input
              required
              placeholder="JavaScript"
              value={form.seccion}
              onChange={(e) => setForm({ ...form, seccion: e.target.value })}
            />
          </Field>
          <Field label="Categoría">
            <Input
              required
              placeholder="Librerías JS"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Descripción">
          <Textarea
            rows={3}
            value={form.descripcion ?? ""}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Field>
        <Field label="Etiquetas (separadas por coma)">
          <Input
            value={etiquetasRaw}
            onChange={(e) => setEtiquetasRaw(e.target.value)}
            placeholder="animación, ui, react"
          />
        </Field>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.favorito}
            onCheckedChange={(v) => setForm({ ...form, favorito: v })}
            id="fav"
          />
          <Label htmlFor="fav">Favorita</Label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-xs">{label}</Label>
      {children}
    </div>
  );
}
