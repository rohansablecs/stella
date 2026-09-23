import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/site/Navbar";
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
      <Navbar />

      <section className="simulation-detail">
        <div className="simulation-detail-heading">
          <Link href="/simulations" className="simulation-back">
            ← ALL EXPERIMENTS
          </Link>

          <div className="feature-kicker">
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
