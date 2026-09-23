export default function Home() {
  return (
    <main className="stella-page">
      <section
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            width: "min(900px, 100%)",
          }}
        >
          <div
            className="stella-mono"
            style={{
              marginBottom: "20px",
              color: "var(--stella-accent)",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            STELLA / SIH26174
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(56px, 10vw, 120px)",
              lineHeight: 0.9,
              letterSpacing: "-0.065em",
              fontWeight: 600,
            }}
          >
            STELLA
          </h1>

          <p
            style={{
              maxWidth: "680px",
              marginTop: "28px",
              color: "var(--stella-text-secondary)",
              fontSize: "20px",
              lineHeight: 1.6,
            }}
          >
            Intelligent activity recognition for autonomous
            space experiments.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "36px",
            }}
          >
            <a
              href="/live"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "48px",
                padding: "0 22px",
                background: "var(--stella-accent)",
                color: "#050608",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              LIVE AI
            </a>

            <a
              href="/simulations"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "48px",
                padding: "0 22px",
                border: "1px solid var(--stella-border)",
                color: "var(--stella-text)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              SIMULATION LAB
            </a>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1px",
              marginTop: "80px",
              border: "1px solid var(--stella-border)",
              background: "var(--stella-border)",
            }}
          >
            {[
              ["01", "RECOGNIZE", "Detect human activity."],
              ["02", "UNDERSTAND", "Interpret the operation."],
              ["03", "VALIDATE", "Check the expected sequence."],
              ["04", "ASSIST", "Guide the operator."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                style={{
                  minHeight: "150px",
                  padding: "22px",
                  background: "var(--stella-surface)",
                }}
              >
                <div
                  className="stella-mono"
                  style={{
                    color: "var(--stella-accent)",
                    fontSize: "10px",
                  }}
                >
                  {number}
                </div>

                <div
                  style={{
                    marginTop: "28px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  {title}
                </div>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "var(--stella-text-muted)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}