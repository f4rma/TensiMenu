interface DividerProps {
  label: string;
}

/**
 * Divider horizontal dengan text di tengah.
 * Pakai untuk pemisah "atau masuk dengan" / "atau daftar dengan".
 */
export default function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={label}>
      <span
        className="h-px flex-1 bg-brand-charcoal/10"
        aria-hidden="true"
      />
      <span className="text-xs font-medium uppercase tracking-wider text-brand-charcoal-muted">
        {label}
      </span>
      <span
        className="h-px flex-1 bg-brand-charcoal/10"
        aria-hidden="true"
      />
    </div>
  );
}
