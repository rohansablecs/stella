import Link from "next/link";
import SimulationCard from "@/components/simulations/SimulationCard";
import { SIMULATIONS } from "@/lib/simulations";

export default function SimulationsPage() {
  return (
    <main className="simulations-page">
      <header className="live-topbar">
        <Link href="/" className="live-brand">
          <span className="live-brand-mark">S</span>
          <span>STELLA</span>
        </Link>

        <div className="live-topbar-meta">
          <span>SIH26174</span>
          <span className="topbar-divider" />
          <span>SIMULATION LAB</span>
          <span className="system-indicator active" />
        </div>
      </header>

      <section className="simulation-shell">
        <div className="simulation-hero">
          <div>
            <div className="live-eyebrow">
              02 / EXPERIMENT ARCHIVE
            </div>

            <h1>
              Experiments,
              <br />
              <span>replayed.</span>
            </h1>

            <p>
              Recorded experiment footage is transformed into a controlled
              environment for examining human activity, interaction evidence
              and temporal procedure state.
            </p>
          </div>

          <div className="simulation-hero-meta">
            <span>LOCAL ANALYSIS ARCHIVE</span>
            <strong>
              {SIMULATIONS.length.toString().padStart(2, "0")}
            </strong>
            <small>DEMONSTRATION SCENARIOS</small>
          </div>
        </div>

        <div className="simulation-notice">
          <span>ANALYSIS NOTE</span>

          <p>
            These recordings are demonstration material. Simulation analysis
            is precomputed locally and does not represent a live spacecraft
            feed.
          </p>
        </div>

        <div className="simulation-grid">
          {SIMULATIONS.map((simulation, index) => (
            <SimulationCard
              key={simulation.id}
              simulation={simulation}
              index={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}