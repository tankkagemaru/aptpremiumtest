import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuestionForm } from "@/components/dashboard/question-form";
import { saveQuestion } from "../actions";

export default async function NewQuestionPage() {
  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("mock_exams")
    .select("code")
    .eq("is_active", true)
    .order("name")
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/questions" className="hover:text-crimson">
            02 · Question bank
          </Link>{" "}
          / new
        </p>
        <h1 className="text-2xl">Add a question</h1>
      </div>
      <QuestionForm examCode={exam?.code ?? "aptis-general"} saveAction={saveQuestion} />
    </div>
  );
}
