import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createAccount } from "./actions";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";
  const supabase = await createClient();

  const [{ data: students }, { data: staff }, { data: attempts }] = await Promise.all([
    supabase.from("students").select("id, full_name, email, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("users").select("id, full_name, email, role").in("role", ["teacher", "admin"]).order("full_name"),
    supabase.from("mock_attempts").select("student_id, status"),
  ]);

  const attemptsByStudent = new Map<string, number>();
  (attempts ?? []).forEach((a) => {
    attemptsByStudent.set(a.student_id, (attemptsByStudent.get(a.student_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">04 · Students</p>
        <h1 className="text-2xl">People</h1>
      </div>

      {error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{error}</p>
      ) : null}
      {created ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Account created: {created}
        </p>
      ) : null}

      {isAdmin ? (
        <Card className="p-6">
          <h2 className="text-lg mb-1">Create an account</h2>
          <p className="text-[13px] text-ink-muted mb-4">
            Set a temporary password and share it with the person — they can use it
            for both the placement test and the mock tests.
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
              <Button type="submit">Create account</Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className="text-[13px] text-ink-muted">
          Only an admin can create accounts. Ask your administrator to add new
          teachers or students.
        </p>
      )}

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

      <section>
        <h2 className="text-lg mb-3">
          Students{" "}
          <span className="figures text-[13px] text-ink-muted">({(students ?? []).length})</span>
        </h2>
        {(students ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">No students yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(students ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/students/${s.id}`}
                className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-cream-50"
              >
                <div className="min-w-0">
                  <p className="text-[14px] truncate">{s.full_name}</p>
                  <p className="text-[12px] text-ink-muted truncate">{s.email}</p>
                </div>
                <span className="figures text-[12px] text-ink-muted shrink-0">
                  {attemptsByStudent.get(s.id) ?? 0} attempt
                  {(attemptsByStudent.get(s.id) ?? 0) === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
