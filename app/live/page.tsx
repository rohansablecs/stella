import Navbar from "@/components/site/Navbar";
import LiveAI from "@/components/live/LiveAI";
import MissionSwitchNotice from "@/components/live/MissionSwitchNotice";

export default function LivePage() {
  return (
    <main className="live-route">
      <Navbar />
      <>
      <MissionSwitchNotice />
      <LiveAI />
    </>
    </main>
  );
}
