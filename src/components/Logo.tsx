import { ShieldCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo-mark" aria-label="ASRMS official logo">
      <span className="logo-mark__symbol">
        <ShieldCheck size={compact ? 18 : 24} />
      </span>
      {!compact && (
        <span className="logo-mark__text">
          <strong>ASRMS</strong>
          <small>Autonomous Scaling</small>
        </span>
      )}
    </span>
  );
}
