"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import type { DPT } from "@/lib/dpt-data";

const PAGE_SIZE = 6;

export function DPTGrid({ items }: { items: DPT[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (current - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, current]);

  const from = items.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, items.length);

  return (
    <>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((d, i) => {
          const absoluteIndex = (current - 1) * PAGE_SIZE + i;
          return (
            <li
              key={d.slug}
              className="group relative border-b md:border-r border-tq-ink/8 last:border-b-0"
            >
              <Link
                href={`/dashboard/admin/dpt/${d.slug}`}
                className="block p-6 sm:p-7 hover:bg-tq-paper/40 transition-colors h-full"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-3xl text-tq-ink/20 tabular-nums leading-none">
                    {String(absoluteIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-tq-gold2 font-semibold ring-1 ring-tq-gold/40 bg-tq-gold/10 px-2 py-0.5 rounded-full">
                    {d.codigo}
                  </span>
                </div>

                <h3 className="font-display text-xl text-tq-ink mt-4 leading-tight group-hover:text-tq-sky transition-colors">
                  {d.titulo}
                </h3>
                <p className="text-[11px] uppercase tracking-[0.18em] text-tq-ink/55 font-medium mt-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-tq-gold2" />
                  {d.departamento}
                </p>

                <p className="mt-4 text-sm text-tq-ink/70 leading-relaxed line-clamp-3">
                  {d.objetivo}
                </p>

                <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] font-semibold">
                  <span className="text-tq-ink/45 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    {d.funciones.length} funciones
                  </span>
                  <span className="text-tq-sky group-hover:text-tq-ink transition-colors flex items-center gap-1">
                    Ver ficha
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-4 sm:px-6 py-4 border-t border-tq-ink/10 flex items-center justify-between flex-wrap gap-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-tq-ink/50 font-semibold tabular-nums">
          {from}–{to} de {items.length}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            aria-label="Página anterior"
            className="w-8 h-8 rounded-lg border border-tq-ink/15 text-tq-ink/70 flex items-center justify-center hover:border-tq-gold hover:text-tq-ink hover:shadow-tq-gold transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
            const active = n === current;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={active ? "page" : undefined}
                className={
                  "min-w-8 h-8 px-2 rounded-lg text-[12px] font-semibold tabular-nums transition-all duration-200 " +
                  (active
                    ? "bg-tq-ink text-white shadow-tq-soft"
                    : "border border-tq-ink/15 text-tq-ink/70 hover:border-tq-gold hover:text-tq-ink")
                }
              >
                {String(n).padStart(2, "0")}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            aria-label="Página siguiente"
            className="w-8 h-8 rounded-lg border border-tq-ink/15 text-tq-ink/70 flex items-center justify-center hover:border-tq-gold hover:text-tq-ink hover:shadow-tq-gold transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
