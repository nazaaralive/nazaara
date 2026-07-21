interface HeroMobileTitleProps {
  title: string;
}

function getFontSize(titleLength: number): string {
  // Narrow, consistent scale — the old 12–18vw range made short and long
  // titles look like different designs. Sizes now sit close together so
  // every event title reads at roughly the same visual weight.
  // Short titles (≤ 15 chars): 11vw
  // Long titles (15-20 chars): 10vw
  // Very long titles (> 20 chars): 9vw

  if (titleLength <= 15) return "11vw";
  if (titleLength <= 20) return "10vw";
  return "9vw";
}

export default function HeroMobileTitle({ title }: HeroMobileTitleProps) {
  const fontSize = getFontSize(title.length);

  return (
    <h1
      className="font-prettywise leading-[1.08]"
      style={{
        color: "var(--white)",
        fontSize,
      }}
    >
      {title}
    </h1>
  );
}
