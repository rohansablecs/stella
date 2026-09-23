import type {
  Activity,
} from "@/lib/vision/types";

type Props = {
  activity: Activity;
  confidence: number;
};

export default function ActivityPanel({
  activity,
  confidence,
}: Props) {
  return (
    <section className="analysis-card primary">
      <div className="analysis-label">
        CURRENT ACTIVITY
      </div>

      <div className="activity-name">
        {activity}
      </div>

      <div className="confidence">
        <div>
          <span>
            CONFIDENCE
          </span>

          <strong>
            {(
              confidence * 100
            ).toFixed(0)}
            %
          </strong>
        </div>

        <div className="confidence-track">
          <span
            style={{
              width: `${confidence * 100}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}