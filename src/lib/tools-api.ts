import { supabase } from "@/integrations/supabase/client";

export type Tool = {
  id: string;
  name: string;
  url: string;
  section: string;
  category: string;
  description: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
};

export type ToolInput = Omit<Tool, "id" | "created_at">;

export async function fetchTools(): Promise<Tool[]> {
  const { data, error } = await supabase
    .from("tools" as never)
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Tool[];
}

export async function createTool(input: ToolInput): Promise<Tool> {
  const { data, error } = await supabase
    .from("tools" as never)
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Tool;
}

export async function updateTool(id: string, input: Partial<ToolInput>): Promise<Tool> {
  const { data, error } = await supabase
    .from("tools" as never)
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Tool;
}

export async function deleteTool(id: string): Promise<void> {
  const { error } = await supabase.from("tools" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function toggleFavorite(id: string, next: boolean): Promise<void> {
  const { error } = await supabase
    .from("tools" as never)
    .update({ is_favorite: next } as never)
    .eq("id", id);
  if (error) throw error;
}