import Brand from "./Brand";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-topline" />

        <div className="footer-grid">
          <div className="footer-intro">
            <Brand compact />

            <p>
              Intelligent activity recognition
              <br />
              for autonomous space experiments.
            </p>
          </div>

          <div className="footer-group">
            <span className="footer-heading">SYSTEM</span>
            <span>Offline inference</span>
            <span>Local processing</span>
            <span>Structured event logs</span>
          </div>

          <div className="footer-group">
            <span className="footer-heading">INTERFACES</span>
            <span>Live monitoring</span>
            <span>Simulation replay</span>
            <span>Experiment analysis</span>
          </div>

          <div className="footer-group footer-group-right">
            <span className="footer-heading">IDENTITY</span>
            <span>STELLA</span>
            <span>SIH26174</span>
            <span>Space experiment operations</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>STELLA / INTELLIGENT ACTIVITY RECOGNITION</span>
          <span>LOCAL · OFFLINE · EXPERIMENTAL</span>
        </div>
      </div>
    </footer>
  );
}
