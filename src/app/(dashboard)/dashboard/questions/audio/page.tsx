import Link from "next/link";
import { ListeningAudio } from "@/components/dashboard/listening-audio";

export default function ListeningAudioPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/questions" className="hover:text-crimson">
            02 · Question bank
          </Link>{" "}
          / listening audio
        </p>
        <h1 className="text-2xl">Listening audio</h1>
      </div>
      <ListeningAudio />
    </div>
  );
}
