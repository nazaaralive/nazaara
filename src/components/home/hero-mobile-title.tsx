interface HeroMobileTitleProps {
  title: string;
}

function getFontSize(titleLength: number): string {
  // Dynamic font sizing based on title length
  // Short titles (≤ 10 chars): 18vw
  // Medium titles (10-15 chars): 16vw
  // Long titles (15-20 chars): 14vw
  // Very long titles (> 20 chars): 12vw
  
  if (titleLength <= 10) return "18vw";
  if (titleLength <= 15) return "16vw";
  if (titleLength <= 20) return "14vw";
  return "12vw";
}

export default function HeroMobileTitle({ title }: HeroMobileTitleProps) {
  const fontSize = getFontSize(title.length);

  return (
    <h1
      className="font-prettywise leading-[1.1]"
      style={{
        color: "var(--white)",
        fontSize,
      }}
    >
      {title}
    </h1>
  );
}

