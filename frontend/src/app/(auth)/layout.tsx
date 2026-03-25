import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FleetOptima - Authentication",
  description: "Sign in to your FleetOptima account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
