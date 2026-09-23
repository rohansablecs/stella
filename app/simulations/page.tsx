import Link from "next/link";

import SimulationCard from "@/components/simulations/SimulationCard";

import {
  SIMULATIONS,
} from "@/lib/simulations";

export default function SimulationsPage() {
  return (
    <main className="simulation-page">
      <header className="live-topbar">
        <Link
          href="/"
          className="live-brand"
        >
          <span className="live-brand-mark">
            S
          </span>

          <span>
            STELLA
          </span>
        </Link>

        <div className="live-topbar-meta">
          <span>
            SIH26174
          </span>

          <span className="topbar-divider" />

          <span>
            SIMULATION LAB
          </span>

          <span className="system-indicator active" />
        </div>
      </header>

      <section className="simulation-shell">
        <div className="simulation-hero">
          <div>
            <div className="live-eyebrow">
              02 / SIMULATION LAB
            </div>

            <h1>
              Experiments,
              <br />
              <span>replayed.</span>
            </h1>

            <p>
              Recorded experiment footage
              provides a controlled environment
              for examining activity recognition,
              sequence validation and operator
              assistance.
            </p>
          </div>

          <div className="simulation-hero-meta">
            <span>
              LOCAL ANALYSIS
            </span>

            <strong>
              {SIMULATIONS.length
                .toString()
                .padStart(2, "0")}
            </strong>

            <small>
              DEMONSTRATION SCENARIOS
            </small>
          </div>
        </div>

        <div className="simulation-notice">
          <span>
            ANALYSIS MODE
          </span>

          <p>
            Simulation Lab uses recorded
            footage. It does not represent a
            live spacecraft feed or claim
            mission-specific hardware detection.
          </p>
        </div>

        <div className="simulation-grid">
          {SIMULATIONS.map(
            (simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={
                  simulation
                }
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
}