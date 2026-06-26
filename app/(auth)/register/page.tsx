import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SectionCard } from "@/components/transit/SectionCard";
import { getAppDisplayName } from "@/lib/env";

export default function RegisterPage() {
  const appName = getAppDisplayName();

  return (
    <SectionCard
      title="Create account"
      description={`Create your ${appName} account and start logging time.`}
      headerColor="var(--color-route-teal)"
    >
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </SectionCard>
  );
}
