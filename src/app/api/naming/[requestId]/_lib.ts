import { createAdminClient } from '@/lib/supabase/admin';
import { calculateSaju } from '@fullstackfamily/manseryeok';

// ==========================================================
// Types
// ==========================================================

export type LuckType = 'good' | 'bad' | 'mixed';
export type GridItem = { stroke: number; luck: LuckType; description: string };
export type Grids = {
  원격: GridItem; 형격: GridItem; 이격: GridItem; 정격: GridItem;
  총격: GridItem & { rawStroke: number };
  goodCount: number; isAllGood: boolean; isThreeGood: boolean; isTwoGood: boolean;
};

export type RichName = {
  hangul: string; hanja: string;
  hanja1: string; hanja2: string;
  hangul1: string; hangul2: string;
  meaning1: string[]; meaning2: string[];
  reason: string; score: number; grids: Grids;
  ohang1: string; ohang2: string;
  soundScore: number; soundOhangList: string[]; soundDetails: string[];
};

export type NameDetail = {
  summary: string;
  categories: { title: string; description: string }[];
  detail: string;
  tags: string[];
};

export type SurveyRow = {
  request_id: string;
  surname_id: number;
  birth_year: number;
  birth_month: number;
  birth_day: number | null;
  birth_time: string | null;
  gender: '남자' | '여자';
  mood_keywords: string[];
  avoid_hangul: string[];
  // 설문에서 고른 기피 한자의 hanja.id 목록(최대 5개).
  // 글자 자체가 아니라 id로 저장되므로 생성 전에 문자로 풀어야 한다.
  avoid_hanja_id: number[];
  sibling_names: string[];
  generation_name: string | null;
};

export type SurnameRow = {
  id: number;
  hangul: string;
  hanja: string;
  won_stroke: number;
};

// ==========================================================
// Constants
// ==========================================================

export const ganOhang: Record<string, string> = {
  갑: '木', 을: '木', 병: '火', 정: '火',
  무: '土', 기: '土', 경: '金', 신: '金', 임: '水', 계: '水',
};

export const jiOhang: Record<string, string> = {
  자: '水', 축: '土', 인: '木', 묘: '木', 진: '土', 사: '火',
  오: '火', 미: '土', 신: '金', 유: '金', 술: '土', 해: '水',
};

export const stroke81: Record<number, { luck: LuckType; description: string }> = {
  1:  { luck: 'good',  description: '만물의 근원, 자수성가' },
  2:  { luck: 'bad',   description: '분리운, 고독' },
  3:  { luck: 'good',  description: '명예운, 총명하고 출세' },
  4:  { luck: 'bad',   description: '고난운, 파란이 많음' },
  5:  { luck: 'good',  description: '복덕운, 오행이 갖춰져 성공' },
  6:  { luck: 'good',  description: '계승운, 안정되고 덕망' },
  7:  { luck: 'good',  description: '독립운, 의지가 강하고 성공' },
  8:  { luck: 'good',  description: '발전운, 노력으로 크게 성공' },
  9:  { luck: 'bad',   description: '역경운, 단명하거나 실패' },
  10: { luck: 'bad',   description: '공허운, 겉은 화려하나 속은 허함' },
  11: { luck: 'good',  description: '자수성가운, 번창하고 성공' },
  12: { luck: 'bad',   description: '박약운, 고독하고 무력함' },
  13: { luck: 'good',  description: '지모운, 총명하고 출세' },
  14: { luck: 'bad',   description: '이산운, 가정과 사업이 흩어짐' },
  15: { luck: 'good',  description: '덕망운, 인덕이 있어 성공' },
  16: { luck: 'good',  description: '덕후운, 사람들의 신망을 얻음' },
  17: { luck: 'good',  description: '건창운, 강한 의지로 성공' },
  18: { luck: 'good',  description: '발전운, 권위와 재물을 얻음' },
  19: { luck: 'bad',   description: '고난운, 병약하거나 실패' },
  20: { luck: 'bad',   description: '허망운, 허무하게 무너짐' },
  21: { luck: 'good',  description: '두령운, 지도자적 기질' },
  22: { luck: 'bad',   description: '중절운, 중도에 좌절' },
  23: { luck: 'good',  description: '공명운, 이름을 떨치고 성공' },
  24: { luck: 'good',  description: '입신운, 재물과 명예를 얻음' },
  25: { luck: 'mixed', description: '안강운, 안정적이나 때로 굴곡' },
  26: { luck: 'bad',   description: '영웅운, 파란이 많은 영웅 기질' },
  27: { luck: 'mixed', description: '중길운, 성공하나 만년에 굴곡' },
  28: { luck: 'bad',   description: '파란운, 파란만장하고 불안정' },
  29: { luck: 'good',  description: '성공운, 지혜롭고 크게 성공' },
  30: { luck: 'mixed', description: '부침운, 성패가 반반' },
  31: { luck: 'good',  description: '융창운, 덕망 있고 번창' },
  32: { luck: 'good',  description: '행운, 뜻밖의 행운으로 성공' },
  33: { luck: 'good',  description: '승천운, 강한 리더십으로 성공' },
  34: { luck: 'bad',   description: '파멸운, 재난과 파멸의 기운' },
  35: { luck: 'good',  description: '온건운, 학문과 예술로 성공' },
  36: { luck: 'mixed', description: '영웅운, 영웅적이나 파란 多' },
  37: { luck: 'good',  description: '권위운, 덕망과 권위로 성공' },
  38: { luck: 'mixed', description: '예능운, 예술적 재능' },
  39: { luck: 'good',  description: '부귀운, 부귀영화를 누림' },
  40: { luck: 'bad',   description: '무상운, 덧없고 허망함' },
  41: { luck: 'good',  description: '최고운, 덕망과 실력으로 최고' },
  42: { luck: 'mixed', description: '중길운, 중간 정도의 성공' },
  43: { luck: 'bad',   description: '산란운, 산만하고 불안정' },
  44: { luck: 'bad',   description: '마장운, 장애가 많고 실패' },
  45: { luck: 'good',  description: '순성운, 순조롭게 성공' },
  46: { luck: 'bad',   description: '미달운, 뜻을 이루지 못함' },
  47: { luck: 'good',  description: '개화운, 늦게 피는 꽃, 만년 성공' },
  48: { luck: 'good',  description: '유덕운, 덕망 있고 존경받음' },
  49: { luck: 'mixed', description: '변화운, 변화가 많고 기복' },
  50: { luck: 'mixed', description: '중길운, 절반의 성공과 실패' },
  51: { luck: 'mixed', description: '성쇠운, 성공과 실패가 반복' },
  52: { luck: 'good',  description: '진취운, 적극적으로 성공' },
  53: { luck: 'bad',   description: '내허운, 겉은 성공 속은 허함' },
  54: { luck: 'bad',   description: '고난운, 파란이 많고 불운' },
  55: { luck: 'bad',   description: '불완전운, 완성되지 못함' },
  56: { luck: 'bad',   description: '한탄운, 뜻대로 되지 않음' },
  57: { luck: 'mixed', description: '노력운, 꾸준한 노력으로 성공' },
  58: { luck: 'mixed', description: '후길운, 후반에 길해짐' },
  59: { luck: 'bad',   description: '장애운, 장애가 많고 실패' },
  60: { luck: 'bad',   description: '암흑운, 앞이 보이지 않음' },
  61: { luck: 'good',  description: '명예운, 명예와 덕망을 얻음' },
  62: { luck: 'bad',   description: '쇠퇴운, 점점 쇠퇴함' },
  63: { luck: 'good',  description: '순성운, 순조롭게 성공' },
  64: { luck: 'bad',   description: '침체운, 의욕이 없고 침체' },
  65: { luck: 'good',  description: '장수운, 건강하고 장수' },
  66: { luck: 'bad',   description: '쇠퇴운, 활력이 없고 쇠퇴' },
  67: { luck: 'good',  description: '성공운, 안정적으로 성공' },
  68: { luck: 'good',  description: '발전운, 꾸준히 발전' },
  69: { luck: 'bad',   description: '불안운, 불안하고 방황' },
  70: { luck: 'bad',   description: '공허운, 허무하고 공허함' },
  71: { luck: 'mixed', description: '반길운, 반은 길하고 반은 흉' },
  72: { luck: 'bad',   description: '후흉운, 후반에 흉해짐' },
  73: { luck: 'mixed', description: '안정운, 평온하나 발전 부족' },
  74: { luck: 'bad',   description: '실패운, 노력해도 실패' },
  75: { luck: 'mixed', description: '평온운, 무난하게 살아감' },
  76: { luck: 'bad',   description: '선길후흉운, 초반 성공 후반 실패' },
  77: { luck: 'mixed', description: '길흉반반운, 성패가 교차' },
  78: { luck: 'mixed', description: '선흉후길운, 초반 고난 후반 성공' },
  79: { luck: 'bad',   description: '종말운, 결실 없이 끝남' },
  80: { luck: 'bad',   description: '공허운, 모든 것이 공허함' },
  81: { luck: 'good',  description: '환원운, 새로운 시작' },
};

export const blacklist = [
  '이재명', '윤석열', '한동훈', '이준석', '홍준표', '안철수',
  '전두환', '박정희', '김정은', '문재인', '박근혜', '이명박',
  '노무현', '김대중', '김영삼', '이승만', '노태우', '최규하',
  '조국', '추미애', '오세훈', '이낙연', '원희룡', '나경원',
  '우원식', '심상정', '박지원', '이재용', '최태원', '정의선',
  '구광모', '김일성', '김정일', '김여정', '모택동', '장개석',
  '시진핑', '도조', '이토', '이완용', '연산군', '광해군',
  '궁예', '견훤', '의자왕', '개똥', '말순', '삼식', '영자',
  '만수', '덕구', '춘자', '말자', '숙자', '자옥', '점례',
  '칠성', '팔도', '복남', '철수', '영희', '순이', '돌쇠',
  '갑돌', '갑순', '을용', '병태', '영구', '맹구', '칠복',
  '삼월', '사월', '오월', '순돌', '웅이', '달수', '복동',
  '끝순', '춘희', '정자', '미자', '순자', '덕분', '복순',
  '명자', '순희', '창식', '광식', '상철', '만득', '빡구',
  '쇠돌', '삼돌', '바우', '칠득', '용달', '점박', '언년',
  '끝돌', '판수', '덕배', '두식', '봉남', '팔봉', '만복',
  '천복', '득춘', '필두', '기춘', '무덕', '식용', '춘삼',
  '봉팔', '두한', '상두', '달재', '구식', '기식', '명숙',
  '광자', '희자', '경자', '영숙', '정숙',
];

const SYSTEM_PROMPT = `당신은 한국 작명 전문가입니다.
사용자가 요청하는 조건에 맞는 한글 이름 후보를 생성합니다.
반드시 순수 JSON만 출력하세요. 마크다운 코드블록 없이.
reason은 50자 이내로 간결하게 작성하세요.
한글로만 이름 출력하세요. 한자 혼용 절대 금지.
어색하거나 놀림받을 수 있는 이름, 유명 정치인/범죄자 이름 제외.
추천 한자는 반드시 인명에 실제로 쓰이는 한자로만 선택하세요.
한자나 자연물(水, 林, 木 등)을 그대로 이름으로 쓰지 마세요.
어색하거나 단어처럼 들리는 이름 제외 (예: 수림, 해수, 성목 등).
reason은 한자의 실제 뜻에 근거하여 품격 있게 작성하세요.
임의로 의미를 확대하거나 과장하지 마세요.
reason은 순한글로만 작성하세요. 영어 혼용 금지.
이름은 2020년대 트렌드에 맞는 세련되고 현대적인 이름이어야 합니다.
올드한 이름 제외 (예: 영자, 순희, 철수, 말자 등 70-80년대 느낌).
요즘 부모들이 선호하는 감각 있고 부르기 좋은 이름으로 생성하세요.
같은 글자를 두 번 쓰는 이름 제외 (예: 준준, 민민 등).
추천 한자는 일상적으로 널리 알려진 인명용 한자만 사용하세요. 생소하거나 희귀한 한자는 제외하세요.`;

// 단계별 모델. 환경변수로 덮어쓸 수 있게 해서 교체·비교에 코드 수정이 필요 없도록 한다.
//
// 이름 후보 생성은 창작이 아니라 "많이 뽑고 코드로 거르는" 작업이다.
// 사격·오행·블랙리스트·중복 검증을 전부 collectNames가 하므로 저가 모델로 충분하다.
// 반면 유료 상세 해설은 그 자체가 판매 상품이므로 상위 모델을 유지한다.
// 한 번의 호출로 요청할 이름 후보 수와 그에 맞춘 출력 상한.
// 항목 1건이 약 90토큰이므로 둘은 항상 함께 움직여야 한다.
// 개수를 늘릴 때 상한을 안 올리면 응답이 잘리고, 잘린 JSON은 파싱에 실패해 0건이 된다.
export const NAMES_PER_CALL = 60;
const NAMES_MAX_TOKENS = 6000;

export const MODEL_NAME_GEN = process.env.AI_MODEL_NAME_GEN ?? 'gpt-4o-mini';
export const MODEL_BRIEF    = process.env.AI_MODEL_BRIEF    ?? 'gpt-4o-mini';
export const MODEL_DETAIL   = process.env.AI_MODEL_DETAIL   ?? 'gpt-4o';

const MODEL_RATES: Record<string, [number, number]> = {
  'gpt-4o':                    [2.5,  10],
  'gpt-4o-mini':               [0.15, 0.60],
  'claude-opus-4-8':           [15,   75],
  'claude-sonnet-4-6':         [3,    15],
  'claude-haiku-4-5-20251001': [0.8,  4],
};

export const ALLOWED_MOOD_KEYWORDS = ['부드러운', '따뜻한', '단아한', '세련된', '지혜로운', '모던한', '자연스러운', '특별한'];

// ==========================================================
// Helpers
// ==========================================================

export function getLackingOhang(
  year: number, month: number, day: number, hour?: number, minute?: number,
): { lacking: string[]; count: Record<string, number> } {
  const saju = calculateSaju(year, month, day, hour, minute);
  const count: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
  if (saju.hourPillar) pillars.push(saju.hourPillar);
  for (const pillar of pillars) {
    if (ganOhang[pillar[0]]) count[ganOhang[pillar[0]]]++;
    if (jiOhang[pillar[1]]) count[jiOhang[pillar[1]]]++;
  }
  return { lacking: Object.entries(count).filter(([, v]) => v <= 1).map(([k]) => k), count };
}

export function ohangFromSurvey(row: Pick<SurveyRow, 'birth_year' | 'birth_month' | 'birth_day' | 'birth_time'>) {
  const [bh, bm] = row.birth_time
    ? row.birth_time.split(':').map(Number)
    : [undefined, undefined];
  return getLackingOhang(row.birth_year, row.birth_month, row.birth_day ?? 1, bh, bm);
}

function normalize(n: number): number {
  while (n > 81) n -= 80;
  return n;
}

export function getFourGrids(sungStrokes: number[], name1Stroke: number, name2Stroke: number): Grids {
  let won: number, hyeong: number, i: number, jeong: number;
  if (sungStrokes.length === 1) {
    const [A, B, C] = [sungStrokes[0], name1Stroke, name2Stroke];
    won = normalize(B + C); hyeong = normalize(A + B); i = normalize(A + C); jeong = normalize(A + B + C);
  } else {
    const [A, B, C, D] = [sungStrokes[0], sungStrokes[1], name1Stroke, name2Stroke];
    won = normalize(C + D); hyeong = normalize(B + C); i = normalize(A + D); jeong = normalize(A + B + C + D);
  }
  const chong = normalize(won + hyeong + i + jeong);
  const rawStroke = won + hyeong + i + jeong;
  const goodCount = [won, hyeong, i, jeong].filter((s) => stroke81[s]?.luck === 'good').length;
  return {
    원격: { stroke: won,   ...stroke81[won] },
    형격: { stroke: hyeong, ...stroke81[hyeong] },
    이격: { stroke: i,     ...stroke81[i] },
    정격: { stroke: jeong, ...stroke81[jeong] },
    총격: { stroke: chong, rawStroke, ...stroke81[chong] },
    goodCount,
    isAllGood:   goodCount === 4,
    isThreeGood: goodCount >= 3,
    isTwoGood:   goodCount >= 2,
  };
}

// 한자 사전의 뜻(訓) 배열 전체를 "훈+음" 표시형 포맷으로 변환. 예: ["준수할", "높을"] + "준" → ["준수할 준", "높을 준"]
export function buildMeaningsDisplay(meanings: string[] | null | undefined, reading: string): string[] {
  return (meanings ?? [])
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => (reading ? `${m} ${reading}` : m));
}

export function calcScore(grids: Grids, ohang1: string | null, ohang2: string | null, lacking: string[]): number {
  let score = grids.goodCount * 15;
  if (ohang1 && lacking.includes(ohang1)) score += 10;
  if (ohang2 && lacking.includes(ohang2)) score += 10;
  if (grids.형격.luck === 'good') score += 8;
  if (grids.isAllGood) score += 7;
  if (grids.총격.luck === 'good') score += 5;
  if (grids.총격.luck === 'bad')  score -= 5;
  return Math.min(score, 100);
}

// 오행 상생(生)/상극(剋) 관계표 — 발음오행 점수 계산과 오행 조합 문장 생성에서 공용으로 사용
export const OHANG_SHENG_MAP: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
export const OHANG_KE_MAP:    Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export function calcSoundScore(surname: string, hangul: string): { score: number; ohangList: string[]; details: string[] } {
  const soundMap: Record<string, string> = {
    ㄱ: '木', ㅋ: '木', ㄴ: '火', ㄷ: '火', ㄹ: '火', ㅌ: '火',
    ㅇ: '土', ㅎ: '土', ㅅ: '金', ㅈ: '金', ㅊ: '金',
    ㅁ: '水', ㅂ: '水', ㅍ: '水',
  };
  const shengMap = OHANG_SHENG_MAP;
  const keMap    = OHANG_KE_MAP;

  const ohangList = [...(surname + hangul)].map((char) => {
    const code = char.charCodeAt(0) - 0xac00;
    if (code < 0) return '?';
    const chosung = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor(code / 28 / 21)];
    return soundMap[chosung] ?? '?';
  });

  let score = 0;
  const details: string[] = [];
  for (let idx = 0; idx < ohangList.length - 1; idx++) {
    const a = ohangList[idx], b = ohangList[idx + 1];
    if      (shengMap[a] === b)               { score += 10; details.push(`${a}→${b} 상생 (+10)`); }
    else if (a === b)                          { score += 5;  details.push(`${a}→${b} 비화 (+5)`);  }
    else if (keMap[a] === b || keMap[b] === a) { score -= 5;  details.push(`${a}→${b} 상극 (-5)`);  }
    else                                       {              details.push(`${a}→${b} 무관 (0)`);   }
  }
  return { score, ohangList, details };
}

// ==========================================================
// AI
// ==========================================================

export async function callAI(
  model: string, systemPrompt: string, userPrompt: string, maxTokens: number,
): Promise<{ text: string; cost: number }> {
  let text = '', inputTokens = 0, outputTokens = 0;

  if (model.startsWith('claude')) {
    const body: Record<string, unknown> = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: userPrompt }] };
    if (systemPrompt) body.system = systemPrompt;
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Anthropic: ${data.error.message}`);
    text         = data.content?.[0]?.text ?? '';
    inputTokens  = data.usage?.input_tokens ?? 0;
    outputTokens = data.usage?.output_tokens ?? 0;
  } else {
    const messages: unknown[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res  = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`OpenAI: ${data.error.message}`);
    text         = data.choices?.[0]?.message?.content ?? '';
    inputTokens  = data.usage?.prompt_tokens ?? 0;
    outputTokens = data.usage?.completion_tokens ?? 0;
  }

  const [inRate, outRate] = MODEL_RATES[model] ?? [2.5, 10];
  const cost = ((inputTokens * inRate + outputTokens * outRate) / 1_000_000) * 1450;
  return { text, cost };
}

export async function generateNames(options: {
  surname: string; gender: '남자' | '여자'; ohang: string[];
  dolrimja?: string; model?: string; moodKeywords?: string[];
  avoidHanja?: string[];
}): Promise<{ names: { hangul: string; hanja: string; reason: string }[]; cost: number }> {
  const model = options.model ?? MODEL_NAME_GEN;
  const dolrimjaText = options.dolrimja ? `돌림자: "${options.dolrimja}" 반드시 포함` : '';
  const moodText = options.moodKeywords?.length ? `분위기: ${options.moodKeywords.join(', ')}` : '';
  // 걸러내는 건 아래 collectNames의 필터가 확실히 하지만, 미리 알려주면
  // 버려질 후보를 덜 만들어 통과율이 올라간다.
  const avoidHanjaText = options.avoidHanja?.length
    ? `\n4. 다음 한자는 절대 사용 금지: ${options.avoidHanja.join(', ')}`
    : '';
  const prompt = `성씨: ${options.surname} | 성별: ${options.gender} | 부족한 오행: ${options.ohang.join('/')} ${dolrimjaText} ${moodText}

아래 조건을 반드시 지켜주세요:
1. 이름은 성씨 제외 두 글자만 출력 (예: 성씨가 박이면 "준서"만, "박준서" 절대 금지)
2. 두 글자 이름 ${NAMES_PER_CALL}개 생성
3. 다양한 이름 생성 (비슷한 이름 반복 금지)${avoidHanjaText}

출력형식:
{"names":[{"hangul":"두글자이름","hanja":"한자두글자","reason":"50자이내이유"}]}

예시: {"hangul":"서윤","hanja":"瑞潤","reason":"상서로운 기운과 윤택함을 지닌 덕망 있는 인재"}`;

  const { text, cost } = await callAI(model, SYSTEM_PROMPT, prompt, NAMES_MAX_TOKENS);
  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { names: Array.isArray(result.names) ? result.names : [], cost };
  } catch {
    // 대부분 max_tokens 초과로 응답이 잘린 경우다. 앞부분만 남겨 원인을 판별할 수 있게 한다.
    console.error(
      `[generateNames] JSON 파싱 실패 (model=${model}, 길이=${text.length}): ${text.slice(0, 200)}`,
    );
    return { names: [], cost };
  }
}

export async function generateDetailedReason(
  names: RichName[],
  options: { surname: SurnameRow; lacking: string[]; model?: string },
): Promise<{ map: Record<string, NameDetail>; cost: number }> {
  const { surname, lacking, model = MODEL_DETAIL } = options;

  // AI가 오행·획수·길흉을 추측하지 않도록, 이미 계산이 끝난 값을 모두 프롬프트에 명시한다.
  const describe = (n: RichName, idx: number) => {
    const chain = [...(surname.hangul + n.hangul)]
      .map((char, i) => `${n.soundOhangList[i] ?? '?'}(${char})`)
      .join(' → ');
    const grids = (['원격', '형격', '이격', '정격', '총격'] as const)
      .map((key) => `${key} ${n.grids[key].stroke}획(${ll(n.grids[key].luck)}, ${n.grids[key].description})`)
      .join(' / ');

    return [
      `${idx + 1}. ${surname.hangul}${n.hangul} (${surname.hanja}${n.hanja}) — 종합 ${n.score}점`,
      `   ${n.hanja1}: 훈 [${buildMeaningsDisplay(n.meaning1, n.hangul1).join(', ')}], 오행 ${n.ohang1 || '미상'}`,
      `   ${n.hanja2}: 훈 [${buildMeaningsDisplay(n.meaning2, n.hangul2).join(', ')}], 오행 ${n.ohang2 || '미상'}`,
      `   사격: ${grids}`,
      `   총획: ${n.grids.총격.rawStroke}획`,
      `   발음오행: ${chain}`,
      `   발음오행 판정: ${n.soundDetails.join(', ') || '없음'}`,
      `   기본 해설: ${n.reason}`,
    ].join('\n');
  };

  const makePrompt = (batch: RichName[]) => {
    const nameList = batch.map(describe).join('\n\n');
    // 필드별로 문체를 다르게 요구한다.
    // summary/categories/tags는 카드 UI에 짧게 노출되므로 따뜻한 구어체를 유지하고,
    // detail은 유료 상세 페이지의 본문이므로 근거를 제시하는 분석체로 작성한다.
    return `아래 이름들에 대해 각각 4가지 형태의 해설을 작성해주세요.
순한글로만 작성. 영어 혼용 금지. 과장 금지.

[근거 규칙] — 반드시 지킬 것
아래 [분석 데이터]의 값은 이미 확정된 계산 결과입니다.
오행·획수·길흉·점수를 임의로 판단하거나 다르게 바꾸지 마세요.
데이터에 없는 사실을 추측해서 쓰지 마세요. "~로 보입니다", "~로 봅니다" 같은 추정 표현 금지.
오행 상생은 木→火→土→金→水→木 이고, 상극은 木→土, 土→水, 水→火, 火→金, 金→木 입니다.
이 관계를 반대로 쓰거나 새로 만들지 마세요. (예: 木과 土는 상극이며 상생이 아닙니다.)
두 오행이 같으면 비화(比和)입니다. 비화는 같은 기운이 겹쳐 짙어지는 관계이며, 상생이 아닙니다.
(예: 木과 木은 비화입니다. 이를 상생이라고 쓰지 마세요.)
제공된 길흉 설명은 전통 명리 용어입니다. 그대로 인용하되 미래를 단정하는 표현으로 바꾸지 마세요.
("성공적인 인생을 예고합니다", "부귀영화를 누립니다" 같은 표현 금지)
데이터에 없는 평가는 쓰지 마세요. 부르기 편한 정도, 기억하기 쉬운 정도 같은 인상 평가 금지.
같은 내용을 다른 문장으로 반복하지 마세요.

[문체 규칙]
- summary, categories, tags: 따뜻하고 부드러운 현대 한국어.
  "~이에요", "~을 담았어요", "~로 자라길 바라요" 같은 표현 사용.
- detail: 작명 전문가가 근거를 들어 설명하는 분석체. '~합니다' 체로 작성.
  "~이에요", "~할 거예요", "~바라요" 같은 구어체 어미 금지.
  호칭·인사말·맺음말 금지. 편지·축사 형식 금지 (예: "사랑하는 OO에게" 같은 서두 금지).
  기원이나 감탄이 아니라, 근거와 해석만 서술.

이 아이의 사주에 부족한 기운: ${lacking.join(', ') || '없음'}

[분석 데이터]
${nameList}

출력형식:
{"results":[{
  "hangul":"이름",
  "summary":"따뜻한 햇살처럼 밝고 온화한 아이 (20자 내외 한줄 요약)",
  "categories":[
    {"title":"제목 8자 내외","description":"설명 40자 내외"},
    {"title":"제목 8자 내외","description":"설명 40자 내외"},
    {"title":"제목 8자 내외","description":"설명 40자 내외"}
  ],
  "detail":"1200자 내외 분석. 아래 순서로 다섯 단락을 나눠 서술한다. (1) 두 한자의 자의(字義)와 결합했을 때 형성되는 의미 (2) 발음오행 판정 데이터를 근거로 한 소리의 흐름 (3) 두 글자의 오행 구성과 상생·상극·비화 관계 (4) 사주에 부족한 기운을 이 이름이 보완하는지 여부와 그 정도 (5) 원격·형격·이격·정격·총격 다섯 가지를 모두 언급한 종합 평가. 각 단락은 데이터를 근거로 제시한 뒤 해석을 덧붙인다. 단락마다 200자 이상 서술한다.",
  "tags":["#태그1","#태그2","#태그3","#태그4"]
}]}`;
  };

  const parse = (text: string): (NameDetail & { hangul: string })[] => {
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()).results ?? []; }
    catch { return []; }
  };

  // 이름 1개당 detail 1200자 + summary/categories/tags 로 약 1,400자를 생성한다.
  // gpt-4o의 출력 상한이 16,384 토큰이라 10개 배치는 상한에 걸려 뒷부분이 잘린다.
  // (잘린 배치는 JSON 파싱에 실패해 통째로 누락되므로 배치를 작게 유지한다.)
  const BATCH = 5;
  let totalCost = 0;
  const map: Record<string, NameDetail> = {};

  // 1차: 병렬 배치 실행
  const batches = Array.from({ length: Math.ceil(names.length / BATCH) }, (_, bi) =>
    callAI(model, '', makePrompt(names.slice(bi * BATCH, (bi + 1) * BATCH)), 16384),
  );
  const results = await Promise.all(batches);
  totalCost += results.reduce((s, r) => s + r.cost, 0);

  const isValidTag = (t: string) => /^#[가-힣a-zA-Z0-9]{1,8}$/.test(t);
  const normalizeTags = (raw: string[]) =>
    raw.map((t) => { const s = t.trim(); return s.startsWith('#') ? s : `#${s}`; }).filter(isValidTag);

  for (const r of results.flatMap((res) => parse(res.text))) {
    map[r.hangul] = { summary: r.summary, categories: r.categories, detail: r.detail, tags: normalizeTags(r.tags ?? []) };
  }

  // 2차: 누락 또는 유효 태그 부족(<2) 이름 개별 재시도
  const missing = names.filter((n) => !map[n.hangul] || (map[n.hangul].tags?.length ?? 0) < 2);
  if (missing.length > 0) {
    console.warn(`[generateDetailedReason] ${missing.length}개 누락/태그부족, 재시도:`, missing.map((n) => n.hangul));
    for (const n of missing) {
      try {
        const retry = await callAI(model, '', makePrompt([n]), 4096);
        totalCost += retry.cost;
        const parsed = parse(retry.text);
        if (parsed[0]) {
          map[n.hangul] = { ...parsed[0], tags: normalizeTags(parsed[0].tags ?? []) };
        } else console.warn(`[generateDetailedReason] 재시도 실패:`, n.hangul);
      } catch (e) {
        console.error(`[generateDetailedReason] 재시도 오류 (${n.hangul}):`, e);
      }
    }
  }

  return { map, cost: totalCost };
}

// Free 전용 경량 AI 호출 — summary + tags만 생성
export async function generateBriefDetail(
  name: { hangul: string; hanja1: string; hanja2: string; meaning1: string[]; meaning2: string[]; reason: string },
  model = MODEL_BRIEF,
): Promise<{ summary: string; tags: string[]; cost: number }> {
  const prompt = `이름 ${name.hangul} (${name.hanja1}${name.hanja2}): ${name.hanja1}(${name.meaning1[0] ?? ''}) + ${name.hanja2}(${name.meaning2[0] ?? ''}) - ${name.reason}

아래 두 가지만 JSON으로 작성하세요.
- summary: 20자 내외 한 줄 요약 (따뜻하고 자연스럽게, 순한글)
- tags: #태그 4개 배열

{"summary":"따뜻한 햇살처럼 밝고 온화한 아이","tags":["#태그1","#태그2","#태그3","#태그4"]}`;

  const { text, cost } = await callAI(model, '', prompt, 256);
  try {
    const r = JSON.parse(text.replace(/```json|```/g, '').trim()) as { summary: string; tags: string[] };
    const isValidTag = (t: string) => /^#[가-힣a-zA-Z0-9]{1,8}$/.test(t);
    const tags = (r.tags ?? []).map((t) => { const s = t.trim(); return s.startsWith('#') ? s : `#${s}`; }).filter(isValidTag);
    return { summary: r.summary ?? name.reason, tags, cost };
  } catch {
    // 폴백(reason 그대로 사용)이 조용히 동작하면 태그 없는 결과가 왜 나왔는지 추적할 수 없다.
    console.error(
      `[generateBriefDetail] JSON 파싱 실패 (${name.hangul}, model=${model}): ${text.slice(0, 200)}`,
    );
    return { summary: name.reason, tags: [], cost };
  }
}

// ==========================================================
// DB Helpers
// ==========================================================

export async function fetchSurveyAndSurname(
  supabase: ReturnType<typeof createAdminClient>,
  requestId: string,
): Promise<{ survey: SurveyRow; surname: SurnameRow } | null> {
  const { data: survey, error: sErr } = await supabase
    .from('naming_surveys')
    .select('*')
    .eq('request_id', requestId)
    .single();
  if (sErr || !survey) return null;

  const { data: surname, error: nErr } = await supabase
    .from('surnames')
    .select('id, hangul, hanja, won_stroke')
    .eq('id', (survey as SurveyRow).surname_id)
    .single();
  if (nErr || !surname) return null;

  return { survey: survey as SurveyRow, surname: surname as SurnameRow };
}

export async function collectNames(params: {
  supabase: ReturnType<typeof createAdminClient>;
  surname: SurnameRow;
  survey: SurveyRow;
  lacking: string[];
  target: number;
  maxAttempts: number;
  model: string;
  usedNames: Set<string>;
}): Promise<{ names: RichName[]; cost: number }> {
  const { supabase, surname, survey, lacking, target, maxAttempts, model, usedNames } = params;
  const results: RichName[] = [];
  let totalCost = 0;
  let attempts = 0;

  // 형제이름에서 성씨(첫 글자) 제거 후 글자 추출, 돌림자는 avoid에서 제외
  const siblingGivenChars = (survey.sibling_names ?? []).flatMap((name) =>
    [...(name.startsWith(surname.hangul) ? name.slice(surname.hangul.length) : name)],
  ).filter((c) => c !== survey.generation_name);
  const avoidChars = new Set([...(survey.avoid_hangul ?? []), ...siblingGivenChars]);

  // 기피 한자는 id로 저장돼 있어 글자로 풀어야 비교할 수 있다.
  // hanja 테이블은 글자가 유일하므로 id↔글자가 1:1이다.
  // 재시도해도 값이 같으니 루프 밖에서 한 번만 조회한다.
  const avoidHanjaIds = survey.avoid_hanja_id ?? [];
  const avoidHanjaChars = new Set<string>();
  if (avoidHanjaIds.length > 0) {
    const { data, error } = await supabase
      .from('hanja')
      .select('hanja')
      .in('id', avoidHanjaIds);

    // 조회에 실패하면 기피 한자가 그대로 결과에 섞인다.
    // 사용자가 명시적으로 배제한 글자라 조용히 넘어가면 안 된다.
    if (error) {
      console.error(`[collectNames] 기피 한자 조회 실패: ${error.message}`);
      throw new Error('기피 한자 정보를 불러오지 못했습니다.');
    }
    for (const row of data ?? []) avoidHanjaChars.add((row as { hanja: string }).hanja);
  }

  const sungStrokes = [surname.won_stroke];

  while (results.length < target && attempts < maxAttempts) {
    const safeMoods = (survey.mood_keywords ?? []).filter(k => ALLOWED_MOOD_KEYWORDS.includes(k));
    const { names: aiNames, cost } = await generateNames({
      surname: surname.hangul,
      gender: survey.gender,
      ohang: lacking,
      dolrimja: survey.generation_name ?? undefined,
      model,
      moodKeywords: safeMoods,
      avoidHanja: [...avoidHanjaChars],
    });
    totalCost += cost;

    // AI가 응답을 못 냈거나 JSON 파싱에 실패하면 빈 배열이 온다.
    // 토큰은 이미 소비된 뒤이므로, 원인 추적을 위해 반드시 남긴다.
    if (aiNames.length === 0) {
      console.warn(
        `[collectNames] AI 응답 0건 (model=${model}, attempt=${attempts + 1}/${maxAttempts}, 확보=${results.length}/${target})`,
      );
    }
    // 요청 대비 필터 통과율. 요청 개수를 바꾸면 이 비율의 기준선도 달라지므로 함께 남긴다.
    const beforeCount = results.length;

    let avoidedByHanja = 0;

    const valid = aiNames.filter((n) => {
      if (usedNames.has(n.hangul)) return false;
      const chars = [...n.hangul];
      if (chars.length !== 2 || chars[0] === chars[1]) return false;
      if (avoidChars.size > 0 && chars.some(c => avoidChars.has(c))) return false;
      // 사용자가 배제한 한자가 한 글자라도 있으면 탈락시킨다.
      if (avoidHanjaChars.size > 0 && [...(n.hanja ?? '')].some(c => avoidHanjaChars.has(c))) {
        avoidedByHanja++;
        return false;
      }
      return !blacklist.some((b) => n.hangul === (b.length === 3 ? b.slice(1) : b));
    });

    const uniqueChars = new Set<string>();
    for (const n of valid) {
      if (n.hanja && [...n.hanja].length === 2) {
        uniqueChars.add(n.hanja[0]);
        uniqueChars.add(n.hanja[1]);
      }
    }

    let hanjaRows: { hanja: string; won_stroke: number; ohang: string; meanings: string[]; hangul_main: string; hangul: string[] }[] = [];
    if (uniqueChars.size > 0) {
      const { data } = await supabase
        .from('hanja')
        .select('hanja, won_stroke, ohang, meanings, hangul_main, hangul')
        .in('hanja', Array.from(uniqueChars));
      hanjaRows = (data ?? []) as typeof hanjaRows;
    }
    const hanjaMap = new Map(hanjaRows.map((r) => [r.hanja, r]));

    for (const n of valid) {
      if (usedNames.has(n.hangul)) continue;
      if (!n.hanja || [...n.hanja].length !== 2) continue;
      const [c1, c2] = [...n.hanja];
      const d1 = hanjaMap.get(c1), d2 = hanjaMap.get(c2);
      if (!d1 || !d2) continue;

      const grids = getFourGrids(sungStrokes, d1.won_stroke, d2.won_stroke);
      if (!grids.isTwoGood) continue;

      usedNames.add(n.hangul);
      const sound = calcSoundScore(surname.hangul, n.hangul);
      const reading1 = d1.hangul_main || d1.hangul?.[0] || '';
      const reading2 = d2.hangul_main || d2.hangul?.[0] || '';
      results.push({
        hangul: n.hangul, hanja: `${d1.hanja}${d2.hanja}`,
        hanja1: d1.hanja, hanja2: d2.hanja,
        hangul1: reading1,
        hangul2: reading2,
        meaning1: d1.meanings ?? [], meaning2: d2.meanings ?? [],
        reason: n.reason, score: calcScore(grids, d1.ohang, d2.ohang, lacking),
        grids, ohang1: d1.ohang, ohang2: d2.ohang,
        soundScore: sound.score, soundOhangList: sound.ohangList, soundDetails: sound.details,
      });
    }
    // avoidedHanja가 크면 프롬프트의 금지 지시가 안 먹히고 있다는 뜻이다.
    console.log(
      `[collectNames] requested=${NAMES_PER_CALL} ai=${aiNames.length} passed=${results.length - beforeCount} avoidedHanja=${avoidedByHanja} total=${results.length}/${target} attempt=${attempts + 1}`,
    );
    attempts++;
  }
  return { names: results, cost: totalCost };
}

// ==========================================================
// Shape Builders
// ==========================================================

export const ll = (l: string) => l === 'good' ? '吉' : l === 'bad' ? '凶' : '中';

export function buildSajuSummary(name: RichName, lacking: string[]): string {
  const supp: string[] = [];
  if (name.ohang1 && lacking.includes(name.ohang1)) supp.push(`'${name.hanja1}'의 ${name.ohang1} 기운`);
  if (name.ohang2 && lacking.includes(name.ohang2)) supp.push(`'${name.hanja2}'의 ${name.ohang2} 기운`);
  return supp.length > 0
    ? `부족한 기운(${lacking.join(', ')})을 ${supp.join(', ')}으로 보완`
    : `부족한 기운(${lacking.join(', ') || '없음'}) 보완 없음`;
}

type OhangKey = '木' | '火' | '土' | '金' | '水';

// 오행별 형용사 + 조사 결합형 — 문장 템플릿 조립용 (하드코딩, AI 미사용)
const OHANG_ADJ:     Record<OhangKey, string> = { 木: '성장하는', 火: '따뜻한', 土: '안정적인', 金: '단단한', 水: '지혜로운' };
const OHANG_SUBJECT: Record<OhangKey, string> = { 木: '나무가',   火: '불이',   土: '땅이',     金: '쇠가',   水: '물이' };
const OHANG_OBJECT:  Record<OhangKey, string> = { 木: '나무를',   火: '불을',   土: '땅을',     金: '쇠를',   水: '물을' };

function isOhangKey(v: string | null | undefined): v is OhangKey {
  return !!v && v in OHANG_ADJ;
}

// 이름의 두 오행(ohang1, ohang2)이 사주 부족 오행을 얼마나 보완하는지(보완강도)에 따라
// 미리 정해둔 문장 템플릿을 조립. AI 호출 없이 하드코딩된 규칙으로만 생성한다.
export function buildOhangSummary(name: RichName, lacking: string[]): string {
  const el1 = name.ohang1, el2 = name.ohang2;
  if (!isOhangKey(el1) || !isOhangKey(el2)) return '';

  let base: string;
  if (el1 === el2) {
    base = `${OHANG_ADJ[el1]} ${OHANG_SUBJECT[el1]} 두 글자에 겹쳐 기운이 더욱 깊어지는`;
  } else {
    const relation =
      OHANG_SHENG_MAP[el1] === el2 || OHANG_SHENG_MAP[el2] === el1 ? '만나 조화를 이루는'
      : OHANG_KE_MAP[el1] === el2 || OHANG_KE_MAP[el2] === el1     ? '만나 팽팽한 균형을 이루는'
      :                                                               '만나 어우러지는';
    base = `${OHANG_ADJ[el1]} ${OHANG_SUBJECT[el1]} ${OHANG_ADJ[el2]} ${OHANG_OBJECT[el2]} ${relation}`;
  }

  // 보완강도: 이름의 오행 중 사주 부족 오행(lacking)과 겹치는 개수
  const matchCount = el1 === el2
    ? (lacking.includes(el1) ? 2 : 0)
    : [el1, el2].filter((el) => lacking.includes(el)).length;

  if (matchCount === 2) {
    return `${base} 좋은 오행 구성이에요. 타고난 사주에 부족한 기운을 두 글자 모두가 채워주는 아주 좋은 궁합이에요.`;
  }
  if (matchCount === 1) {
    const filled = lacking.includes(el1) ? el1 : el2;
    return `${base} 좋은 오행 구성이에요. 특히 사주에 부족한 ${filled} 기운을 이름이 채워줘요.`;
  }
  return `${base} 좋은 오행 구성이에요.`;
}

export function buildNumerologySummary(name: RichName): string {
  return [
    `원격 ${name.grids.원격.stroke}획(${ll(name.grids.원격.luck)})`,
    `형격 ${name.grids.형격.stroke}획(${ll(name.grids.형격.luck)})`,
    `이격 ${name.grids.이격.stroke}획(${ll(name.grids.이격.luck)})`,
    `정격 ${name.grids.정격.stroke}획(${ll(name.grids.정격.luck)})`,
    `총격 ${name.grids.총격.stroke}획(${ll(name.grids.총격.luck)})`,
  ].join(' / ');
}

export function buildDetailedExplanation(name: RichName, detail?: NameDetail): string {
  if (!detail) return name.reason;
  const categoryText = detail.categories.map((c) => `[${c.title}]\n${c.description}`).join('\n\n');
  const detailText = detail.detail?.trim() || name.reason;
  return [detail.summary, '', categoryText, '', detailText, '', detail.tags.join(' ')].join('\n');
}

// 상세 페이지에서 섹션별로 렌더링할 수 있도록, AI 해설 본문만 뽑아 detail_body에 저장한다.
// detailed_explanation(요약+카테고리+본문+태그 합본)은 하위 호환을 위해 함께 유지한다.
export function buildDetailBody(name: RichName, detail?: NameDetail): string {
  return detail?.detail?.trim() || name.reason;
}

export function toApiShape(name: RichName, detail: NameDetail | undefined, lacking: string[], sortOrder: number) {
  return {
    sortOrder,
    hangul: name.hangul, hanja: name.hanja,
    hanja1: name.hanja1, hanja2: name.hanja2,
    hangul1: name.hangul1, hangul2: name.hangul2,
    meaning1: name.meaning1[0] ?? '', meaning2: name.meaning2[0] ?? '',
    meanings1: buildMeaningsDisplay(name.meaning1, name.hangul1),
    meanings2: buildMeaningsDisplay(name.meaning2, name.hangul2),
    score: name.score,
    grids: name.grids,
    ohang1: name.ohang1, ohang2: name.ohang2,
    soundScore: name.soundScore, soundOhangList: name.soundOhangList, soundDetails: name.soundDetails,
    meaningSummary:      detail?.summary ?? name.reason,
    sajuSummary:         buildSajuSummary(name, lacking),
    ohangSummary:        buildOhangSummary(name, lacking),
    numerologySummary:   buildNumerologySummary(name),
    detailedExplanation: buildDetailedExplanation(name, detail),
    detailBody:          buildDetailBody(name, detail),
    totalStrokes:        name.grids.총격.rawStroke,
    tags:       detail?.tags ?? [],
    categories: detail?.categories ?? [],
  };
}

export function toDbRow(params: {
  requestId: string; sortOrder: number; isFreeName: boolean;
  surname: SurnameRow; name: RichName; detail: NameDetail | undefined; lacking: string[];
}) {
  const { requestId, sortOrder, isFreeName, surname, name, detail, lacking } = params;
  return {
    request_id:           requestId,
    sort_order:           sortOrder,
    is_free_visible:      isFreeName,
    name_hangul:          `${surname.hangul}${name.hangul}`,
    name_hanja:           `${surname.hanja}${name.hanja}`,
    surname_hangul:       surname.hangul,
    surname_hanja:        surname.hanja,
    given_name_hangul:    name.hangul,
    given_name_hanja:     name.hanja,
    hanja1:               name.hanja1,   hanja2:  name.hanja2,
    hangul1:              name.hangul1,  hangul2: name.hangul2,
    meaning1:             name.meaning1, meaning2: name.meaning2,
    meaning_summary:      detail?.summary ?? name.reason,
    saju_summary:         [buildSajuSummary(name, lacking), buildOhangSummary(name, lacking)],
    numerology_summary:   buildNumerologySummary(name),
    detailed_explanation: buildDetailedExplanation(name, detail),
    detail_body:          buildDetailBody(name, detail),
    tags:                 detail?.tags ?? [],
    categories:           detail?.categories ?? [],
    grids:                name.grids,
    total_strokes:        name.grids.총격.rawStroke,
    score:                name.score,
    ohang1:               name.ohang1 ?? null,
    ohang2:               name.ohang2 ?? null,
    sound_score:          name.soundScore,
    sound_ohang_list:     name.soundOhangList,
    sound_details:        name.soundDetails,
  };
}

// Free 단계 부분 저장 — detail/categories는 빈 값으로 저장, premium 때 UPDATE
export function toDbRowBrief(params: {
  requestId: string; sortOrder: number;
  surname: SurnameRow; name: RichName;
  summary: string; tags: string[]; lacking: string[];
}) {
  const { requestId, sortOrder, surname, name, summary, tags, lacking } = params;
  return {
    request_id:           requestId,
    sort_order:           sortOrder,
    is_free_visible:      true,
    name_hangul:          `${surname.hangul}${name.hangul}`,
    name_hanja:           `${surname.hanja}${name.hanja}`,
    surname_hangul:       surname.hangul,
    surname_hanja:        surname.hanja,
    given_name_hangul:    name.hangul,
    given_name_hanja:     name.hanja,
    hanja1:               name.hanja1,   hanja2:  name.hanja2,
    hangul1:              name.hangul1,  hangul2: name.hangul2,
    meaning1:             name.meaning1, meaning2: name.meaning2,
    meaning_summary:      summary,
    saju_summary:         [buildSajuSummary(name, lacking), buildOhangSummary(name, lacking)],
    numerology_summary:   buildNumerologySummary(name),
    detailed_explanation: '',
    detail_body:          '',
    tags,
    categories:           [],
    grids:                name.grids,
    total_strokes:        name.grids.총격.rawStroke,
    score:                name.score,
    ohang1:               name.ohang1 ?? null,
    ohang2:               name.ohang2 ?? null,
    sound_score:          name.soundScore,
    sound_ohang_list:     name.soundOhangList,
    sound_details:        name.soundDetails,
  };
}

export function toApiShapeFromDb(row: Record<string, unknown>) {
  const m1 = (row.meaning1 as string[]) ?? [];
  const m2 = (row.meaning2 as string[]) ?? [];
  const saju = (row.saju_summary as string[]) ?? [];
  return {
    sortOrder:           row.sort_order as number,
    hangul:              row.given_name_hangul as string,
    hanja:               row.given_name_hanja as string,
    hanja1:              (row.hanja1 as string) ?? '',
    hanja2:              (row.hanja2 as string) ?? '',
    hangul1:             (row.hangul1 as string) ?? '',
    hangul2:             (row.hangul2 as string) ?? '',
    meaning1:            m1[0] ?? '',
    meaning2:            m2[0] ?? '',
    meanings1:           buildMeaningsDisplay(m1, (row.hangul1 as string) ?? ''),
    meanings2:           buildMeaningsDisplay(m2, (row.hangul2 as string) ?? ''),
    grids:               (row.grids as Grids) ?? {},
    meaningSummary:      row.meaning_summary as string,
    sajuSummary:         saju[0] ?? '',
    ohangSummary:        saju[1] ?? '',
    numerologySummary:   row.numerology_summary as string,
    detailedExplanation: row.detailed_explanation as string,
    // detail_body 도입 이전에 생성된 행은 빈 값이므로 합본 문자열로 폴백한다.
    detailBody:          ((row.detail_body as string) || (row.detailed_explanation as string)) ?? '',
    tags:                (row.tags as string[]) ?? [],
    categories:          (row.categories as { title: string; description: string }[]) ?? [],
    totalStrokes:        row.total_strokes as number,
    score:               row.score as number,
    ohang1:              row.ohang1 as string | null,
    ohang2:              row.ohang2 as string | null,
    soundScore:          row.sound_score as number,
    soundOhangList:      (row.sound_ohang_list as string[]) ?? [],
    soundDetails:        (row.sound_details as string[]) ?? [],
  };
}
