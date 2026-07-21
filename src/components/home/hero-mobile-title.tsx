interface HeroMobileTitleProps {
  title: string;
}

function getFontSize(titleLength: number): string {
  // Dynamic font sizing based on title length.
  // Sized for the bold Neue Haas treatment — smaller than the old
  // serif sizes since bold sans carries more visual weight per vw.
  // Short titles (≤ 10 chars): 13vw
  // Medium titles (10-15 chars): 11vw
  // Long titles (15-20 chars): 9.5vw
  // Very long titles (> 20 chars): 8.5vw

  if (titleLength <= 10) return "13vw";
  if (titleLength <= 15) return "11vw";
  if (titleLength <= 20) return "9.5vw";
  return "8.5vw";
}

export default function HeroMobileTitle({ title }: HeroMobileTitleProps) {
  const fontSize = getFontSize(title.length);

  return (
    <h1
      className="font-neue-haas font-bold uppercase leading-[1.02] tracking-tight"
      style={{
        color: "var(--white)",
        fontSize,
      }}
    >
      {title}
    </h1>
  );
}
