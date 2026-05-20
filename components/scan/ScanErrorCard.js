export default function ScanErrorCard({ message, onRetry }) {
  return (
    <div
      className="mt-8 rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 sm:p-8"
      role="alert"
    >
      <h2 className="text-lg font-bold text-rose-200 sm:text-xl">
        Couldn&apos;t scan this photo
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
        {message ||
          "Something went wrong. Try again with a clearer shot of your fridge or pantry."}
      </p>
      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-zinc-400">
        <li>Use bright, even lighting</li>
        <li>Move closer so labels are readable</li>
        <li>Avoid glare and heavy blur</li>
        <li>Include shelves with food front-facing</li>
      </ul>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-2xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Try another photo
        </button>
      )}
    </div>
  );
}
