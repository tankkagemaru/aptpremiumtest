/* eslint-disable @next/next/no-img-element */

/** PECSB shared brand lockup — logo mark + "Premium Language Centre" wordmark.
 *  Matches the sibling placement-test app's house style. */
export function Logo({
  size = "md",
  subtitle,
}: {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}) {
  const mark = size === "lg" ? 44 : size === "sm" ? 26 : 32;
  const wordSize =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/plc-logo.png"
        alt="Premium Language Centre"
        width={mark}
        height={mark}
        className="rounded-[6px]"
        style={{ width: mark, height: mark }}
      />
      <span className="leading-tight">
        <span className={`font-display ${wordSize} block`}>
          Mock<span className="text-crimson">·</span>Test
        </span>
        {subtitle ? (
          <span className="label-caps block mt-0.5">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
