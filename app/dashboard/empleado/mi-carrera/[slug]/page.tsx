import { notFound } from "next/navigation";
import { CareerPathDetail } from "@/components/career/career-path-detail";
import { CAREER_PATHS, getPath } from "@/lib/career-paths";

export function generateStaticParams() {
  return CAREER_PATHS.map((p) => ({ slug: p.slug }));
}

export default function MiCarreraPlanPage({
  params,
}: {
  params: { slug: string };
}) {
  const plan = getPath(params.slug);
  if (!plan) notFound();
  return <CareerPathDetail plan={plan} mode="empleado" />;
}
