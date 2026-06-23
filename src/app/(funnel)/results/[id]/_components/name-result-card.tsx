"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";

const TOTAL_COUNT = 30;

const NAME = {
  index: 1,
  name: "하온",
  icon: "/assets/gold_star.png",
  highlight: "따뜻한",
  descRest: "햇살처럼 밝고 온화한 아이",
  secondaryDesc: "따뜻한 마음과 밝은 에너지로\n주변을 환하게 비추는 아이예요.",
  tags: ["따뜻한", "밝은", "온화한", "친화적인"],
};

export default function NameResultCard() {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <section className="py-6 px-5">
      <div className="bg-surface rounded-xl shadow-card-featured">
        <div className="relative px-5 py-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center justify-center rounded-pill bg-primary-pale text-primary font-semibold text-tag px-3 py-1">
              {String(NAME.index).padStart(2, "0")} / {TOTAL_COUNT}
            </span>
            <button
              type="button"
              onClick={() => setIsSaved((prev) => !prev)}
              aria-label={isSaved ? "저장 취소" : "이름 저장"}
              className="flex items-center justify-center"
            >
              <Heart
                size={20}
                className={
                  isSaved ? "text-accent-pink fill-accent-pink" : "text-ink-light"
                }
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="font-extrabold text-ink leading-none tracking-[-0.5px] text-name-featured">
              {NAME.name}
            </span>
            <Image
              src={NAME.icon}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>

          <p className="mt-3 text-center leading-relaxed text-body">
            <span className="text-primary font-bold">{NAME.highlight}</span>{" "}
            <span className="text-ink">{NAME.descRest}</span>
          </p>

          <hr className="border-divider my-4" />
          <p className="text-body text-ink text-center leading-relaxed whitespace-pre-line">
            {NAME.secondaryDesc}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-[6px]">
            {NAME.tags.map((tag) => (
              <span
                key={tag}
                className="text-tag font-semibold text-primary rounded-pill bg-primary-pale px-3 py-1"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-ink-muted text-caption">
        마음에 드는 이름은 <span aria-hidden="true">🩷</span> 저장할 수 있어요!
      </p>
    </section>
  );
}
