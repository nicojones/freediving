interface UserProfileCardProps {
  username: string;
}

export function UserProfileCard({ username }: UserProfileCardProps) {
  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden border border-outline-variant/30">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl" aria-hidden>
            person
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-1">
            Logged in as
          </span>
          <p className="text-on-surface font-headline text-xl font-bold truncate">{username}</p>
        </div>
      </div>
    </div>
  );
}
