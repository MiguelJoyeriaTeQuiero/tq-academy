import { notFound } from "next/navigation";
import { CareerPathDetail } from "@/components/career/career-path-detail";
import { getPath } from "@/lib/career-paths";
import { getMiAsignacion } from "@/lib/career-paths-server";

export const dynamic = "force-dynamic";

export default async function MiCarreraPlanPage({
  params,
}: {
  params: { slug: string };
}) {
  const plan = getPath(params.slug);
  if (!plan) notFound();

  const data = await getMiAsignacion(params.slug);

  return (
    <CareerPathDetail
      plan={plan}
      mode="empleado"
      asignacion={data?.asignacion ?? null}
      progresoHitos={data?.hitos ?? null}
      progresoPct={data?.progresoPct}
    />
  );
}
