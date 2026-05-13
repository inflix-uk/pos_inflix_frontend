export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500"
        aria-hidden
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
