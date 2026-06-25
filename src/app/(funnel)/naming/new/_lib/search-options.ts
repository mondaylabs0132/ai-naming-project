import { createClient } from "@/lib/supabase/client";

export type SurnameOption = {
  id: number;
  hangul: string;
  hanja: string;
};

export type HanjaOption = {
  id: number;
  hanja: string;
  hangulMain: string;
  meanings: string[];
};

type SearchHanjaOptionsRow = {
  id: number | string;
  hanja: string;
  hangul_main: string;
  meanings: string[] | null;
};

const SURNAME_QUERY_MAX_LENGTH = 2;
const SURNAME_OPTION_LIMIT = 10;

function normalizeHangulQuery(value: string) {
  return value.replace(/[^가-힣]/g, "").slice(0, SURNAME_QUERY_MAX_LENGTH);
}

export async function searchSurnameOptions(query: string) {
  const normalizedQuery = normalizeHangulQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("surnames")
    .select("id, hangul, hanja")
    .ilike("hangul", `%${normalizedQuery}%`)
    .order("id", { ascending: true })
    .limit(SURNAME_OPTION_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as SurnameOption[];
}

export async function searchAvoidHanjaOptions(query: string) {
  const normalizedQuery = query.trim().replace(/\s+/g, " ").slice(0, 20);

  if (!normalizedQuery) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_hanja_options", {
    q: normalizedQuery,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SearchHanjaOptionsRow[]).map((item) => ({
    id: Number(item.id),
    hanja: item.hanja,
    hangulMain: item.hangul_main,
    meanings: item.meanings ?? [],
  }));
}
