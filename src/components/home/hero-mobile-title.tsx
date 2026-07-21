interface HeroMobileTitleProps {
  title: string;
}

function getFontSize(titleLength: number): string {
  // Dynamic font sizing based on title length.
  // Roughly 60% of the original sizes — large enough to lead the
  // section, small enough to stay readable and above the fold.
  // Short titles (≤ 10 chars): 12vw
  // Medium titles (10-15 chars): 11vw
  // Long titles (15-20 chars): 10vw
  // Very long titles (> 20 chars): 8.5vw

  if (titleLength <= 10) return "12vw";
  if (titleLength <= 15) return "11vw";
  if (titleLength <= 20) return "10vw";
  return "8.5vw";
}

export default function HeroMobileTitle({ title }: HeroMobileTitleProps) {
  const fontSize = getFontSize(title.length);

  return (
    <h1
      className="font-prettywise leading-[1.05]"
      style={{
        color: "var(--white)",
        fontSize,
      }}
    >
      {title}
    </h1>
  );
}
