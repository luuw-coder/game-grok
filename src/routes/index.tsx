import { createFileRoute } from "@tanstack/react-router";
import { DashCanyon } from "@/components/dash-canyon";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DashCanyon />;
}
