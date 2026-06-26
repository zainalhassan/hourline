import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { SectionCard } from "@/components/transit/SectionCard";
import { TransitBanner } from "@/components/transit/TransitBanner";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <SectionCard
      title="Sign in"
      description="Log hours and send timesheets with Hourline."
      headerColor="var(--color-brand-primary)"
    >
      {params.registered && (
        <TransitBanner>Account created. You can sign in now.</TransitBanner>
      )}
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </SectionCard>
  );
}
