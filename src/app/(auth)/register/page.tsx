import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { register } from "../actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h2 className="font-display text-2xl mb-1 text-crimson">Create an account</h2>
      <p className="text-ink-muted text-[13px] mb-6">
        One account works for both the placement test and mock tests.
      </p>

      {error ? (
        <p className="mb-4 rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
          {error}
        </p>
      ) : null}

      <form action={register} className="space-y-4">
        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field
          label="Registration code"
          htmlFor="registration_code"
          hint="Provided by your teacher or the centre."
        >
          <Input id="registration_code" name="registration_code" required />
        </Field>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-[13px] text-ink-muted text-center">
        Already registered?{" "}
        <Link href="/login" className="text-crimson hover:text-crimson-soft underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
