// 사격(수리) 표시 순서. grids jsonb의 키와 동일.
const GRID_LABELS = ["원격", "형격", "이격", "정격", "총격"] as const;

export type Luck = "good" | "bad" | "mixed";

export type GridItem = {
  label: string;
  stroke: number;
  luck: Luck;
  description: string;
};

// grids jsonb → 표시 순서대로 정규화. 값이 없거나 형태가 다르면 건너뛴다.
export function parseGrids(raw: unknown): GridItem[] {
  if (!raw || typeof raw !== "object") return [];
  const grids = raw as Record<
    string,
    { stroke?: number; luck?: string; description?: string }
  >;

  return GRID_LABELS.flatMap((label) => {
    const item = grids[label];
    if (!item || typeof item.stroke !== "number") return [];
    return [
      {
        label,
        stroke: item.stroke,
        luck: (item.luck ?? "mixed") as Luck,
        description: item.description ?? "",
      },
    ];
  });
}
