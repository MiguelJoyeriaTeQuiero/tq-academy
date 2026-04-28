// ============================================================
// TQ Academy — Tipos de base de datos
// Compatibles con @supabase/supabase-js v2 + TypeScript 5.9
// ============================================================

export type UserRol = "super_admin" | "admin_rrhh" | "manager" | "empleado";
export type LeccionTipo = "video" | "pdf" | "quiz" | "scorm";
export type TipoDestino = "usuario" | "tienda" | "departamento";
export type PlanCarreraEstado = "activo" | "pausado" | "completado" | "cancelado";

// ---- Interfaces de entidades (tipos completos de Row) ----

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRol;
  tienda_id: string | null;
  departamento_id: string | null;
  avatar_url: string | null;
  activo: boolean;
  dpt_actual_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanCarreraAsignacion {
  id: string;
  usuario_id: string;
  path_slug: string;
  asignado_por: string | null;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: PlanCarreraEstado;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanCarreraHitoProgreso {
  id: string;
  asignacion_id: string;
  hito_index: number;
  completado: boolean;
  fecha_completado: string | null;
  marcado_por: string | null;
  validado_por: string | null;
  fecha_validado: string | null;
  evidencia: string | null;
  updated_at: string;
}

export interface Tienda {
  id: string;
  nombre: string;
  isla: string;
  activo: boolean;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export interface RutaAprendizaje {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
}

export interface Curso {
  id: string;
  ruta_id: string | null;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Modulo {
  id: string;
  curso_id: string;
  titulo: string;
  orden: number;
  created_at: string;
}

export interface Leccion {
  id: string;
  modulo_id: string;
  titulo: string;
  tipo: LeccionTipo;
  contenido_url: string | null;
  duracion_minutos: number | null;
  orden: number;
  completado_minimo_pct: number;
  created_at: string;
}

export interface Asignacion {
  id: string;
  curso_id: string;
  tipo_destino: TipoDestino;
  destino_id: string;
  fecha_limite: string | null;
  obligatorio: boolean;
  created_at: string;
}

export interface ProgresoLeccion {
  id: string;
  usuario_id: string;
  leccion_id: string;
  completado: boolean;
  porcentaje: number;
  updated_at: string;
}

export interface ProgresoCurso {
  id: string;
  usuario_id: string;
  curso_id: string;
  completado: boolean;
  fecha_completado: string | null;
  porcentaje: number;
  updated_at: string;
}

// ---- Fase 2 ----

export type TipoPregunta = "test" | "verdadero_falso" | "respuesta_corta";

export interface PreguntaExamen {
  id: string;
  tipo: TipoPregunta;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: string;
}

export interface Examen {
  id: string;
  leccion_id: string;
  preguntas: PreguntaExamen[];
  nota_minima: number;
  max_intentos: number;
  tiempo_limite_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface IntentoExamen {
  id: string;
  usuario_id: string;
  examen_id: string;
  respuestas: Record<string, string>;
  nota: number | null;
  aprobado: boolean;
  duracion_seg: number | null;
  created_at: string;
}

export interface Certificado {
  id: string;
  usuario_id: string;
  curso_id: string;
  url_pdf: string | null;
  fecha_emision: string;
  codigo_verificacion: string;
}

export interface Puntos {
  id: string;
  usuario_id: string;
  puntos_total: number;
  racha_dias: number;
  ultima_actividad: string | null;
}

export interface PuntosHistorial {
  id: string;
  usuario_id: string;
  puntos: number;
  concepto: string;
  created_at: string;
}

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  condicion_tipo: string;
  condicion_valor: number;
  created_at: string;
}

export interface UsuarioInsignia {
  id: string;
  usuario_id: string;
  insignia_id: string;
  fecha_obtenida: string;
}

// ---- Fase 4: Exámenes mensuales (IA) ----

export interface ExamenMensual {
  id: string;
  curso_id: string;
  periodo: string; // 'YYYY-MM'
  titulo: string;
  preguntas: PreguntaExamen[];
  nota_minima: number;
  max_intentos: number;
  publicado: boolean;
  generado_por: "ia" | "manual";
  modelo_ia: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntentoExamenMensual {
  id: string;
  usuario_id: string;
  examen_mensual_id: string;
  respuestas: Record<string, string>;
  nota: number | null;
  aprobado: boolean;
  duracion_seg: number | null;
  created_at: string;
}

// ---- Fase 3: Notificaciones ----

export type NotificationTipo =
  | "curso_asignado"
  | "deadline_proximo"
  | "curso_completado";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface NotificationPreferences {
  usuario_id: string;
  curso_asignado: boolean;
  deadline_proximo: boolean;
  curso_completado: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  usuario_id: string;
  tipo: NotificationTipo;
  canal: "email";
  destinatario: string;
  subject: string;
  body_html: string;
  body_text: string;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  scheduled_for: string;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
  provider: string | null;
  created_at: string;
}

export type FormacionTipo =
  | "master"
  | "postgrado"
  | "grado"
  | "curso"
  | "taller"
  | "certificacion"
  | "jornada"
  | "congreso"
  | "otro";

export interface FormacionExterna {
  id: string;
  user_id: string;
  titulo: string;
  tipo: FormacionTipo;
  entidad: string | null;
  fecha_emision: string | null;
  horas: number | null;
  descripcion: string | null;
  archivo_url: string | null;
  archivo_path: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Tipos extendidos con relaciones ----

export interface CursoConProgreso extends Curso {
  progreso?: ProgresoCurso | null;
  asignacion?: Asignacion | null;
  total_lecciones?: number;
}

export interface ModuloConLecciones extends Modulo {
  lecciones: LeccionConProgreso[];
}

export interface LeccionConProgreso extends Leccion {
  progreso?: ProgresoLeccion | null;
}

export interface ProfileConRelaciones extends Profile {
  tienda?: Tienda | null;
  departamento?: Departamento | null;
}

// ---- Database type compatible con @supabase/supabase-js v2 ----
// IMPORTANTE: Los Insert/Update son tipos explícitos (no Omit<>) para
// evitar problemas de inferencia en TypeScript 5.9+ strict mode.
// Row types use `& Record<string, unknown>` so that named interfaces satisfy
// the GenericTable constraint (Record<string, unknown>) in @supabase/postgrest-js.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile & Record<string, unknown>;
        Insert: {
          id: string;
          email: string;
          nombre?: string;
          apellido?: string;
          rol?: UserRol;
          tienda_id?: string | null;
          departamento_id?: string | null;
          avatar_url?: string | null;
          activo?: boolean;
          dpt_actual_slug?: string | null;
        };
        Update: {
          email?: string;
          nombre?: string;
          apellido?: string;
          rol?: UserRol;
          tienda_id?: string | null;
          departamento_id?: string | null;
          avatar_url?: string | null;
          activo?: boolean;
          dpt_actual_slug?: string | null;
        };
        Relationships: [];
      };
      tiendas: {
        Row: Tienda & Record<string, unknown>;
        Insert: {
          id?: string;
          nombre: string;
          isla: string;
          activo?: boolean;
          direccion?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: {
          nombre?: string;
          isla?: string;
          activo?: boolean;
          direccion?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Relationships: [];
      };
      departamentos: {
        Row: Departamento & Record<string, unknown>;
        Insert: {
          id?: string;
          nombre: string;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          activo?: boolean;
        };
        Relationships: [];
      };
      rutas_aprendizaje: {
        Row: RutaAprendizaje & Record<string, unknown>;
        Insert: {
          id?: string;
          titulo: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          activo?: boolean;
        };
        Update: {
          titulo?: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      cursos: {
        Row: Curso & Record<string, unknown>;
        Insert: {
          id?: string;
          ruta_id?: string | null;
          titulo: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          orden?: number;
          activo?: boolean;
        };
        Update: {
          ruta_id?: string | null;
          titulo?: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          orden?: number;
          activo?: boolean;
        };
        Relationships: [];
      };
      modulos: {
        Row: Modulo & Record<string, unknown>;
        Insert: {
          id?: string;
          curso_id: string;
          titulo: string;
          orden?: number;
        };
        Update: {
          titulo?: string;
          orden?: number;
        };
        Relationships: [];
      };
      lecciones: {
        Row: Leccion & Record<string, unknown>;
        Insert: {
          id?: string;
          modulo_id: string;
          titulo: string;
          tipo?: LeccionTipo;
          contenido_url?: string | null;
          duracion_minutos?: number | null;
          orden?: number;
          completado_minimo_pct?: number;
        };
        Update: {
          titulo?: string;
          tipo?: LeccionTipo;
          contenido_url?: string | null;
          duracion_minutos?: number | null;
          orden?: number;
          completado_minimo_pct?: number;
        };
        Relationships: [];
      };
      asignaciones: {
        Row: Asignacion & Record<string, unknown>;
        Insert: {
          id?: string;
          curso_id: string;
          tipo_destino: TipoDestino;
          destino_id: string;
          fecha_limite?: string | null;
          obligatorio?: boolean;
        };
        Update: {
          fecha_limite?: string | null;
          obligatorio?: boolean;
        };
        Relationships: [];
      };
      progreso_lecciones: {
        Row: ProgresoLeccion & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          leccion_id: string;
          completado?: boolean;
          porcentaje?: number;
        };
        Update: {
          completado?: boolean;
          porcentaje?: number;
        };
        Relationships: [];
      };
      progreso_cursos: {
        Row: ProgresoCurso & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          curso_id: string;
          completado?: boolean;
          fecha_completado?: string | null;
          porcentaje?: number;
        };
        Update: {
          completado?: boolean;
          fecha_completado?: string | null;
          porcentaje?: number;
        };
        Relationships: [];
      };
      examenes: {
        Row: Examen & Record<string, unknown>;
        Insert: {
          id?: string;
          leccion_id: string;
          preguntas?: PreguntaExamen[];
          nota_minima?: number;
          max_intentos?: number;
          tiempo_limite_min?: number | null;
        };
        Update: {
          preguntas?: PreguntaExamen[];
          nota_minima?: number;
          max_intentos?: number;
          tiempo_limite_min?: number | null;
        };
        Relationships: [];
      };
      intentos_examen: {
        Row: IntentoExamen & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          examen_id: string;
          respuestas?: Record<string, string>;
          nota?: number | null;
          aprobado?: boolean;
          duracion_seg?: number | null;
        };
        Update: {
          nota?: number | null;
          aprobado?: boolean;
        };
        Relationships: [];
      };
      certificados: {
        Row: Certificado & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          curso_id: string;
          url_pdf?: string | null;
          fecha_emision?: string;
          codigo_verificacion?: string;
        };
        Update: {
          url_pdf?: string | null;
        };
        Relationships: [];
      };
      puntos: {
        Row: Puntos & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          puntos_total?: number;
          racha_dias?: number;
          ultima_actividad?: string | null;
        };
        Update: {
          puntos_total?: number;
          racha_dias?: number;
          ultima_actividad?: string | null;
        };
        Relationships: [];
      };
      puntos_historial: {
        Row: PuntosHistorial & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          puntos: number;
          concepto: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      insignias: {
        Row: Insignia & Record<string, unknown>;
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          condicion_tipo: string;
          condicion_valor?: number;
        };
        Update: {
          nombre?: string;
          descripcion?: string | null;
          imagen_url?: string | null;
          condicion_tipo?: string;
          condicion_valor?: number;
        };
        Relationships: [];
      };
      usuario_insignias: {
        Row: UsuarioInsignia & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          insignia_id: string;
          fecha_obtenida?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      examenes_mensuales: {
        Row: ExamenMensual & Record<string, unknown>;
        Insert: {
          id?: string;
          curso_id: string;
          periodo: string;
          titulo: string;
          preguntas?: PreguntaExamen[];
          nota_minima?: number;
          max_intentos?: number;
          publicado?: boolean;
          generado_por?: "ia" | "manual";
          modelo_ia?: string | null;
        };
        Update: {
          titulo?: string;
          preguntas?: PreguntaExamen[];
          nota_minima?: number;
          max_intentos?: number;
          publicado?: boolean;
          modelo_ia?: string | null;
        };
        Relationships: [];
      };
      intentos_examen_mensual: {
        Row: IntentoExamenMensual & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          examen_mensual_id: string;
          respuestas?: Record<string, string>;
          nota?: number | null;
          aprobado?: boolean;
          duracion_seg?: number | null;
        };
        Update: {
          nota?: number | null;
          aprobado?: boolean;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferences & Record<string, unknown>;
        Insert: {
          usuario_id: string;
          curso_asignado?: boolean;
          deadline_proximo?: boolean;
          curso_completado?: boolean;
        };
        Update: {
          curso_asignado?: boolean;
          deadline_proximo?: boolean;
          curso_completado?: boolean;
        };
        Relationships: [];
      };
      formaciones_externas: {
        Row: FormacionExterna & Record<string, unknown>;
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          tipo: FormacionTipo;
          entidad?: string | null;
          fecha_emision?: string | null;
          horas?: number | null;
          descripcion?: string | null;
          archivo_url?: string | null;
          archivo_path?: string | null;
        };
        Update: {
          titulo?: string;
          tipo?: FormacionTipo;
          entidad?: string | null;
          fecha_emision?: string | null;
          horas?: number | null;
          descripcion?: string | null;
          archivo_url?: string | null;
          archivo_path?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: Notification & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          tipo: NotificationTipo;
          canal?: "email";
          destinatario: string;
          subject: string;
          body_html: string;
          body_text: string;
          metadata?: Record<string, unknown>;
          status?: NotificationStatus;
          scheduled_for?: string;
        };
        Update: {
          status?: NotificationStatus;
          sent_at?: string | null;
          attempts?: number;
          last_error?: string | null;
          provider?: string | null;
        };
        Relationships: [];
      };
      plan_carrera_asignaciones: {
        Row: PlanCarreraAsignacion & Record<string, unknown>;
        Insert: {
          id?: string;
          usuario_id: string;
          path_slug: string;
          asignado_por?: string | null;
          fecha_inicio?: string;
          fecha_objetivo?: string | null;
          estado?: PlanCarreraEstado;
          notas?: string | null;
        };
        Update: {
          path_slug?: string;
          fecha_inicio?: string;
          fecha_objetivo?: string | null;
          estado?: PlanCarreraEstado;
          notas?: string | null;
        };
        Relationships: [];
      };
      plan_carrera_hito_progreso: {
        Row: PlanCarreraHitoProgreso & Record<string, unknown>;
        Insert: {
          id?: string;
          asignacion_id: string;
          hito_index: number;
          completado?: boolean;
          fecha_completado?: string | null;
          marcado_por?: string | null;
          validado_por?: string | null;
          fecha_validado?: string | null;
          evidencia?: string | null;
        };
        Update: {
          completado?: boolean;
          fecha_completado?: string | null;
          marcado_por?: string | null;
          validado_por?: string | null;
          fecha_validado?: string | null;
          evidencia?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      user_rol: UserRol;
      leccion_tipo: LeccionTipo;
      tipo_destino: TipoDestino;
      plan_carrera_estado: PlanCarreraEstado;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
