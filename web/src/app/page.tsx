"use client";

import { useRouter } from "next/navigation";
import LandingScreen from "@/components/landing/LandingScreen";

export default function Home() {
  const router = useRouter();

  return (
    <LandingScreen
      onJoin={(name) => {
        router.push(`/board?name=${encodeURIComponent(name)}`);
      }}
    />
  );
}
