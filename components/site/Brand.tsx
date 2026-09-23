import Link from "next/link";

export default function Brand({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Link href="/" className={`stella-brand ${compact ? "is-compact" : ""}`}>
      <span className="stella-symbol" aria-hidden="true">
        <span className="symbol-ring symbol-ring-a" />
        <span className="symbol-ring symbol-ring-b" />
        <span className="symbol-satellite" />
        <span className="symbol-star">✦</span>
      </span>

      <span className="stella-wordmark">STELLA</span>
    </Link>
  );
}
