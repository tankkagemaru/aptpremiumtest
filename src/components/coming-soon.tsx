import { Card } from "@/components/ui/card";

export function ComingSoon({
  marker,
  title,
  phase,
}: {
  marker: string;
  title: string;
  phase: string;
}) {
  return (
    <div>
      <p className="label-caps mb-2">{marker}</p>
      <h1 className="text-2xl mb-6">{title}</h1>
      <Card className="p-6">
        <p className="text-[14px] text-ink-muted">Planned for {phase}.</p>
      </Card>
    </div>
  );
}
