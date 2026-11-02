import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorPage } from "@/components/calculator/CalculatorPage";
import { JsonLd } from "@/components/JsonLd";
import { calculatorHref, getCalculator, oneLiner, SIDES } from "@/lib/calculators/data";
import { calculatorJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SIDES.sell.calculators.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const calc = getCalculator("sell", (await params).id);
  return calc ? pageMetadata(calculatorHref("sell", calc.id), { title: `${calc.name} calculator: formula and free tool`, description: oneLiner(calc) }) : {};
}

export default async function Page({ params }: Props) {
  const calc = getCalculator("sell", (await params).id);
  if (!calc) notFound();
  return (
    <>
      <JsonLd data={calculatorJsonLd("sell", calc)} />
      <CalculatorPage side="sell" calc={calc} />
    </>
  );
}
