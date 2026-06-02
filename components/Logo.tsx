import Image from "next/image";

interface Props {
  size?: number;
}

export default function Logo({ size = 28 }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Image
        src="/fire.svg"
        alt="Pyros fire icon"
        width={size}
        height={size}
        style={{ filter: "brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(105%)" }}
        priority
      />
      <span
        style={{
          fontFamily:    "var(--font-display)",
          fontSize:      18,
          fontWeight:    700,
          letterSpacing: "0.25em",
          color:         "var(--text-primary)",
          lineHeight:    1,
        }}
      >
        PYROS
      </span>
    </div>
  );
}
