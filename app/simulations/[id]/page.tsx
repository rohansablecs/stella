import Link from "next/link";
import { notFound } from "next/navigation";

import SimulationViewer from "@/components/simulations/SimulationViewer";
import { getSimulation } from "@/lib/simulations";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SimulationPage({ params }: Props) {
  const { id } = await params;
  const simulation = getSimulation(id);

  if (!simulation) {
    notFound();
  }

  return (
    <main className="simulation-page">
      <header className="live-topbar">
        <Link href="/" className="live-brand">
          <span className="live-brand-mark">S</span>
          <span>STELLA</span>
        </Link>

        <div className="live-topbar-meta">
          <Link href="/simulations">
            SIMULATION LAB
          </Link>

          <span className="topbar-divider" />

          <span>{simulation.code}</span>
        </div>
      </header>

      <section className="simulation-detail">
        <div className="simulation-detail-heading">
          <Link
            href="/simulations"
            className="back-link"
          >
            ← ALL EXPERIMENTS
          </Link>

          <div className="live-eyebrow">
            {simulation.code} / TEMPORAL ANALYSIS
          </div>

          <h1>{simulation.title}</h1>

          <p>{simulation.description}</p>
        </div>

        <div className="simulation-viewer">
          <SimulationViewer simulation={simulation} />
        </div>
      </section>
    </main>
  );
}