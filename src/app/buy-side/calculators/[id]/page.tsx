import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import { getCalculator, oneLiner, SIDES } from "@/lib/calculators/data";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SIDES.buy.calculators.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const calc = getCalculator("buy", (await params).id);
  return calc ? { title: `${calc.name} calculator`, description: oneLiner(calc) } : {};
}

export default async function Page({ params }: Props) {
  const calc = getCalculator("buy", (await params).id);
  if (!calc) notFound();
  return <CalculatorPage side="buy" calc={calc} />;
}
