import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import StellaHero from "@/components/site/StellaHero";
import SystemReveal from "@/components/site/SystemReveal";
import HomeMotion from "@/components/site/HomeMotion";

const resources = [
  {
    number: "01",
    title: "GitHub",
    description: "Source code & implementation",
    href: "#",
  },
  {
    number: "02",
    title: "YouTube",
    description: "Demonstration & presentation",
    href: "#",
  },
  {
    number: "03",
    title: "Documentation",
    description: "Technical documentation",
    href: "#",
  },
  {
    number: "04",
    title: "Dataset",
    description: "Training & evaluation data",
    href: "#",
  },
  {
    number: "05",
    title: "PPT Deck",
    description: "Project presentation",
    href: "#",
  },
];

const capabilities = [
  ["01", "Pose estimation", "Understanding body position and movement."],
  ["02", "Hand tracking", "Following precise hand movement and interaction."],
  ["03", "Object detection", "Recognizing objects involved in the experiment."],
  ["04", "Activity recognition", "Interpreting movement as meaningful action."],
  ["05", "Procedure validation", "Checking actions against the expected sequence."],
];

export default function Home() {
  return (
    <main className="stella-home">
      {/* GLOBAL MOTION */}
      <HomeMotion />

      {/* FIXED NAVIGATION */}
      <Navbar />

      {/* =====================================================
          HERO
          ===================================================== */}
      <StellaHero />

      {/* =====================================================
          ABOUT / INTRODUCTION
          ===================================================== */}
      <section className="stella-intro" id="about">
        <div className="stella-intro-inner">

          <img
            src="/brand/stella-head.png"
            alt="STELLA"
            className="stella-intro-wordmark"
          />

          <div className="stella-intro-kicker">
            INTELLIGENT ACTIVITY RECOGNITION
          </div>

          <h1 className="stella-intro-title">
            Understanding human activity
            <em>through computer vision.</em>
          </h1>

          <p className="stella-intro-description">
            STELLA observes human movement, hand interaction, and objects
            during space experiments to understand what is happening —
            and whether the procedure is being followed.
          </p>

          <div className="stella-intro-actions">
            <Link href="/live" className="primary">
              Live AI
              <span style={{ marginLeft: 18 }}>↗</span>
            </Link>

            <Link href="/simulations" className="secondary">
              Simulation Lab
              <span style={{ marginLeft: 18 }}>→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* =====================================================
          INTRODUCTION
          ===================================================== */}
      <section
        className="home-section intro-section stella-introduction-section"
        id="introduction"
      >
        <div className="section-index">
          <span>01</span>
          INTRODUCTION
        </div>

        <div className="intro-grid">
          <div>
            <h2>
              Space experiments
              <br />
              <em>are sequences.</em>
            </h2>
          </div>

          <div className="intro-text">
            <p>
              Astronauts do not simply move through an experiment.
              They perform a sequence of deliberate actions — reaching,
              grasping, moving, placing, and withdrawing.
            </p>

            <p>
              STELLA uses computer vision to interpret those actions
              in context, turning visual observations into meaningful
              experimental events.
            </p>

            <Link href="/live" className="inline-link">
              See STELLA working <span>↗</span>
            </Link>
          </div>
        </div>

        <div className="sequence-line" aria-hidden="true">
          <span>OBSERVE</span>
          <i />
          <span>RECOGNIZE</span>
          <i />
          <span>INTERPRET</span>
          <i />
          <span>VALIDATE</span>
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE
          ===================================================== */}
      <section
        className="demo-section stella-experience-section"
        id="demos"
      >
        <div className="home-section">

          <div className="section-index">
            <span>02</span>
            EXPERIENCE
          </div>

          <div className="demo-intro">
            <h2>
              See what
              <br />
              <em>STELLA sees.</em>
            </h2>

            <p>
              Two ways to experience the system — interact with the
              live perception pipeline or explore recorded experiments.
            </p>
          </div>

          <div className="demo-grid">

            <Link href="/live" className="demo-card demo-card-live">

              <div className="demo-card-top">
                <span>LIVE / 01</span>
                <span>REAL-TIME</span>
              </div>

              <div className="demo-visual live-visual">
                <div className="scan-line" />

                <div className="demo-person">
                  <i className="demo-head" />
                  <i className="demo-body" />
                  <i className="demo-arm" />
                </div>

                <span className="detected-box">
                  OPERATOR
                </span>

                <span className="detected-action">
                  REACH
                </span>
              </div>

              <div className="demo-card-bottom">
                <div>
                  <h3>Live AI</h3>

                  <p>
                    Use your camera and watch STELLA recognize
                    activity in real time.
                  </p>
                </div>

                <span className="demo-arrow">↗</span>
              </div>

            </Link>

            <Link href="/simulations" className="demo-card">

              <div className="demo-card-top">
                <span>REPLAY / 02</span>
                <span>PRECOMPUTED</span>
              </div>

              <div className="demo-visual simulation-visual">
                <div className="simulation-orbit" />
                <div className="simulation-orbit simulation-orbit-2" />
                <div className="simulation-core" />

                <span>
                  EXPERIMENT / ORBIT
                </span>
              </div>

              <div className="demo-card-bottom">
                <div>
                  <h3>Simulation Lab</h3>

                  <p>
                    Explore recorded experiments and see how
                    STELLA interprets activity over time.
                  </p>
                </div>

                <span className="demo-arrow">↗</span>
              </div>

            </Link>

          </div>
        </div>
      </section>

      {/* =====================================================
          SYSTEM
          ===================================================== */}
      <SystemReveal>
        <section
          className="stella-system-section"
          id="system"
        >

          <div className="stella-system-header">

            <div className="stella-section-index">
              <span>02</span>
              <span>SYSTEM</span>
            </div>

            <div className="stella-system-title">

              <h2>
                From perception
                <br />
                <em>to understanding.</em>
              </h2>

              <p>
                STELLA combines local computer vision, human activity
                recognition, interaction detection, and procedure
                validation into a single offline experiment runtime.
              </p>

            </div>

          </div>

          <div className="stella-system-flow">

            <div className="stella-system-node">
              <span>01</span>
              <strong>CAMERA</strong>

              <p>
                Live visual input from the experiment environment.
              </p>
            </div>

            <div className="stella-system-line" />

            <div className="stella-system-node">
              <span>02</span>
              <strong>VISION</strong>

              <p>
                Pose, hand, and object perception running locally.
              </p>
            </div>

            <div className="stella-system-line" />

            <div className="stella-system-node">
              <span>03</span>
              <strong>ACTIVITY</strong>

              <p>
                Movement and interaction evidence are interpreted
                as structured activity.
              </p>
            </div>

            <div className="stella-system-line" />

            <div className="stella-system-node">
              <span>04</span>
              <strong>VALIDATION</strong>

              <p>
                Detected actions are evaluated against the active
                experiment procedure.
              </p>
            </div>

          </div>

          <div className="stella-system-footer">
            <span>LOCAL RUNTIME</span>
            <span>NO CLOUD INFERENCE</span>
            <span>STRUCTURED EVENT LOGGING</span>
          </div>

        </section>
      </SystemReveal>

      {/* =====================================================
          RESOURCES
          ===================================================== */}
      <section
        className="resources-section stella-resources-section"
        id="resources"
      >
        <div className="home-section">

          <div className="resources-heading">

            <div className="section-index light-index">
              <span>03</span>
              PROJECT RESOURCES
            </div>

            <h2>
              Everything
              <br />
              <em>behind STELLA.</em>
            </h2>

            <p>
              Explore the implementation, research material,
              demonstrations, data, and project documentation.
            </p>

          </div>

          <div className="resource-list">

            {resources.map((resource) => (
              <a
                href={resource.href}
                className="resource-row"
                key={resource.number}
              >
                <span className="resource-number">
                  {resource.number}
                </span>

                <strong>
                  {resource.title}
                </strong>

                <span className="resource-description">
                  {resource.description}
                </span>

                <span className="resource-arrow">
                  ↗
                </span>
              </a>
            ))}

          </div>

        </div>
      </section>

      {/* =====================================================
          TECHNOLOGY
          ===================================================== */}
      <section
        className="home-section technology-section stella-technology-section"
        id="technology"
      >

        <div className="section-index">
          <span>04</span>
          TECHNOLOGY
        </div>

        <div className="technology-heading">

          <h2>
            Multiple signals.
            <br />
            <em>One understanding.</em>
          </h2>

          <p>
            STELLA combines several visual perception layers to
            understand activity instead of treating every movement
            as an isolated classification.
          </p>

        </div>

        <div className="capability-grid">

          {capabilities.map(([number, title, description]) => (
            <div
              className="capability-row"
              key={number}
            >
              <span>{number}</span>

              <h3>{title}</h3>

              <p>{description}</p>

              <span className="capability-mark">
                +
              </span>
            </div>
          ))}

        </div>

      </section>

      {/* =====================================================
          FINAL
          ===================================================== */}
      <section className="final-section">

        <div className="final-orbit final-orbit-a" />
        <div className="final-orbit final-orbit-b" />

        <img
          src="/brand/stella-logo.png"
          alt=""
          className="final-logo"
        />

        <p className="final-kicker">
          INTELLIGENT HUMAN ACTIVITY RECOGNITION
        </p>

        <h2>
          Observe.
          <br />
          Understand.
          <br />
          <em>Validate.</em>
        </h2>

        <Link
          href="/live"
          className="final-button"
        >
          Enter STELLA <span>↗</span>
        </Link>

      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="site-footer">
        <strong>STELLA</strong>
        <span>SIH26174 / 2026</span>
        <span>
          COMPUTER VISION FOR SPACE EXPERIMENTS
        </span>
      </footer>

    </main>
  );
}
