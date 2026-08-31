import { FolderKanban } from "lucide-react";

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium tracking-wide text-ink">CRM</p>
        </div>

        <div className="rounded-md border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
