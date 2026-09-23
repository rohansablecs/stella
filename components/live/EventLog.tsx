export type LiveEvent = {
  id: string;
  timestamp: string;
  kind:
    | "SYSTEM"
    | "DETECTED"
    | "VALID"
    | "GUIDANCE"
    | "WARNING";
  message: string;
};

type Props = {
  events: LiveEvent[];
};

export default function EventLog({
  events,
}: Props) {
  return (
    <section className="event-console">
      <div className="console-header">
        <div>
          <span className="analysis-label">
            EVENT STREAM
          </span>

          <p>
            Timestamped observations,
            validation decisions and
            guidance generated locally.
          </p>
        </div>

        <span className="console-status">
          {events.length} EVENTS
        </span>
      </div>

      <div className="event-table">
        {events.length === 0 ? (
          <div className="empty-events">
            No events recorded yet.
          </div>
        ) : (
          events
            .slice()
            .reverse()
            .map((event) => (
              <div
                className="event-line"
                key={event.id}
              >
                <time>
                  {event.timestamp}
                </time>

                <span
                  className={`event-kind ${event.kind.toLowerCase()}`}
                >
                  {event.kind}
                </span>

                <p>
                  {event.message}
                </p>
              </div>
            ))
        )}
      </div>
    </section>
  );
}