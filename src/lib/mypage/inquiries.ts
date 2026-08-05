import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

export const INQUIRY_CATEGORIES = [
  { value: "PAYMENT", label: "결제·환불" },
  { value: "RESULT", label: "분석 결과" },
  { value: "ACCOUNT", label: "계정" },
  { value: "ETC", label: "기타" },
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number]["value"];

export type InquiryStatus = "RECEIVED" | "IN_PROGRESS" | "ANSWERED";

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  RECEIVED: "접수됨",
  IN_PROGRESS: "확인 중",
  ANSWERED: "답변 완료",
};

// DB의 inquiries_message_length_check와 같은 값. 어긋나면 화면은 통과시킨 입력이
// 저장 단계에서 거절되므로 한쪽만 바꾸지 말 것.
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

export type InquiryItem = {
  id: string;
  category: InquiryCategory;
  categoryLabel: string;
  message: string;
  status: InquiryStatus;
  createdAt: string | null;
  answer: string | null; // 운영자 답변. 채워지면 문의 내역에 함께 보인다.
  answeredAt: string | null;
};

const CATEGORY_LABEL = Object.fromEntries(
  INQUIRY_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

/** 내 문의 내역을 최신순으로 조회. RLS가 본인 것만 내준다. */
export async function getInquiries(): Promise<InquiryItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("id, category, message, status, created_at, answer, answered_at")
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  type Row = {
    id: string;
    category: string;
    message: string;
    status: string;
    created_at: string | null;
    answer: string | null;
    answered_at: string | null;
  };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    category: row.category as InquiryCategory,
    categoryLabel: CATEGORY_LABEL[row.category] ?? "기타",
    message: row.message,
    status: row.status as InquiryStatus,
    createdAt: row.created_at,
    answer: row.answer,
    answeredAt: row.answered_at,
  }));
}

/** 문의 등록. status·answer는 기본값으로 들어가고 운영자만 갱신한다. */
export async function createInquiry(input: {
  userId: string;
  category: InquiryCategory;
  message: string;
}): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("inquiries").insert({
    user_id: input.userId,
    category: input.category,
    message: input.message.trim(),
  });

  if (error) throw toError(error);
}
