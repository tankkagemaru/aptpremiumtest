import Link from "next/link";
import { ImageGen } from "@/components/dashboard/image-gen";

export default function SpeakingImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/questions" className="hover:text-crimson">
            02 · Question bank
          </Link>{" "}
          / speaking images
        </p>
        <h1 className="text-2xl">Speaking images</h1>
      </div>
      <ImageGen />
    </div>
  );
}
