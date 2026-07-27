import Image from "next/image";

const FILTERS = [
  { label: "느낌", icon: "/assets/pink_heart.png", iconSize: 24 },
  { label: "한 글자", icon: "/assets/scroll.png", iconSize: 24 },
  { label: "부모 이름", icon: "/assets/boys.png", iconSize: 24 },
  { label: "선호 한자", icon: null, isChar: true },
];

export default function FilterSection() {
  return (
    <section className="pt-2 pb-8 px-5">
      <p className="text-center text-[12px] text-[#8B849E]">
        원하는 조건을 자유롭게 선택
      </p>

      <div
        className="flex bg-[#f7f3fb] border border-[#EEEBF8] overflow-hidden mt-[10px]"
        style={{ borderRadius: "15px" }}
      >
        {FILTERS.map((f, i) => (
          <div
            key={f.label}
            className="flex-1 flex flex-row items-center justify-center gap-[5px] py-4"
            style={{
              borderLeft: i !== 0 ? "1px solid #EEEBF8" : "none",
            }}
          >
            {f.isChar ? (
              <span
                className="font-bold text-[#7C6FCD]"
                style={{ fontSize: "clamp(18px, 5vw, 24px)" }}
              >
                漢
              </span>
            ) : (
              <Image
                src={f.icon!}
                alt=""
                width={f.iconSize}
                height={f.iconSize}
                style={{
                  width: "clamp(18px, 5vw, 24px)",
                  height: "clamp(18px, 5vw, 24px)",
                  objectFit: "contain",
                }}
              />
            )}
            <span
              className="font-medium text-[#2D2540] whitespace-nowrap"
              style={{ fontSize: "clamp(10px, 3vw, 13px)" }}
            >
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
