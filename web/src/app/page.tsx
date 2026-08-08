"use client";

import { useRouter } from "next/navigation";
import LandingScreen from "@/components/landing/LandingScreen";
import { newSessionId } from "@/lib/session-id";

export default function Home() {
  const router = useRouter();

  return (
    <LandingScreen
      onJoin={(name) => {
        const id = newSessionId();
        const q = new URLSearchParams({ name, new: "1" });
        router.push(`/s/${id}?${q.toString()}`);
      }}
    />
  );
}
