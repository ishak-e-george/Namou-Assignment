export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="spinner-wrap"><span className="spinner" role="status" aria-label={label} /></div>;
}
