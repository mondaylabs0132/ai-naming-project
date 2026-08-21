"""OG 이미지용 Pretendard 서브셋 생성.

satori(next/og)는 woff2도, 가변 폰트도 읽지 못한다. 프로젝트가 쓰는
src/fonts/PretendardVariable.woff2를 그대로 넘기면 한글이 전부 두부(□)가
되므로, 필요한 글자만 남긴 **정적 TTF**를 미리 잘라 둔다.

    python3 scripts/subset-og-font.py     # → assets/og/pretendard-og-*.ttf

⚠ src/app/(share)/share/[token]/opengraph-image.tsx의 문구를 고치면
   아래 TEXT도 함께 고치고 이 스크립트를 다시 돌려야 한다. 빠진 글자는
   에러 없이 조용히 사라진다(로컬에서는 시스템 폰트로 대신 그려져 눈치채기
   어렵다). 스크립트 끝의 검증이 빠진 글자를 잡아준다.

fontTools가 필요하다: pip install fonttools brotli
"""

import io
import os

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = "src/fonts/PretendardVariable.woff2"
OUT_DIR = "assets/og"

# opengraph-image.tsx에 실제로 박혀 있는 문구 그대로.
TEXT = (
    "첫지음"
    "어떤 이름이"
    "제일 잘 어울릴까요?"
    "엄마·아빠가 고른 아기 이름 후보 중에서"
    "마음에 드는 이름을 골라주세요"
    "개의 이름"
    "0123456789"
    ".,·!?"
)

WEIGHTS = [(400, "pretendard-og-400.ttf"), (800, "pretendard-og-800.ttf")]


def build(weight: int, filename: str) -> str:
    variable = TTFont(SRC)
    static = instancer.instantiateVariableFont(variable, {"wght": weight}, inplace=False)

    buffer = io.BytesIO()
    static.save(buffer)
    buffer.seek(0)

    font = TTFont(buffer)
    subsetter = subset.Subsetter(
        options=subset.Options(
            layout_features=[],
            notdef_outline=True,
            drop_tables=["DSIG"],
        )
    )
    subsetter.populate(text=TEXT)
    subsetter.subset(font)

    path = os.path.join(OUT_DIR, filename)
    font.flavor = None
    font.save(path)

    # 빠진 글자 검증. 여기서 걸러야 배포 후 두부를 안 본다.
    cmap = TTFont(path).getBestCmap()
    missing = {ch for ch in TEXT if ch != " " and ord(ch) not in cmap}
    if missing:
        raise SystemExit(f"{filename}: 빠진 글자 {''.join(sorted(missing))}")

    return f"{filename} {os.path.getsize(path):,}B"


os.makedirs(OUT_DIR, exist_ok=True)
for weight, filename in WEIGHTS:
    print(build(weight, filename))
