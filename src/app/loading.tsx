export default function Loading() {
  return (
    <div className="flex min-h-screen flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="mx-auto mb-6 h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-6 space-y-3">
            <div className="h-5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
