// Swaps the red accent for charcoal on every sell-side page.
export default function SellSideLayout({ children }: { children: React.ReactNode }) {
  return <div data-side="sell">{children}</div>;
}
