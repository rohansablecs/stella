import Navbar from "@/components/site/Navbar";
import SimulationCard from "@/components/simulations/SimulationCard";
import { SIMULATIONS } from "@/lib/simulations";

export default function SimulationsPage() {
  return (
    <main className="simulations-page">
      <Navbar />

      <section className="simulations-hero">
        <div className="simulations-hero-copy">
          <div className="feature-kicker">02 / EXPERIMENT ARCHIVE</div>

          <h1>
            Experiments,
            <br />
            <span>replayed.</span>
          </h1>

          <p>
            Recorded experiment footage transformed into a controlled
            environment for examining human activity, interaction evidence,
            and temporal procedure state.
          </p>
        </div>

        <div className="simulations-hero-meta">
          <span>LOCAL ANALYSIS ARCHIVE</span>
          <strong>03</strong>
          <small>DEMONSTRATION SCENARIOS</small>
        </div>
      </section>

      <section className="simulation-note">
        <span>ANALYSIS NOTE</span>

        <p>
          These recordings are demonstration material. Simulation analysis is
          precomputed locally and does not represent a live spacecraft feed.
        </p>
      </section>

      <section className="simulation-archive">
        <div className="archive-heading">
          <span>EXPERIMENTS</span>
          <span>{String(SIMULATIONS.length).padStart(2, "0")} SCENARIOS</span>
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
