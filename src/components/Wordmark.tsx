export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-[-0.05em] sm:text-2xl ${className}`}>
      thedigital<span className="text-red">wit</span>
    </span>
  );
}
