"use client";

import { useRouter } from "next/navigation";
import JoinScreen from "@/components/session/JoinScreen";

export default function Home() {
  const router = useRouter();

  return (
    <JoinScreen
      sessionName="Roadmap sync"
      onJoin={(name) => {
        router.push(`/board?name=${encodeURIComponent(name)}`);
      }}
    />
  );
}
