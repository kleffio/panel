import { AuthRouteShell } from "@/features/auth/ui/AuthRouteShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRouteShell>{children}</AuthRouteShell>;
}
