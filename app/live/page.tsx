import Navbar from "@/components/site/Navbar";
import LiveAI from "@/components/live/LiveAI";

export default function LivePage() {
  return (
    <main className="live-route">
      <Navbar />
      <LiveAI />
    </main>
  );
}
