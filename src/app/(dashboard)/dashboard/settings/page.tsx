import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createAccount } from "../students/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("role", ["teacher", "admin"])
    .order("role")
    .order("full_name");

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">06 · Settings</p>
        <h1 className="text-2xl">Settings</h1>
      </div>

      {error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{error}</p>
      ) : null}
      {created ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Account created: {created}
        </p>
      ) : null}

      {/* Account creation */}
      <section>
        <h2 className="text-lg mb-3">Accounts</h2>
        {isAdmin ? (
          <Card className="p-6">
            <p className="text-[13px] text-ink-muted mb-4">
              Create a student, teacher or admin account. Set a temporary password and
              share it — the same account works for the placement test and mock tests.
            </p>
            <form action={createAccount} className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="full_name">
                <Input id="full_name" name="full_name" required />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Temporary password" htmlFor="password" hint="At least 8 characters.">
                <Input id="password" name="password" type="text" minLength={8} required />
              </Field>
              <Field label="Role" htmlFor="role">
                <select
                  id="role"
                  name="role"
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px]"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
              </div>
            </form>
          </Card>
        ) : (
          <p className="text-[13px] text-ink-muted">
            Only an admin can create accounts. Ask your administrator.
          </p>
        )}
      </section>

      {/* Staff */}
      <section>
        <h2 className="text-lg mb-3">
          Staff <span className="figures text-[13px] text-ink-muted">({(staff ?? []).length})</span>
        </h2>
        <Card className="divide-y divide-line">
          {(staff ?? []).map((s) => (
            <div key={s.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[14px] truncate">{s.full_name}</p>
                <p className="text-[12px] text-ink-muted truncate">{s.email}</p>
              </div>
              <span className="rounded bg-cream-50 border border-line px-2 py-0.5 text-[11px]">
                {s.role}
              </span>
            </div>
          ))}
        </Card>
      </section>

      {/* Scoring bands note */}
      <section>
        <h2 className="text-lg mb-3">Scoring bands</h2>
        <Card className="p-6">
          <p className="text-[14px] text-ink-soft">
            CEFR band boundaries are stored in <code>mock_scoring_bands</code> and can be
            recalibrated per exam and module. A visual editor is planned; for now these are
            managed directly in the database.
          </p>
        </Card>
      </section>
    </div>
  );
}
