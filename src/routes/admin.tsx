import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTool,
  deleteTool,
  fetchTools,
  updateTool,
  type Tool,
  type ToolInput,
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

const emptyInput: ToolInput = {
  name: "",
  url: "",
  section: "",
  category: "",
  description: "",
  tags: [],
  is_favorite: false,
};

function AdminPage() {
  const qc = useQueryClient();
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
  });

  const [editing, setEditing] = useState<Tool | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tools"] });

  const createMut = useMutation({
    mutationFn: createTool,
    onSuccess: () => {
      invalidate();
      toast.success("Herramienta creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ToolInput> }) =>
      updateTool(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Actualizada");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTool,
    onSuccess: () => {
      invalidate();
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
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" /> Nueva
              </Button>
            </DialogTrigger>
            <ToolForm
              initial={editing}
              submitting={createMut.isPending || updateMut.isPending}
              onSubmit={(input) => {
                if (editing) updateMut.mutate({ id: editing.id, input });
                else createMut.mutate(input);
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
        ) : tools.length === 0 ? (
          <p className="py-16 text-center font-mono text-sm text-muted-foreground">
            Todavía no hay herramientas. Agregá la primera.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {tools.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium">{t.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {t.section} / {t.category} · {t.url}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(t);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`¿Eliminar "${t.name}"?`)) deleteMut.mutate(t.id);
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
  initial: Tool | null;
  submitting: boolean;
  onSubmit: (input: ToolInput) => void;
}) {
  const [form, setForm] = useState<ToolInput>(
    initial
      ? {
          name: initial.name,
          url: initial.url,
          section: initial.section,
          category: initial.category,
          description: initial.description ?? "",
          tags: initial.tags,
          is_favorite: initial.is_favorite,
        }
      : emptyInput,
  );
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));

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
          const tags = tagsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onSubmit({ ...form, tags });
        }}
      >
        <Field label="Nombre">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
            />
          </Field>
          <Field label="Categoría">
            <Input
              required
              placeholder="Librerías JS"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Descripción">
          <Textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Tags (separados por coma)">
          <Input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="animación, ui, react"
          />
        </Field>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.is_favorite}
            onCheckedChange={(v) => setForm({ ...form, is_favorite: v })}
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