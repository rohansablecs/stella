export default function SectionHeading({
  eyebrow,
  title,
  description,
  number,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  number?: string;
}) {
  return (
    <header className="section-heading">
      <div className="section-heading-meta">
        <span className="section-eyebrow">
          <span className="section-rule" />
          {eyebrow ?? "STELLA"}
        </span>

        {number && (
          <span className="section-number">
            {number}
          </span>
        )}
      </div>

      <h2>{title}</h2>

      {description && <p>{description}</p>}
    </header>
  );
}
