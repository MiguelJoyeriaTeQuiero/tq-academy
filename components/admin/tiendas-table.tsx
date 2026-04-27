"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface TiendaRow {
  id: string;
  nombre: string;
  isla: string;
  activo: boolean;
  lat: number | null;
  lng: number | null;
}

const PAGE_SIZE = 5;

export function TiendasTable({ tiendas }: { tiendas: TiendaRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tiendas.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return tiendas.slice(start, start + PAGE_SIZE);
  }, [tiendas, safePage]);

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Isla</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiendas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-6"
              >
                Sin tiendas
              </TableCell>
            </TableRow>
          ) : (
            slice.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell>{t.isla}</TableCell>
                <TableCell>
                  {t.lat != null && t.lng != null ? (
                    <span className="inline-flex items-center gap-1 text-xs text-tq-sky">
                      <MapPin className="w-3 h-3" /> Geo
                    </span>
                  ) : (
                    <span className="text-xs text-tq-ink/40">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      t.activo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {t.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {tiendas.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-tq-ink/10 bg-tq-paper/40">
          <p className="text-xs text-tq-ink/60">
            Página <span className="font-semibold text-tq-ink">{safePage}</span> de{" "}
            {totalPages} ·{" "}
            <span className="text-tq-ink/40">
              {tiendas.length} {tiendas.length === 1 ? "tienda" : "tiendas"}
            </span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-8 px-2.5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
