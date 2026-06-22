const FEELINGS = [
  {
    id: "soft",
    label: "부드러운",
    icon: "/assets/smile_heart.png",
    bg: "#fdf0f2",
    color: "#e53033",
  },
  {
    id: "special",
    label: "특별한",
    icon: "/assets/purple_star.png",
    bg: "#f8f4fc",
    color: "#41397f",
  },
  {
    id: "calm",
    label: "차분한",
    icon: "/assets/skyblue_moon.png",
    bg: "#f2f6fd",
    color: "#2e69bc",
  },
  {
    id: "warm",
    label: "따뜻한",
    icon: "/assets/sun.png",
    bg: "#fef7eb",
    color: "#b3520d",
  },
];

export default function FeelingSection() {
  return (
    <section
      style={{
        paddingTop: "40px",
        paddingBottom: "32px",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
    >
      <h2
        className="flex items-center justify-center gap-1 text-center text-[#2D2540]"
        style={{
          fontSize: "15px",
          fontWeight: 700,
          marginBottom: "20px",
          letterSpacing: "-0.2px",
        }}
      >
        어떤 느낌의 이름을 원하시나요?
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/sparkle_two.png"
          alt=""
          aria-hidden="true"
          style={{ width: "26px", height: "26px" }}
        />
      </h2>

      <div style={{ display: "flex", gap: "8px" }}>
        {FEELINGS.map((item) => (
          <div
            key={item.id}
            style={{
              flex: 1,
              borderRadius: "16px",
              background: item.bg,
              border: "2px solid transparent",
              padding: "16px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.icon}
              alt=""
              aria-hidden="true"
              style={{ width: "60px", height: "60px", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: item.color,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
