import {
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";

export const Route = createFileRoute("/guardian")({
  component: GuardianLayout,
});

function GuardianLayout() {
  return <Outlet />;
}