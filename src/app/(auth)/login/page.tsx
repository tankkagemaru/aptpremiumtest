import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div>
      <h2 className="font-display text-2xl mb-1 text-crimson">Sign in</h2>
      <p className="text-ink-muted text-[13px] mb-6">
        Use the same account as the placement test.
      </p>

      {error ? (
        <p className="mb-4 rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          {message}
        </p>
      ) : null}

      <form action={login} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-[13px] text-ink-muted text-center">
        New student?{" "}
        <Link href="/register" className="text-crimson hover:text-crimson-soft underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
