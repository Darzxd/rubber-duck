"use client";

import JoinScreen from "@/components/session/JoinScreen";

export default function Home() {
  // Placeholder wiring: the real session name and join handler come from the
  // session layer.
  return (
    <JoinScreen
      sessionName="Roadmap sync"
      onJoin={(name) => console.log("joining as", name)}
    />
  );
}
