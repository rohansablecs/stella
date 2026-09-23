import Link from "next/link";

import type {
  Simulation,
} from "@/lib/simulations";

type Props = {
  simulation: Simulation;
};

export default function SimulationCard({
  simulation,
}: Props) {
  return (
    <Link
      href={`/simulations/${simulation.id}`}
      className="simulation-card"
    >
      <div className="simulation-card-top">
        <span>
          {simulation.code}
        </span>

        <span>
          {simulation.category}
        </span>
      </div>

      <div className="simulation-card-index">
        00
      </div>

      <h2>
        {simulation.title}
      </h2>

      <p>
        {simulation.description}
      </p>

      <div className="simulation-card-footer">
        <span>
          OPEN ANALYSIS
        </span>

        <span>
          →
        </span>
      </div>
    </Link>
  );
}