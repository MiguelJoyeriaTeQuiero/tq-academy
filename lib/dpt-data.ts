// ─────────────────────────────────────────────────────────────
//  Descripciones de Puesto de Trabajo (DPT) — Te Quiero Group
//  Fuente: manuales oficiales elaborados por Trilex
// ─────────────────────────────────────────────────────────────

export interface DPTRelaciones {
  internas: string[];
  externas: string[];
}

export interface DPTFuncion {
  titulo: string;
  detalle: string;
}

export interface DPTCompetenciaTea {
  area: string;
  competencia: string;
  nivel: "Bajo" | "Medio" | "Medio-Alto" | "Alto" | "Muy Alto";
  justificacion: string;
}

export interface DPTRequisitos {
  formacion: string[];
  experiencia: string[];
  idiomas?: string[];
  herramientas?: string[];
  otros?: string[];
}

export interface DPT {
  slug: string;
  codigo: string;
  titulo: string;
  departamento: string;
  reportaA: string;
  ubicacion: string;
  jornada: string;
  objetivo: string;
  funciones: DPTFuncion[];
  relaciones: DPTRelaciones;
  competenciasTecnicas: string[];
  competenciasTea: DPTCompetenciaTea[];
  requisitos: DPTRequisitos;
  oportunidades: string[];
  pdfUrl?: string;
}

export const DPTS: DPT[] = [
  {
    slug: "responsable-it",
    codigo: "JTQIT01",
    titulo: "Responsable IT",
    departamento: "Tecnología y Sistemas",
    reportaA: "Dirección General",
    ubicacion: "Sede central",
    jornada: "Completa",
    objetivo:
      "Garantizar el correcto funcionamiento, evolución y seguridad de los sistemas tecnológicos del grupo, alineando las decisiones IT con la estrategia de negocio y asegurando un soporte ágil y fiable a todas las áreas operativas.",
    funciones: [
      {
        titulo: "Infraestructura y sistemas",
        detalle:
          "Supervisar la red, servidores, dispositivos y conectividad de tiendas y oficinas, garantizando disponibilidad y rendimiento.",
      },
      {
        titulo: "Soporte técnico",
        detalle:
          "Coordinar la resolución de incidencias y peticiones de los equipos, priorizando el impacto en la operativa de tienda.",
      },
      {
        titulo: "Proyectos tecnológicos",
        detalle:
          "Liderar la implantación de nuevas herramientas (ERP, CRM, ecommerce, LMS) y sus integraciones con los sistemas existentes.",
      },
      {
        titulo: "Ciberseguridad y compliance",
        detalle:
          "Definir políticas de seguridad, copias de seguridad, control de accesos y protección de datos en cumplimiento del RGPD.",
      },
      {
        titulo: "Gestión de proveedores",
        detalle:
          "Negociar y supervisar contratos con partners tecnológicos, asegurando calidad de servicio y control de costes.",
      },
      {
        titulo: "Formación interna",
        detalle:
          "Capacitar a los equipos en el uso de las herramientas digitales y promover una cultura de uso responsable de la tecnología.",
      },
    ],
    relaciones: {
      internas: [
        "Dirección General",
        "People & Culture",
        "Operaciones y red de tiendas",
        "Marketing y ecommerce",
        "Administración y finanzas",
      ],
      externas: [
        "Proveedores de software (ERP, CRM, LMS)",
        "Operadores de telecomunicaciones",
        "Partners de hardware y mantenimiento",
        "Consultores de ciberseguridad",
      ],
    },
    competenciasTecnicas: [
      "Administración de redes y servidores",
      "Gestión de ERP y sistemas de gestión retail",
      "Integraciones API y automatización de procesos",
      "Ciberseguridad y RGPD",
      "Gestión de proyectos IT",
      "Cloud (Azure / AWS / Google Cloud)",
    ],
    competenciasTea: [
      {
        area: "Intrapersonal",
        competencia: "Estabilidad emocional",
        nivel: "Alto",
        justificacion:
          "Gestiona incidencias críticas y picos de carga sin perder foco ni claridad.",
      },
      {
        area: "Interpersonal",
        competencia: "Comunicación",
        nivel: "Medio-Alto",
        justificacion:
          "Traduce conceptos técnicos a lenguaje de negocio para todos los equipos.",
      },
      {
        area: "Desarrollo de tareas",
        competencia: "Iniciativa",
        nivel: "Alto",
        justificacion:
          "Anticipa riesgos y propone mejoras antes de que aparezcan los problemas.",
      },
      {
        area: "Entorno",
        competencia: "Visión global",
        nivel: "Alto",
        justificacion:
          "Conecta la tecnología con los objetivos de marca, retail y ecommerce.",
      },
      {
        area: "Gerenciales",
        competencia: "Liderazgo",
        nivel: "Medio-Alto",
        justificacion:
          "Coordina equipos internos y proveedores externos con criterio.",
      },
    ],
    requisitos: {
      formacion: [
        "Grado en Ingeniería Informática, Telecomunicaciones o similar",
        "Formación complementaria en ciberseguridad y gestión de proyectos",
      ],
      experiencia: [
        "Mínimo 5 años en posiciones similares",
        "Experiencia previa en retail o entornos multi-tienda valorable",
      ],
      idiomas: ["Inglés técnico (lectura y conversación)"],
      herramientas: [
        "ERP retail",
        "Suite Microsoft 365 / Google Workspace",
        "Plataformas cloud",
        "Sistemas de tickets y monitorización",
      ],
      otros: [
        "Disponibilidad puntual fuera de horario para incidencias críticas",
        "Carnet de conducir B",
      ],
    },
    oportunidades: [
      "Liderar la transformación digital del grupo",
      "Diseñar la arquitectura tecnológica de los próximos años",
      "Acompañar la expansión a nuevos canales y mercados",
    ],
  },
  {
    slug: "manager-regional",
    codigo: "JTQREG01",
    titulo: "Manager Regional",
    departamento: "Operaciones · Red de tiendas",
    reportaA: "Dirección de Operaciones",
    ubicacion: "Región asignada",
    jornada: "Completa con desplazamientos",
    objetivo:
      "Liderar la operativa, los resultados comerciales y el desarrollo de personas de un conjunto de zonas, asegurando la coherencia con la estrategia del grupo y la excelencia en la experiencia Te Quiero.",
    funciones: [
      {
        titulo: "Resultados de negocio",
        detalle:
          "Supervisar ventas, márgenes, KPIs y plan comercial de las zonas a su cargo, proponiendo planes de acción.",
      },
      {
        titulo: "Liderazgo de equipos",
        detalle:
          "Acompañar y desarrollar a los Managers de Zona, evaluando desempeño y plan de carrera.",
      },
      {
        titulo: "Excelencia operativa",
        detalle:
          "Garantizar el cumplimiento de procesos, estándares de marca, visual merchandising y experiencia de cliente.",
      },
      {
        titulo: "Expansión y aperturas",
        detalle:
          "Participar en la apertura, traslado o reforma de tiendas en su región, junto a Operaciones y Expansión.",
      },
      {
        titulo: "Reporting y análisis",
        detalle:
          "Elaborar informes periódicos a Dirección con análisis cualitativo y cuantitativo de la región.",
      },
    ],
    relaciones: {
      internas: [
        "Dirección de Operaciones",
        "Managers de Zona",
        "Equipos de tienda",
        "People & Culture",
        "Marketing y Visual",
        "Compras y Producto",
      ],
      externas: [
        "Centros comerciales y propiedades",
        "Proveedores de servicios locales",
        "Clientes VIP de la región",
      ],
    },
    competenciasTecnicas: [
      "Gestión retail multi-tienda",
      "Análisis de KPIs y P&L de tienda",
      "Visual merchandising y estándares de marca",
      "Planificación comercial y campañas",
      "Gestión y desarrollo de equipos",
    ],
    competenciasTea: [
      {
        area: "Gerenciales",
        competencia: "Liderazgo",
        nivel: "Muy Alto",
        justificacion:
          "Inspira y dirige a múltiples managers de zona y sus equipos.",
      },
      {
        area: "Interpersonal",
        competencia: "Influencia",
        nivel: "Alto",
        justificacion:
          "Moviliza a los equipos hacia los objetivos de marca y negocio.",
      },
      {
        area: "Desarrollo de tareas",
        competencia: "Orientación a resultados",
        nivel: "Muy Alto",
        justificacion:
          "Trabaja con foco constante en KPIs y mejora continua.",
      },
      {
        area: "Entorno",
        competencia: "Visión estratégica",
        nivel: "Alto",
        justificacion:
          "Conecta la operativa diaria con la estrategia del grupo.",
      },
      {
        area: "Intrapersonal",
        competencia: "Resiliencia",
        nivel: "Alto",
        justificacion:
          "Sostiene el ritmo en contextos de cambio y alta exigencia.",
      },
    ],
    requisitos: {
      formacion: [
        "Grado en ADE, Marketing, Empresariales o similar",
        "Formación específica en retail o liderazgo valorable",
      ],
      experiencia: [
        "Mínimo 5-7 años en posiciones de mando intermedio en retail",
        "Experiencia previa gestionando varias tiendas a la vez",
      ],
      idiomas: ["Castellano nativo", "Inglés intermedio valorable"],
      herramientas: [
        "ERP retail",
        "Excel avanzado",
        "Herramientas de BI / dashboards",
      ],
      otros: [
        "Disponibilidad para viajar dentro de la región",
        "Carnet de conducir B",
      ],
    },
    oportunidades: [
      "Promoción a Dirección de Operaciones",
      "Participación en proyectos transversales del grupo",
      "Formación continua en liderazgo y gestión",
    ],
  },
  {
    slug: "manager-zona",
    codigo: "JTQZON01",
    titulo: "Manager de Zona",
    departamento: "Operaciones · Red de tiendas",
    reportaA: "Manager Regional",
    ubicacion: "Zona asignada",
    jornada: "Completa con desplazamientos",
    objetivo:
      "Asegurar el desempeño comercial y operativo de las tiendas de su zona, acompañando a los equipos en su día a día y trasladando con coherencia la cultura y los estándares Te Quiero.",
    funciones: [
      {
        titulo: "Acompañamiento a tiendas",
        detalle:
          "Visitar regularmente las tiendas, observar la operativa y dar feedback estructurado a los equipos.",
      },
      {
        titulo: "Cumplimiento de objetivos",
        detalle:
          "Hacer seguimiento de ventas, ticket medio, conversión y otros KPIs, definiendo planes de mejora.",
      },
      {
        titulo: "Estándares de marca",
        detalle:
          "Velar por la imagen, el visual merchandising y la experiencia de cliente en toda la zona.",
      },
      {
        titulo: "Desarrollo de equipos",
        detalle:
          "Detectar talento, acompañar a los responsables de tienda y proponer planes de formación con People & Culture.",
      },
      {
        titulo: "Gestión operativa",
        detalle:
          "Coordinar inventarios, stock, dotación de personal y resolución de incidencias.",
      },
    ],
    relaciones: {
      internas: [
        "Manager Regional",
        "Equipos de tienda",
        "People & Culture",
        "Visual y Marketing",
        "Logística y Stock",
      ],
      externas: [
        "Centros comerciales",
        "Proveedores locales",
        "Clientes finales",
      ],
    },
    competenciasTecnicas: [
      "Gestión retail",
      "Análisis básico de KPIs de tienda",
      "Visual merchandising",
      "Coaching y feedback a equipos",
      "Gestión de inventario y stock",
    ],
    competenciasTea: [
      {
        area: "Gerenciales",
        competencia: "Liderazgo",
        nivel: "Alto",
        justificacion:
          "Acompaña a varios equipos de tienda en su día a día.",
      },
      {
        area: "Interpersonal",
        competencia: "Comunicación",
        nivel: "Alto",
        justificacion:
          "Traslada mensajes claros y motivadores entre dirección y tienda.",
      },
      {
        area: "Desarrollo de tareas",
        competencia: "Orientación a resultados",
        nivel: "Alto",
        justificacion:
          "Trabaja con foco en KPIs y mejora continua de la zona.",
      },
      {
        area: "Intrapersonal",
        competencia: "Autoexigencia",
        nivel: "Medio-Alto",
        justificacion:
          "Mantiene el ritmo y los estándares aún en jornadas intensas.",
      },
      {
        area: "Entorno",
        competencia: "Visión global",
        nivel: "Medio-Alto",
        justificacion:
          "Entiende cómo cada tienda contribuye al resultado de la zona.",
      },
    ],
    requisitos: {
      formacion: [
        "Grado o ciclo formativo en gestión comercial, ADE o similar",
        "Formación en liderazgo o retail valorable",
      ],
      experiencia: [
        "Mínimo 3-5 años como responsable de tienda o multitienda",
      ],
      idiomas: ["Castellano nativo"],
      herramientas: ["ERP retail", "Excel", "Herramientas de reporting"],
      otros: [
        "Disponibilidad para desplazarse a las tiendas de la zona",
        "Carnet de conducir B",
      ],
    },
    oportunidades: [
      "Promoción a Manager Regional",
      "Participación en proyectos de apertura y formación",
      "Plan de desarrollo individual con People & Culture",
    ],
  },
  {
    slug: "director-people-culture",
    codigo: "JTQPEO01",
    titulo: "Director/a People & Culture",
    departamento: "People & Culture",
    reportaA: "Dirección General",
    ubicacion: "Sede central",
    jornada: "Completa",
    objetivo:
      "Diseñar y liderar la estrategia de personas y cultura del grupo, atrayendo, desarrollando y fidelizando talento alineado con los valores Te Quiero, y haciendo de la marca empleadora una ventaja competitiva.",
    funciones: [
      {
        titulo: "Estrategia de personas",
        detalle:
          "Definir el plan de People & Culture en línea con la estrategia del grupo: organización, talento, cultura y comunicación interna.",
      },
      {
        titulo: "Atracción y selección",
        detalle:
          "Liderar la marca empleadora y los procesos de selección clave para tienda, oficina y dirección.",
      },
      {
        titulo: "Desarrollo y formación",
        detalle:
          "Impulsar la TQ Academy, los planes de carrera, evaluación de desempeño y programas de liderazgo.",
      },
      {
        titulo: "Cultura y experiencia de empleado",
        detalle:
          "Velar por una cultura coherente, inclusiva y conectada con la marca, midiendo clima y experiencia.",
      },
      {
        titulo: "Compensación y políticas",
        detalle:
          "Definir la política retributiva, beneficios y políticas internas, en colaboración con Dirección General.",
      },
      {
        titulo: "Cumplimiento y relaciones laborales",
        detalle:
          "Garantizar el cumplimiento legal y mantener relaciones constructivas con representación legal de las personas trabajadoras.",
      },
    ],
    relaciones: {
      internas: [
        "Dirección General",
        "Comité de Dirección",
        "Operaciones y red de tiendas",
        "Finanzas y Administración",
        "IT",
      ],
      externas: [
        "Asesoría laboral y legal",
        "Consultoras de selección y formación",
        "Universidades y escuelas de negocio",
        "Proveedores de beneficios sociales",
      ],
    },
    competenciasTecnicas: [
      "Estrategia de RRHH y People Analytics",
      "Selección por competencias",
      "Desarrollo organizacional y planes de carrera",
      "Compensación y beneficios",
      "Derecho laboral y relaciones colectivas",
      "Comunicación interna y employer branding",
    ],
    competenciasTea: [
      {
        area: "Gerenciales",
        competencia: "Liderazgo estratégico",
        nivel: "Muy Alto",
        justificacion:
          "Lidera el área que sostiene la cultura y el talento del grupo.",
      },
      {
        area: "Interpersonal",
        competencia: "Influencia",
        nivel: "Muy Alto",
        justificacion:
          "Trabaja con todo el comité de dirección y representa a las personas.",
      },
      {
        area: "Intrapersonal",
        competencia: "Integridad",
        nivel: "Muy Alto",
        justificacion:
          "Custodia información sensible y decisiones de alto impacto humano.",
      },
      {
        area: "Entorno",
        competencia: "Visión estratégica",
        nivel: "Muy Alto",
        justificacion:
          "Conecta personas, cultura y negocio a medio y largo plazo.",
      },
      {
        area: "Desarrollo de tareas",
        competencia: "Planificación",
        nivel: "Alto",
        justificacion:
          "Despliega planes anuales y proyectos transversales complejos.",
      },
    ],
    requisitos: {
      formacion: [
        "Grado en Psicología, Derecho, ADE o similar",
        "Máster en Dirección de RRHH / People Analytics",
      ],
      experiencia: [
        "Mínimo 8-10 años en RRHH, con al menos 3 en posición directiva",
        "Experiencia en retail, multi-centro o gran distribución",
      ],
      idiomas: ["Inglés nivel alto"],
      herramientas: [
        "HRIS / suites de RRHH",
        "LMS y plataformas de formación",
        "Herramientas de evaluación y clima",
      ],
      otros: ["Disponibilidad para viajar puntualmente"],
    },
    oportunidades: [
      "Formar parte del Comité de Dirección",
      "Liderar la transformación cultural del grupo",
      "Impulsar la TQ Academy como referente sectorial",
    ],
  },
  {
    slug: "dependiente",
    codigo: "JTQDEP01",
    titulo: "Dependiente/a de tienda",
    departamento: "Operaciones · Tienda",
    reportaA: "Responsable de tienda",
    ubicacion: "Tienda asignada",
    jornada: "Según contrato (completa o parcial)",
    objetivo:
      "Ser la cara visible de Te Quiero en tienda: acompañar al cliente con cercanía y criterio, transmitir el valor de cada pieza y contribuir al ambiente cálido y profesional que caracteriza a la marca.",
    funciones: [
      {
        titulo: "Atención al cliente",
        detalle:
          "Recibir, asesorar y acompañar al cliente durante toda su visita, ofreciendo una experiencia coherente con la marca.",
      },
      {
        titulo: "Venta y asesoramiento",
        detalle:
          "Conocer el producto y las campañas vigentes para hacer recomendaciones personalizadas y cerrar la venta.",
      },
      {
        titulo: "Cuidado de la tienda",
        detalle:
          "Mantener la limpieza, el orden y los estándares de visual merchandising en su zona de trabajo.",
      },
      {
        titulo: "Caja y cobro",
        detalle:
          "Gestionar el cobro, devoluciones y operaciones de caja con precisión, siguiendo los procedimientos establecidos.",
      },
      {
        titulo: "Reposición y stock",
        detalle:
          "Apoyar en la recepción, etiquetado, reposición y control de stock de las piezas en tienda.",
      },
      {
        titulo: "Postventa y fidelización",
        detalle:
          "Acompañar al cliente tras la compra (arreglos, garantías, recordatorios) reforzando el vínculo con la marca.",
      },
    ],
    relaciones: {
      internas: [
        "Responsable de tienda",
        "Compañeros/as de tienda",
        "Manager de Zona",
        "Atención al cliente central",
      ],
      externas: ["Clientes finales", "Proveedores de servicios en tienda"],
    },
    competenciasTecnicas: [
      "Conocimiento de producto (joyería, relojería, accesorios)",
      "Técnicas de venta y atención al cliente",
      "Manejo de TPV y caja",
      "Visual merchandising básico",
      "Gestión de stock y etiquetado",
    ],
    competenciasTea: [
      {
        area: "Interpersonal",
        competencia: "Empatía",
        nivel: "Muy Alto",
        justificacion:
          "El cliente busca cercanía y escucha en momentos importantes (regalos, celebraciones).",
      },
      {
        area: "Interpersonal",
        competencia: "Comunicación",
        nivel: "Alto",
        justificacion:
          "Asesora con claridad, calidez y conocimiento de producto.",
      },
      {
        area: "Desarrollo de tareas",
        competencia: "Orientación al cliente",
        nivel: "Muy Alto",
        justificacion:
          "Cada interacción es una oportunidad de fidelizar y representar la marca.",
      },
      {
        area: "Intrapersonal",
        competencia: "Responsabilidad",
        nivel: "Alto",
        justificacion:
          "Maneja productos de alto valor y operaciones de caja.",
      },
      {
        area: "Entorno",
        competencia: "Trabajo en equipo",
        nivel: "Alto",
        justificacion:
          "La tienda funciona como un equipo coordinado todo el día.",
      },
    ],
    requisitos: {
      formacion: [
        "ESO o equivalente",
        "Ciclo formativo en comercio o similar valorable",
      ],
      experiencia: [
        "Experiencia previa en venta asistida o atención al cliente valorable",
        "Sensibilidad por el producto cuidado (joyería, moda, lujo accesible)",
      ],
      idiomas: ["Castellano fluido", "Otros idiomas valorables según ubicación"],
      herramientas: ["TPV", "Sistemas básicos de gestión de tienda"],
      otros: ["Disponibilidad para trabajar en horario comercial y fines de semana"],
    },
    oportunidades: [
      "Plan de carrera hacia Responsable de tienda",
      "Formación continua en TQ Academy",
      "Participación en campañas y eventos especiales",
    ],
  },

  // ── Director de Producto ──────────────────────────────────
  {
    slug: "director-producto",
    codigo: "JTQPRO06",
    titulo: "Director/a de Producto",
    departamento: "Producto",
    reportaA: "Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Liderar la planificación, mix y calendario comercial del producto, asegurando rentabilidad, rotación y coherencia de marca a lo largo de todo el ciclo de vida.",
    funciones: [
      { titulo: "Reporting y BI", detalle: "Explota Power BI y construye los KPIs de producto, ventas y rotación." },
      { titulo: "Inventario y Shopify", detalle: "Mantiene actualizados los inventarios y catálogos en Shopify." },
      { titulo: "Pedidos a tiendas", detalle: "Gestiona pedidos, traspasos y disponibilidad por punto de venta." },
      { titulo: "Calendario comercial", detalle: "Diseña el calendario y briefa campañas con 6 meses de antelación." },
      { titulo: "Importación China", detalle: "Coordina importación, aduanas, contraste y proveedores estratégicos." },
      { titulo: "Analytics y CRM", detalle: "Cruza datos de Google Analytics y Brevo para decisiones de mix." },
      { titulo: "Gestión de equipo", detalle: "Lidera al equipo de producto y coordina con marketing y retail." },
    ],
    relaciones: {
      internas: ["Producto", "Marketing", "Retail", "Logística", "IT", "Dirección", "Atención al cliente", "Finanzas"],
      externas: ["Agencia web", "Proveedores China", "Laboratorio de contraste", "Aduanas", "Partners de herramientas"],
    },
    competenciasTecnicas: [
      "Business Intelligence (Power BI)",
      "Excel avanzado",
      "Shopify",
      "Planificación comercial",
      "Category management",
      "Google Analytics",
      "KPIs y reporting",
      "CRM (Brevo)",
    ],
    competenciasTea: [
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Muy Alto", justificacion: "Articula visión de producto a equipos y dirección." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Coordina con marketing, retail y logística diariamente." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Muy Alto", justificacion: "El mix y rotación son medibles y críticos." },
      { area: "Desarrollo de tareas", competencia: "Análisis", nivel: "Muy Alto", justificacion: "Decisiones basadas en BI, ventas y rotación." },
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Muy Alto", justificacion: "Calendarios comerciales con 6 meses de antelación." },
      { area: "Dirección", competencia: "Dirección", nivel: "Muy Alto", justificacion: "Lidera y prioriza el área de producto." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Muy Alto", justificacion: "Conduce equipo y referentes externos." },
    ],
    requisitos: {
      formacion: ["CFGS Administración / Marketing o Grado en ADE"],
      experiencia: ["3-5 años en producto, retail o BI"],
      idiomas: ["Inglés B2"],
      herramientas: ["Excel", "Power BI", "Shopify", "Google Analytics", "Brevo"],
    },
    oportunidades: [
      "Head of Product",
      "Chief Product Officer",
      "Dirección de Operaciones Comerciales",
      "Liderar expansión internacional",
    ],
  },

  // ── Director Financiero ───────────────────────────────────
  {
    slug: "director-financiero",
    codigo: "JTQFIN01",
    titulo: "Director/a Financiero/a",
    departamento: "Finanzas",
    reportaA: "Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Garantizar la estabilidad financiera del grupo gestionando tesorería, financiación, control y cumplimiento, y alimentando la toma de decisiones con información rigurosa.",
    funciones: [
      { titulo: "Tesorería diaria", detalle: "Sigue cotización del oro, posiciones bancarias, confirming y pagos." },
      { titulo: "Financiación y deuda", detalle: "Gestiona deuda Renovatio, Cramixa y TQM; pool bancario y RIC." },
      { titulo: "Cash-flow y control", detalle: "Mantiene cash-flow de 430 líneas y cuadros de mando con KPIs." },
      { titulo: "Reporting y BI", detalle: "Explota Metabase, A3ERP y Power BI para dirección." },
      { titulo: "Seguros y riesgos", detalle: "Coordina pólizas de las 3 sociedades y ciberseguridad (ELANTIA)." },
      { titulo: "Cumplimiento", detalle: "PBC, libros policiales, LEI, INE, transparencia y auditorías." },
      { titulo: "Subvenciones y fiscalidad", detalle: "Identifica y materializa ayudas, RIC y optimización fiscal." },
      { titulo: "Energía y proveedores", detalle: "Negocia tarifas eléctricas y proveedores estratégicos." },
    ],
    relaciones: {
      internas: ["Dirección", "Contabilidad", "People & Culture", "IT", "Marketing", "Producto", "Taller", "Managers de zona", "JTQ / TQM / Cramixa"],
      externas: ["Bancos (Cajasiete, CaixaBank, Bankinter)", "Aplázame", "Corredurías", "PBC", "Auditoría", "Asesoría fiscal", "Administraciones", "Notarías", "INE", "SAR", "Eléctricas", "Loomis", "Proveedores estratégicos", "A3ERP / Metabase"],
    },
    competenciasTecnicas: [
      "Planificación financiera",
      "Tesorería y banca",
      "Contabilidad y fiscalidad",
      "Reporting y presupuesto",
      "Financiación corporativa",
      "Auditoría y PBC",
      "Seguros y RIC",
      "Excel · Power BI · A3ERP · Metabase",
    ],
    competenciasTea: [
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Muy Alto", justificacion: "Interlocutor con dirección, banca y auditores." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Coordina áreas críticas del grupo." },
      { area: "Desarrollo de tareas", competencia: "Análisis", nivel: "Muy Alto", justificacion: "Decisiones financieras de alto impacto." },
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Muy Alto", justificacion: "Cash-flow y presupuestos plurianuales." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Muy Alto", justificacion: "Garantiza estabilidad y rentabilidad." },
      { area: "Dirección", competencia: "Dirección", nivel: "Muy Alto", justificacion: "Lidera el área financiera del grupo." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Muy Alto", justificacion: "Influye en decisiones estratégicas." },
      { area: "Intrapersonal", competencia: "Toma de decisiones", nivel: "Muy Alto", justificacion: "Decide bajo presión y con riesgo." },
    ],
    requisitos: {
      formacion: ["Grado en Economía / ADE / Finanzas", "MBA, Asesoría Fiscal o RIC valorable"],
      experiencia: ["10-15 años en dirección financiera"],
      idiomas: ["Inglés avanzado valorable"],
      herramientas: ["Excel avanzado", "A3ERP", "Power BI / Metabase", "Banca online", "IA aplicada a finanzas"],
    },
    oportunidades: [
      "Dirección Corporativa",
      "Comité de Dirección",
      "Liderar transformación digital financiera",
      "Apoyar expansión y nuevas sociedades",
    ],
  },

  // ── Director de Marketing ─────────────────────────────────
  {
    slug: "director-marketing",
    codigo: "JTQMAR01",
    titulo: "Director/a de Marketing",
    departamento: "Marketing",
    reportaA: "Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Definir y ejecutar la estrategia de marca, comunicación y campañas 360, liderando el rebranding, la experiencia retail y el calendario comercial junto a Producto.",
    funciones: [
      { titulo: "Campañas 360", detalle: "Briefing, planificación y ejecución de campañas anuales (incl. ADRISIER, Navidad)." },
      { titulo: "Rebranding", detalle: "Lidera fases 1 y 2: logo, design store, expositores, interiores y reformas con MADE." },
      { titulo: "Retail y tiendas", detalle: "Visitas a tiendas, reuniones con centros comerciales (GC) y comunicación interna." },
      { titulo: "Eventos y proveedores", detalle: "Organiza eventos, drops, marketing olfativo y gestiona proveedores." },
      { titulo: "Equipos creativos", detalle: "Forma y dirige social media y visual; coordina shootings y cartelería." },
      { titulo: "Operaciones de marketing", detalle: "Presupuesto, facturas, Trello, Drive, accesos, almacén y reporting." },
      { titulo: "Nuevas marcas y proyectos", detalle: "TQ Metales, TQ Jewel District, WTF/Juls y nuevas líneas." },
      { titulo: "Coordinación transversal", detalle: "Producto, IT, Financiero, Personas, Logística y Atención al cliente." },
    ],
    relaciones: {
      internas: ["Dirección", "Producto", "Social Media", "Visual", "Ecommerce", "Logística", "Financiero", "Personas", "IT", "Tiendas", "Manager / Jefa Regional"],
      externas: ["Imprenta", "Mantenimiento (Adrisier)", "Mobiliario (Made)", "Centros comerciales", "Modelos", "Drops", "Marketing olfativo", "Eventos"],
    },
    competenciasTecnicas: [
      "Campañas 360",
      "Branding y rebranding",
      "Dirección creativa retail",
      "Gestión de presupuesto y proveedores",
      "Planificación y coordinación",
      "Eventos y activaciones",
      "Análisis de marca",
    ],
    competenciasTea: [
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Muy Alto", justificacion: "Voz interna y externa de la marca." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Hub transversal entre todas las áreas." },
      { area: "Intrapersonal", competencia: "Iniciativa", nivel: "Muy Alto", justificacion: "Propone y lanza proyectos creativos." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Muy Alto", justificacion: "Custodia la historia y narrativa de TQ." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Muy Alto", justificacion: "Encarna el alma de la marca." },
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Muy Alto", justificacion: "Calendarios y campañas anuales." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Alto", justificacion: "Dirige equipos creativos y proveedores." },
    ],
    requisitos: {
      formacion: ["Grado en Marketing / Publicidad / Comunicación"],
      experiencia: ["3-5 años en dirección de marketing, preferiblemente retail"],
      herramientas: ["Canva", "Photoshop", "CapCut", "IA generativa", "Metricool", "META Ads", "Trello", "Slack", "Drive", "Excel", "Colorlight"],
      otros: ["Adobe, Placeit, Pacdora y Sensory Lab valorables"],
    },
    oportunidades: [
      "Head of Marketing",
      "Liderar lanzamientos de nuevas marcas",
      "Dirección de experiencia de cliente",
    ],
  },

  // ── Oficial de Contabilidad ───────────────────────────────
  {
    slug: "oficial-contabilidad",
    codigo: "JTQCON01",
    titulo: "Oficial de Contabilidad",
    departamento: "Finanzas",
    reportaA: "Técnico contable · Financiero · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Ejecutar la operativa contable diaria del grupo asegurando precisión, cumplimiento fiscal y enlace fiable entre tiendas, banca y administración.",
    funciones: [
      { titulo: "Contabilidad SII", detalle: "Corrige facturas en A3 CON y descarga/envía SII a Hacienda en plazo (4 días hábiles)." },
      { titulo: "Proveedores y clientes", detalle: "Mantiene Excels de proveedores y clientes >1.000€, transferencias y entregas a cuenta." },
      { titulo: "Tesorería operativa", detalle: "Entradas de banco, punteo, confirming firmado en CaixaBank." },
      { titulo: "Cierre de tiendas", detalle: "Cierra cajas (cuenta 572/562), gestiona descuadres y aperturas." },
      { titulo: "Enlace A3", detalle: "Traspasos entre cuentas y enlace A3 CON ↔ A3 ERP." },
      { titulo: "Automatización", detalle: "Mejora flujos repetitivos y soporta auditoría." },
    ],
    relaciones: {
      internas: ["Contabilidad", "Tiendas", "Taller", "Financiero", "Dirección", "IT"],
      externas: ["Bancos", "Hacienda", "Software (A3)", "Auditoría"],
    },
    competenciasTecnicas: [
      "Contabilidad general",
      "Fiscalidad operativa (SII, IGIC)",
      "Tesorería y banca",
      "Gestión de proveedores",
      "Cierre de caja en tienda",
      "Excel y A3 CON",
      "Automatización y gestión documental",
    ],
    competenciasTea: [
      { area: "Desarrollo de tareas", competencia: "Análisis", nivel: "Muy Alto", justificacion: "Detección de descuadres e incidencias." },
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Alto", justificacion: "Plazos fiscales y calendarios bancarios estrictos." },
      { area: "Intrapersonal", competencia: "Responsabilidad", nivel: "Alto", justificacion: "Trabaja con datos sensibles y normativa fiscal." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Medio-Alto", justificacion: "Colabora con tiendas, banca y auditoría." },
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Medio-Alto", justificacion: "Aclara incidencias con tiendas y proveedores." },
      { area: "Desarrollo de tareas", competencia: "Orientación al cliente interno", nivel: "Medio", justificacion: "Soporte a otras áreas operativas." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Bajo", justificacion: "Rol técnico ejecutor, no de dirección." },
      { area: "Dirección", competencia: "Dirección", nivel: "Bajo", justificacion: "No gestiona equipo." },
    ],
    requisitos: {
      formacion: ["FP Grado Superior en Administración / Contabilidad / Gestión"],
      experiencia: ["2-3 años en contabilidad operativa"],
      herramientas: ["Excel", "A3 CON", "Banca online"],
      otros: ["Conocimiento de SII e IGIC"],
    },
    oportunidades: [
      "Técnico de Contabilidad",
      "Especialización en fiscalidad o tesorería",
    ],
  },

  // ── Procurement Specialist ────────────────────────────────
  {
    slug: "procurement-specialist",
    codigo: "JTQPRO05",
    titulo: "Procurement Specialist",
    departamento: "Producto",
    reportaA: "Product Manager · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Asegurar la disponibilidad y rentabilidad del producto a través de compras, codificación, control de stock y relación con proveedores nacionales e internacionales.",
    funciones: [
      { titulo: "Compras y pedidos", detalle: "Gestiona pedidos por web, correo y WhatsApp con proveedores y fábricas." },
      { titulo: "Importación", detalle: "Coordina aduanas y paquetería (≈15% del volumen)." },
      { titulo: "Recepción y codificación", detalle: "Recibe, codifica (plata 100% / oro 70% PVP redondeo) y resuelve incongruencias." },
      { titulo: "Negociación", detalle: "Reuniones cada 3 meses; comparativas de precios y pruebas de producto." },
      { titulo: "Ciclo de vida", detalle: "NOVEDAD · CLÁSICO · PRÓXIMO A DESCATALOGAR · DESCATALOGADO · OUTLET." },
      { titulo: "Stock e inventarios", detalle: "Traspasos a tiendas e inventarios con pistola 1-2 veces al año." },
      { titulo: "Soporte tienda", detalle: "Apoya pedidos, cambios y devoluciones; formación continua." },
    ],
    relaciones: {
      internas: ["Producto", "Contabilidad", "Tiendas", "Ecommerce", "Managers de zona", "IT"],
      externas: ["Proveedores", "Fábricas", "Aduanas", "Paquetería"],
    },
    competenciasTecnicas: [
      "Compras y negociación",
      "Planificación de stock",
      "Inventarios y trazabilidad",
      "Logística e importación",
      "Costes y márgenes",
      "Conocimiento de metales preciosos",
      "ERP y Excel",
      "Retail y rotación",
    ],
    competenciasTea: [
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Muy Alto", justificacion: "Stock y campañas con plazos largos (China)." },
      { area: "Desarrollo de tareas", competencia: "Análisis", nivel: "Alto", justificacion: "Comparativas, márgenes y rotación." },
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Alto", justificacion: "Interlocución continua con proveedores." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Alto", justificacion: "Coordina con tiendas y producto." },
      { area: "Intrapersonal", competencia: "Responsabilidad", nivel: "Alto", justificacion: "Manejo de producto de alto valor." },
      { area: "Desarrollo de tareas", competencia: "Orientación al cliente interno", nivel: "Medio-Alto", justificacion: "Soporte a tiendas y ecommerce." },
      { area: "Interpersonal", competencia: "Influencia", nivel: "Medio-Alto", justificacion: "Negociación con proveedores." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Medio", justificacion: "Rol especialista, no de dirección." },
      { area: "Dirección", competencia: "Dirección", nivel: "Medio", justificacion: "No gestiona equipo." },
    ],
    requisitos: {
      formacion: ["FP Grado Superior en Administración / Comercio Internacional / Logística"],
      experiencia: ["1-2 años en compras o logística retail"],
      herramientas: ["Excel", "Correo", "ERP", "Pinterest"],
    },
    oportunidades: [
      "Product Manager",
      "Especialización en compras internacionales",
    ],
  },

  // ── Proyect Coordinator ───────────────────────────────────
  {
    slug: "proyect-coordinator",
    codigo: "JTQPRO02",
    titulo: "Proyect Coordinator",
    departamento: "Producto",
    reportaA: "Product Manager · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Coordinar TQ Jewels District y proyectos transversales de Te Quiero, articulando compras, diseño, ciclo de vida y nuevas líneas con proveedores y áreas internas.",
    funciones: [
      { titulo: "TQ Jewels District", detalle: "Coordina la marca: compras nacionales (catálogo) y China (creación, plazos 2-4 meses)." },
      { titulo: "Diseño y briefing", detalle: "Trabaja con Canva, Pinterest y Excel para cerrar detalles con proveedores." },
      { titulo: "Ciclo de vida", detalle: "Analiza ventas, revisa stock (mín. 4 unidades) y planifica novedades." },
      { titulo: "Pedidos a tienda", detalle: "Gestiona pedidos por tablet/pistola, inventarios 1-2 veces al año, envíos de novedades." },
      { titulo: "Visitas y comunicación", detalle: "Visitas a tiendas cada 3 meses y coordinación con managers de zona." },
      { titulo: "Nuevas líneas y proyectos", detalle: "Crea joyas y líneas 2026-2027, productos para campañas y proyectos como portacenizas." },
      { titulo: "Te Quiero y Shopify", detalle: "Apoya a Te Quiero, ecommerce y Shopify; interactúa con Visual, Marketing e IT." },
      { titulo: "TQ Metales", detalle: "Comunicación con la futura fábrica de metal en Canarias (2026)." },
    ],
    relaciones: {
      internas: ["Producto", "Marketing", "Visual", "Logística", "IT", "Finanzas", "Managers de zona", "Tiendas TQ Jewels District y Te Quiero"],
      externas: [
        "Proveedores nacionales (ALIANZA ARTE, ANTONIO ALGAR, ASOLOGOLD, CORALO, CORMAVAN, DOTTO, JURADO PORCEL, SILVERBENE, JMD SILVER, JORGE TEJERA, JOSÉ DORADO, MACOVAL, MANUEL RUSO, MARTIN BEIXER, VESMER, MOVEGRANADA, OPLA, PEPE MORALES, RAFAEL GARCÉS, 750 GROUP, CORVER, TAGOR, VICENTE MANZANO)",
        "Proveedores internacionales / China",
        "Packaging",
        "Aduanas y transportes",
        "Auditores",
        "Fabricantes de nuevos proyectos",
      ],
    },
    competenciasTecnicas: [
      "Coordinación de proyectos",
      "Ciclo de vida de producto",
      "Compras y negociación",
      "Diseño asistido (Canva · IA)",
      "Análisis de ventas e inventarios",
      "Joyería (kilataje y materiales)",
      "Shopify · Metabase · Excel",
      "Gestión documental",
    ],
    competenciasTea: [
      { area: "Interpersonal", competencia: "Comunicación", nivel: "Muy Alto", justificacion: "Interlocutora entre proveedores, tiendas y áreas internas." },
      { area: "Entorno", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Coordina múltiples áreas y proyectos." },
      { area: "Intrapersonal", competencia: "Iniciativa", nivel: "Muy Alto", justificacion: "Propone líneas y proyectos nuevos." },
      { area: "Desarrollo de tareas", competencia: "Análisis", nivel: "Muy Alto", justificacion: "Ciclo de vida, ventas y stock." },
      { area: "Desarrollo de tareas", competencia: "Planificación", nivel: "Muy Alto", justificacion: "Plazos largos y proyectos paralelos." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Muy Alto", justificacion: "Custodia el ADN del producto TQ." },
      { area: "Interpersonal", competencia: "Influencia", nivel: "Medio-Alto", justificacion: "Negocia con proveedores estratégicos." },
      { area: "Dirección", competencia: "Liderazgo", nivel: "Medio-Alto", justificacion: "Lidera proyectos sin equipo formal." },
      { area: "Dirección", competencia: "Dirección", nivel: "Medio", justificacion: "Rol coordinador, no jerárquico." },
    ],
    requisitos: {
      formacion: ["Grado en Diseño / Moda / Marketing / Producto / ADE"],
      experiencia: ["2-3 años con experiencia previa en tienda JTQ valorable"],
      idiomas: ["Inglés avanzado"],
      herramientas: ["Programas internos", "Excel", "Canva", "Shopify", "Sistema de escaneo", "IA (Grok, Gemini)"],
    },
    oportunidades: [
      "Responsable de Producto",
      "Liderar nuevas marcas",
      "Apoyar la expansión del grupo",
    ],
  },
  {
    slug: "product-specialist",
    codigo: "JTQPRO01",
    titulo: "Product Specialist",
    departamento: "Producto",
    reportaA: "Product Manager · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Garantizar la correcta gestión, desarrollo y optimización del catálogo, asegurando que la selección, codificación, precios, ciclos de vida y rotación de las joyas estén alineados con la estrategia comercial, las campañas de marketing y las necesidades de las tiendas, mediante el análisis de tendencias, la coordinación con proveedores y el control riguroso del stock y la rentabilidad.",
    funciones: [
      { titulo: "Reuniones con proveedores", detalle: "Selección de nuevas prendas para incorporar al catálogo en las visitas a oficina, con apoyo del expositor de referencia y posterior presupuesto." },
      { titulo: "Inventario", detalle: "Inventario por familias 1-2 veces al año (primeros de año y verano) con todo el departamento, escaneando con pistola hasta cuadrar con el stock del programa." },
      { titulo: "Investigación de tendencias", detalle: "Análisis de redes sociales, Pinterest y catálogos de proveedores para identificar oportunidades; plazos de 2 meses (existente) y 4 meses (nueva creación)." },
      { titulo: "Valoración de muestras", detalle: "Evaluar muestras enviadas por proveedores y decidir solicitudes, descartes o modificaciones de producto." },
      { titulo: "Campañas y colecciones", detalle: "Selección de joyas para San Valentín, Día de la Madre/Padre y nuevas marcas (bebé, bodas) en base a informes del año anterior, ~4 meses de antelación." },
      { titulo: "Análisis de rotación", detalle: "Gestión del ciclo de vida (NOVEDAD → CLÁSICO/DESCATALOGADO/OUTLET) para identificar oportunidades de mejora, sustitución o lanzamiento." },
      { titulo: "Pricing y márgenes", detalle: "Definición de precios de coste, margen y PVP producto a producto (plata 100%, oro 70%, redondeo a .99)." },
      { titulo: "Pedidos de tienda", detalle: "Apoyo en la preparación de los 17 pedidos de tienda (días 20-26), con orden SC → Norte → Sur." },
      { titulo: "Visitas a tiendas", detalle: "Visitas trimestrales por zona con cuestionario de feedback para detectar productos defectuosos, demanda no cubierta y mejoras en el surtido." },
      { titulo: "Codificación de catálogo", detalle: "Apoyo en la codificación de paquetes de proveedores con cálculo de PVP y descarga de códigos." },
    ],
    relaciones: {
      internas: ["Departamento de Productos", "Marketing", "Tiendas", "Manager de Zonas y Manager Regional", "Dirección", "Dirección Financiera", "Departamento de IT", "Contabilidad"],
      externas: ["Proveedores nacionales e internacionales", "Diseñadores y fabricantes", "Empresas de transporte y logística"],
    },
    competenciasTecnicas: [
      "Gestión integral de producto (ciclo de vida, rotación y catálogo)",
      "Análisis de ventas y comportamiento del producto",
      "Definición de precios, márgenes y PVP",
      "Codificación de producto y control de inventarios",
      "Gestión de pedidos y stock multitienda",
      "Investigación de tendencias en moda, joyería y consumo",
      "Coordinación de campañas y colecciones",
      "Manejo avanzado del programa Te Quiero",
      "Excel para control de catálogo, stock y análisis",
      "Gestión documental con proveedores",
    ],
    competenciasTea: [
      { area: "Intrapersonal", competencia: "Autocontrol y estabilidad emocional", nivel: "Alto", justificacion: "Gestiona picos de trabajo, campañas e inventarios manteniendo calidad y foco." },
      { area: "Intrapersonal", competencia: "Confianza en sí misma", nivel: "Alto", justificacion: "Defiende criterios técnicos de producto ante otros departamentos." },
      { area: "Intrapersonal", competencia: "Resistencia a la adversidad", nivel: "Medio-Alto", justificacion: "Afronta incidencias operativas con apoyo del equipo y manager." },
      { area: "Interpersonales", competencia: "Comunicación", nivel: "Alto", justificacion: "Comunicación continua con tiendas, marketing, proveedores y equipo interno." },
      { area: "Interpersonales", competencia: "Establecimiento de relaciones", nivel: "Alto", justificacion: "Relaciones profesionales estables con proveedores y áreas internas." },
      { area: "Interpersonales", competencia: "Negociación", nivel: "Medio-Alto", justificacion: "Participa en ajustes de precios y condiciones." },
      { area: "Interpersonales", competencia: "Influencia", nivel: "Medio-Alto", justificacion: "Influencia basada en criterio técnico, no en jerarquía." },
      { area: "Interpersonales", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Trabajo colaborativo constante en un equipo de cinco personas." },
      { area: "Desarrollo de tareas", competencia: "Iniciativa", nivel: "Alto", justificacion: "Propone mejoras, novedades y ajustes de catálogo." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Alto", justificacion: "Impacto directo en rotación, ventas y rentabilidad." },
      { area: "Desarrollo de tareas", competencia: "Capacidad de análisis", nivel: "Muy Alto", justificacion: "Análisis profundo del ciclo de vida y comportamiento del producto." },
      { area: "Desarrollo de tareas", competencia: "Toma de decisiones", nivel: "Medio-Alto", justificacion: "Decide en su ámbito técnico, validando con manager y equipo." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Alto", justificacion: "Conocimiento sólido de procesos, producto y posicionamiento de marca." },
      { area: "Entorno", competencia: "Visión y anticipación", nivel: "Alto", justificacion: "Planifica campañas y colecciones con varios meses de antelación." },
      { area: "Entorno", competencia: "Orientación al cliente", nivel: "Alto", justificacion: "Producto alineado con las necesidades reales de tienda y cliente final." },
      { area: "Entorno", competencia: "Apertura", nivel: "Medio-Alto", justificacion: "Abierta a tendencias y cambios dentro del marco estratégico." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Alto", justificacion: "Alto grado de alineación con valores y forma de trabajar." },
      { area: "Gerenciales", competencia: "Dirección", nivel: "Bajo", justificacion: "No tiene personas a cargo ni responsabilidad jerárquica." },
      { area: "Gerenciales", competencia: "Liderazgo", nivel: "Medio", justificacion: "Liderazgo técnico puntual dentro del equipo." },
      { area: "Gerenciales", competencia: "Planificación y organización", nivel: "Muy Alto", justificacion: "Clave para inventarios, campañas, pedidos y coordinación transversal." },
    ],
    requisitos: {
      formacion: ["FP de Grado Superior o estudios universitarios en Moda, Diseño, Gestión de Producto, Marketing, Administración o similar"],
      experiencia: ["2-3 años en gestión de producto, compras, aprovisionamiento o merchandising", "Experiencia en tienda Te Quiero (valorable)"],
      herramientas: ["Programa Te Quiero", "Excel medio-alto", "Ofimática y correo", "PDA / pistola de lectura", "Pricing y márgenes"],
      otros: ["Plazos largos (2-4 meses)", "Atención al detalle", "Visión analítica y comercial"],
    },
    oportunidades: [
      "Evolución a Responsable de Producto / Product Manager",
      "Proyectos estratégicos de nuevas marcas o líneas",
      "Especialización en análisis avanzado de rentabilidad y catálogo",
    ],
  },
  {
    slug: "specialist-ecommerce",
    codigo: "JTQPRO03",
    titulo: "Specialist Ecommerce",
    departamento: "Producto · Ecommerce",
    reportaA: "Product Manager",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Garantizar la correcta operativa diaria del canal ecommerce (web y Shopify), asegurando la disponibilidad y calidad del catálogo, la preparación y seguimiento de pedidos, la coordinación con paquetería y proveedores externos, la atención al cliente y el soporte a campañas, con foco en la mejora continua de la conversión (CRO), la experiencia de compra y la trazabilidad con contabilidad y stock.",
    funciones: [
      { titulo: "Revisión diaria de plataformas", detalle: "Web, Shopify, WhatsApp, paquetería y correo cada mañana para detectar pedidos, dudas y estados de envío." },
      { titulo: "Subida de productos a Shopify", detalle: "Carga masiva con Excel (título, descripción, categoría, etiqueta, material, talla, código, peso, precio, URL) tras subir las fotos y validación posterior en Shopify." },
      { titulo: "Edición de fotos", detalle: "Tratamiento con prompts en IA (ChatGPT, Gemini) y edición en Canva (fondo, giros, tamaño)." },
      { titulo: "Preparación de pedidos", detalle: "Selección desde el stock ecommerce, packaging completo y generación de venta en Te Quiero (con venta de packaging si aplica) para cuadrar con Shopify y contabilidad." },
      { titulo: "Servicios de paquetería", detalle: "Coordinación con Zencloud, MRW y Nacex: solicitud de recogida, alta de seguimiento en Shopify, envío de facturas mensuales a Contabilidad." },
      { titulo: "Control de stock e inventario", detalle: "Dos ubicaciones (tienda La Cuesta y oficina); inventario semestral. Cambios de ubicación en Te Quiero antes de cada venta." },
      { titulo: "Devoluciones y postventa", detalle: "Gestión de devoluciones por producto defectuoso o no entregado, con seguimiento y reembolso en Shopify cuando proceda." },
      { titulo: "Coordinación con Freshcommerce", detalle: "Reuniones mensuales para web, blog, desarrollo, marketing digital y SEO; validación de propuestas." },
      { titulo: "Supervisión chat IA", detalle: "Monitorización de conversaciones automáticas en la web y toma de control cuando la IA llega a su límite." },
      { titulo: "CRO", detalle: "Análisis de mapas de calor, flujo de usuarios y propuestas de optimización de conversión." },
    ],
    relaciones: {
      internas: ["Departamento de Productos", "Contabilidad", "IT (Shopify y Acid Tango)", "People & Culture (CV recibidos)", "Marketing", "Tienda La Cuesta", "Logística"],
      externas: ["Freshcommerce", "MRW · Nacex · Seur · Zencloud"],
    },
    competenciasTecnicas: [
      "Gestión integral del flujo de pedidos ecommerce",
      "Control y conciliación de stock online (dos ubicaciones)",
      "Gestión de incidencias y devoluciones",
      "Soporte operativo a campañas digitales",
      "Optimización básica de conversión (CRO)",
      "Coordinación con proveedores tecnológicos",
      "Shopify, Brevo, Canva, IA y edición de imágenes",
      "Excel y herramientas ofimáticas",
    ],
    competenciasTea: [
      { area: "Intrapersonal", competencia: "Autocontrol y estabilidad emocional", nivel: "Alto", justificacion: "Mantiene la calma ante picos de pedidos, incidencias y urgencias de campaña." },
      { area: "Intrapersonal", competencia: "Confianza en sí misma", nivel: "Alto", justificacion: "Ejecuta decisiones operativas con criterio y sostiene su postura con datos." },
      { area: "Intrapersonal", competencia: "Resistencia a la adversidad", nivel: "Alto", justificacion: "Se recupera rápido ante errores, cambios y problemas de transporte." },
      { area: "Interpersonales", competencia: "Comunicación", nivel: "Alto", justificacion: "Información clara a clientes y áreas internas para evitar reprocesos." },
      { area: "Interpersonales", competencia: "Establecimiento de relaciones", nivel: "Medio-Alto", justificacion: "Relaciones útiles con tienda, logística, contabilidad y proveedores." },
      { area: "Interpersonales", competencia: "Negociación", nivel: "Medio-Alto", justificacion: "Negocia condiciones con paquetería buscando equilibrio coste/servicio." },
      { area: "Interpersonales", competencia: "Influencia", nivel: "Medio-Alto", justificacion: "Propone mejoras CRO/operativas con argumentos." },
      { area: "Interpersonales", competencia: "Trabajo en equipo", nivel: "Alto", justificacion: "Coordinación con productos, tienda y logística sin fricciones." },
      { area: "Desarrollo de tareas", competencia: "Iniciativa", nivel: "Alto", justificacion: "Detecta errores y oportunidades sin esperar instrucciones." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Alto", justificacion: "Prioriza pedidos a tiempo, catálogo correcto e incidencias resueltas." },
      { area: "Desarrollo de tareas", competencia: "Capacidad de análisis", nivel: "Alto", justificacion: "Revisa datos y comportamiento del usuario para proponer mejoras." },
      { area: "Desarrollo de tareas", competencia: "Toma de decisiones", nivel: "Alto", justificacion: "Decide con rapidez ante incidencias y urgencias de campaña." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Medio-Alto", justificacion: "Comprende los flujos internos para asegurar coherencia entre áreas." },
      { area: "Entorno", competencia: "Visión y anticipación", nivel: "Medio-Alto", justificacion: "Anticipa roturas de stock y picos de campaña." },
      { area: "Entorno", competencia: "Orientación al cliente", nivel: "Muy Alto", justificacion: "Asegura una experiencia excelente y resolución eficaz." },
      { area: "Entorno", competencia: "Apertura", nivel: "Alto", justificacion: "Se adapta a herramientas nuevas y mejoras continuas." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Alto", justificacion: "Cuida la marca en cada interacción, packaging y tono de atención." },
      { area: "Gerenciales", competencia: "Dirección", nivel: "Medio", justificacion: "Coordina tareas y prioridades del día a día sin equipo formal." },
      { area: "Gerenciales", competencia: "Liderazgo", nivel: "Medio", justificacion: "Lidera desde el ejemplo y la coordinación transversal." },
      { area: "Gerenciales", competencia: "Planificación y organización", nivel: "Muy Alto", justificacion: "Organiza pedidos, cargas, material, inventarios y campañas con método." },
    ],
    requisitos: {
      formacion: ["Máster CRO"],
      experiencia: ["2 años en la empresa (valorable tienda JTQ)", "Conocimiento del producto", "1 año en ecommerce"],
      herramientas: ["Shopify", "Excel / hojas de cálculo", "Canva", "IA para imágenes", "Google Workspace / Microsoft 365", "WhatsApp Web", "Zencloud y portales de transportistas", "Te Quiero y Acid Tango"],
      otros: ["Detalle en cargas masivas", "Gestión de picos de campaña", "Criterio en incidencias y devoluciones", "Confidencialidad de datos"],
    },
    oportunidades: [
      "Responsable / Coordinator de Ecommerce",
      "Especialización como CRO Specialist",
      "Crecimiento hacia Product Operations / Digital Product",
    ],
  },
  {
    slug: "stock-specialist",
    codigo: "JTQPRO04",
    titulo: "Stock Specialist",
    departamento: "Producto · Stock",
    reportaA: "Product Manager · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Garantizar la correcta gestión, control y trazabilidad del stock del departamento de producto, asegurando la adecuada recepción, codificación, verificación, registro y distribución de mercancía a tiendas, contribuyendo a la fiabilidad del inventario, la optimización de existencias y el correcto funcionamiento operativo de JTQ.",
    funciones: [
      { titulo: "Inventario", detalle: "Creación de inventarios por familias en el programa Te Quiero, escaneando con pistola sobre la marcha." },
      { titulo: "Recepción de mercancía", detalle: "Verificación de cantidades, anotación de códigos en albarán y cálculo del peso medio (5 unidades) por referencia." },
      { titulo: "Creación de códigos de producto nuevo", detalle: "Asignación de código correlativo en libreta Excel y alta en catálogo Te Quiero (foto, descripción, familia, quilataje, proveedor)." },
      { titulo: "Registro de pedidos", detalle: "Pedido ficticio en Te Quiero para que la mercancía pase a stock JTQ: selección de proveedor, cantidades, factura y costes con portes." },
      { titulo: "Verificación de pedido", detalle: "Cantidad, peso total por artículo y precio unidad; sustitución del coste/unidad calculado." },
      { titulo: "Codificación y PVP", detalle: "Plata 100% / oro 70% con redondeo a .99; firma y descarga de códigos." },
      { titulo: "Descarga e impresión de códigos", detalle: "Casado de códigos descargados con producto en Te Quiero y pegado tras impresión." },
      { titulo: "Pedidos de tienda", detalle: "Preparación de las 17 solicitudes (días 20-26): SC → Norte → Sur, con apoyo en Excel de la Manager de productos." },
      { titulo: "Lectura de códigos para tiendas", detalle: "Escaneo final por pistola, registro de bolsas y peso, firma y cambio de ubicación al confirmar tienda." },
      { titulo: "Envío de novedades", detalle: "Creación de envío en ENVIOS (origen-destino), escaneo y confirmación con peso y bolsas." },
      { titulo: "Coordinación con Logística", detalle: "Lunes Santa Cruz, Martes zona Norte, Miércoles zona Sur." },
    ],
    relaciones: {
      internas: ["Product Manager", "Product Specialist", "Procurement Specialist", "Specialist Ecommerce", "Manager de Producto", "Logística", "Tiendas (SC, Norte, Sur)", "Departamento de Compras"],
      externas: ["Proveedores", "Transportistas", "Servicios de mensajería"],
    },
    competenciasTecnicas: [
      "Gestión y control de inventarios",
      "Recepción y verificación de mercancía",
      "Codificación y creación de referencias",
      "Gestión de pedidos internos a tienda",
      "Manejo del ERP Te Quiero",
      "Trazabilidad documental (albaranes, facturas, pedidos)",
      "Cálculo de costes, márgenes y PVP",
      "Excel a nivel operativo",
      "Pistola lectora de códigos de barras",
      "Logística interna",
    ],
    competenciasTea: [
      { area: "Intrapersonal", competencia: "Autocontrol y estabilidad emocional", nivel: "Alto", justificacion: "Precisión y rigor en tareas repetitivas y de detalle." },
      { area: "Intrapersonal", competencia: "Confianza en sí misma", nivel: "Medio-Alto", justificacion: "Decisiones operativas en verificación y ajustes de cantidades." },
      { area: "Intrapersonal", competencia: "Resistencia a la adversidad", nivel: "Alto", justificacion: "Volumen de trabajo variable según entradas y pedidos." },
      { area: "Interpersonales", competencia: "Comunicación", nivel: "Alto", justificacion: "Coordinación constante con tiendas, logística y procurement." },
      { area: "Interpersonales", competencia: "Establecimiento de relaciones", nivel: "Medio-Alto", justificacion: "Relación fluida con equipos internos y proveedores." },
      { area: "Interpersonales", competencia: "Negociación", nivel: "Medio", justificacion: "No es función principal del puesto." },
      { area: "Interpersonales", competencia: "Influencia", nivel: "Medio", justificacion: "No tiene responsabilidad directa sobre equipos." },
      { area: "Interpersonales", competencia: "Trabajo en equipo", nivel: "Alto", justificacion: "Trabajo coordinado con producto y tiendas." },
      { area: "Desarrollo de tareas", competencia: "Iniciativa", nivel: "Medio-Alto", justificacion: "Detección de incidencias y agilidad de respuesta." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Muy Alto", justificacion: "El control exacto del stock impacta directamente en ventas y operativa." },
      { area: "Desarrollo de tareas", competencia: "Capacidad de análisis", nivel: "Alto", justificacion: "Verificación de pesos, márgenes, costes y discrepancias." },
      { area: "Desarrollo de tareas", competencia: "Toma de decisiones", nivel: "Medio-Alto", justificacion: "Decisiones operativas diarias de ajustes y verificaciones." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Alto", justificacion: "Conocer tiendas y flujos internos es fundamental." },
      { area: "Entorno", competencia: "Visión y anticipación", nivel: "Medio-Alto", justificacion: "Prever necesidades de reposición o incidencias." },
      { area: "Entorno", competencia: "Orientación al cliente", nivel: "Medio-Alto", justificacion: "Impacto indirecto vía disponibilidad de producto." },
      { area: "Entorno", competencia: "Apertura", nivel: "Medio-Alto", justificacion: "Adaptación a cambios de sistema o procedimientos." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Alto", justificacion: "Puesto clave en la cadena operativa del producto." },
      { area: "Gerenciales", competencia: "Dirección", nivel: "Bajo", justificacion: "No tiene equipo a cargo." },
      { area: "Gerenciales", competencia: "Liderazgo", nivel: "Medio", justificacion: "Liderazgo operativo puntual." },
      { area: "Gerenciales", competencia: "Planificación y organización", nivel: "Muy Alto", justificacion: "Clave para gestionar inventarios, entradas y salidas con precisión." },
    ],
    requisitos: {
      formacion: ["FP Grado Medio o Superior en Administración, Logística, Comercio o similar"],
      experiencia: ["Gestión de stock, almacén o control de inventario", "Experiencia previa en joyería o tienda JTQ (valorable)"],
      herramientas: ["Excel operativo", "Pistola lectora de códigos", "Albaranes, facturas y pedidos", "Programa Te Quiero o ERP similar (valorable)"],
      otros: ["Alto nivel de organización y precisión", "Volumen de referencias", "Atención extrema al detalle", "Agilidad operativa"],
    },
    oportunidades: [
      "Mayor responsabilidad dentro del Departamento de Producto",
      "Desarrollo hacia Procurement Specialist o Product Specialist",
    ],
  },
  {
    slug: "tecnico-contabilidad",
    codigo: "JTQCON02",
    titulo: "Técnico en Contabilidad",
    departamento: "Financiero · Contabilidad",
    reportaA: "Financiero · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Garantizar la correcta gestión, supervisión y control de las operaciones contables, financieras y fiscales de la empresa, asegurando la fiabilidad de la información económico-financiera, el cumplimiento de las obligaciones tributarias y societarias, la conciliación bancaria y el correcto tratamiento de activos, impuestos y operaciones complejas, dando soporte técnico avanzado al Departamento Financiero, asesorías y auditores.",
    funciones: [
      { titulo: "Facturas emitidas (alquileres y SAR)", detalle: "Emisión mensual en Te Quiero, descarga PDF, asignación de número por IT, envío al cliente y apunte manual en A3 CON." },
      { titulo: "Facturas recibidas y proveedores", detalle: "Registro y validación; remesas (confirming a 60 días, transferencias del mes anterior y urgentes); contabilización en A3 CON y envío al SII." },
      { titulo: "Bienes de inversión", detalle: "Tratamiento específico: ficha de activo en A3 CON con años de amortización y factura adjunta." },
      { titulo: "Bancos y visas", detalle: "Conciliación diaria en CaixaBank y Cajasiete; gestión de tarjetas vía PLEO, conciliación con A3 NOM." },
      { titulo: "Impuestos mensuales", detalle: "Modelos 111 (retenciones), 115 (alquileres), 123 (dividendos), 417 (IGIC), 600 (ITP de compras y VR), 202 (pagos a cuenta IS)." },
      { titulo: "Cuentas anuales e Impuesto de Sociedades", detalle: "Revisión desde enero, presentación en julio del ejercicio anterior con asesoría externa." },
      { titulo: "Control VR VTO TQM (cuenta 566.1)", detalle: "Verificación de vencimientos de ventas recuperables y minoración de la cuenta de depósito según destino (stock, fundición o cliente)." },
      { titulo: "Gestiones con Administraciones", detalle: "Notificaciones de Hacienda, Ayuntamientos, IBI, IAE y pagos indebidos." },
      { titulo: "Reuniones trimestrales Biplaza", detalle: "Revisión de balances y cuentas trimestrales con asesoría fiscal y contable." },
      { titulo: "Auditoría externa", detalle: "Coordinación con auditores y suministro de documentación cuando se solicita." },
      { titulo: "Nóminas y embargos", detalle: "Contabilización de nóminas con People & Culture; embargos, préstamos, anticipos, cursos y firma de remesas." },
      { titulo: "Subvenciones", detalle: "Documentación, fichas de activos afectados y ajuste mensual de porcentajes según concesión." },
    ],
    relaciones: {
      internas: ["Departamento Financiero", "People & Culture", "Departamento de Informática", "Departamento Jurídico", "Equipo de Contabilidad", "Tiendas y Managers de zona"],
      externas: ["Asesoría fiscal y contable", "Auditores externos", "Entidades financieras (CaixaBank, Cajasiete)", "Administraciones Públicas", "Proveedores y acreedores", "Clientes internos y terceros"],
    },
    competenciasTecnicas: [
      "Contabilidad general y analítica avanzada",
      "Fiscalidad operativa y cumplimiento tributario",
      "Gestión de impuestos y coordinación con asesoría fiscal",
      "Tesorería, bancos y conciliaciones",
      "Control de proveedores y acreedores",
      "Inmovilizado y amortizaciones",
      "Ventas recuperables y cuentas especiales",
      "Contabilidad de nóminas, embargos y remesas",
      "Excel avanzado aplicado a contabilidad",
      "A3 CON, SII, Te Quiero, PLEO",
    ],
    competenciasTea: [
      { area: "Intrapersonal", competencia: "Autocontrol y estabilidad emocional", nivel: "Alto", justificacion: "Información sensible, plazos fiscales y auditorías sin perder rigor." },
      { area: "Intrapersonal", competencia: "Confianza en sí misma", nivel: "Alto", justificacion: "Criterio técnico propio en ejecución y validación contable." },
      { area: "Intrapersonal", competencia: "Resistencia a la adversidad", nivel: "Alto", justificacion: "Picos de trabajo, cierres y requerimientos externos." },
      { area: "Interpersonales", competencia: "Comunicación", nivel: "Medio-Alto", justificacion: "Información contable clara a departamentos internos y asesorías." },
      { area: "Interpersonales", competencia: "Establecimiento de relaciones", nivel: "Medio-Alto", justificacion: "Relaciones fluidas con equipos internos y agentes externos." },
      { area: "Interpersonales", competencia: "Negociación", nivel: "Medio", justificacion: "Interacción puntual en aclaraciones de pagos o plazos." },
      { area: "Interpersonales", competencia: "Influencia", nivel: "Medio", justificacion: "Aporta criterio técnico en decisiones contables." },
      { area: "Interpersonales", competencia: "Trabajo en equipo", nivel: "Alto", justificacion: "Coordinación con contabilidad, financiero, personas e informática." },
      { area: "Desarrollo de tareas", competencia: "Iniciativa", nivel: "Medio-Alto", justificacion: "Propone mejoras operativas y detecta incidencias contables." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Alto", justificacion: "Asegura plazos fiscales, cierres y fiabilidad de la información." },
      { area: "Desarrollo de tareas", competencia: "Capacidad de análisis", nivel: "Muy Alto", justificacion: "Operaciones complejas, impuestos, amortizaciones y cuentas especiales." },
      { area: "Desarrollo de tareas", competencia: "Toma de decisiones", nivel: "Medio-Alto", justificacion: "Decisiones técnicas dentro de su ámbito; escala cuando corresponde." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Alto", justificacion: "Comprende operativa de negocio, tiendas, VR y flujos económicos." },
      { area: "Entorno", competencia: "Visión y anticipación", nivel: "Medio-Alto", justificacion: "Anticipa impactos contables y fiscales de la actividad." },
      { area: "Entorno", competencia: "Orientación al cliente", nivel: "Medio", justificacion: "Orientación principalmente interna y técnica." },
      { area: "Entorno", competencia: "Apertura", nivel: "Medio-Alto", justificacion: "Receptividad a cambios normativos y de sistemas." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Alto", justificacion: "Compromiso con la fiabilidad y estabilidad financiera." },
      { area: "Gerenciales", competencia: "Dirección", nivel: "Bajo", justificacion: "No tiene responsabilidad directa de dirección de personas." },
      { area: "Gerenciales", competencia: "Liderazgo", nivel: "Bajo", justificacion: "No ejerce liderazgo formal." },
      { area: "Gerenciales", competencia: "Planificación y organización", nivel: "Muy Alto", justificacion: "Tareas contables complejas, simultáneas y con plazos críticos." },
    ],
    requisitos: {
      formacion: ["FP Grado Superior en Administración y Finanzas, Contabilidad y Finanzas o similar", "Universitaria en ADE, Economía o Finanzas (valorable)"],
      experiencia: ["Mínimo 3 años en contabilidad, preferiblemente en entornos con volumen, multisede o actividad comercial"],
      herramientas: ["A3 CON y SII", "Facturación emitida y recibida", "Conciliación bancaria y tesorería", "Inmovilizado y amortizaciones", "Modelos 111, 115, 123, IGIC, ITP", "Excel avanzado"],
      otros: ["Plazos críticos y cierres contables", "Rigor, orden y confidencialidad", "Autonomía técnica", "Interpretación de normativa fiscal y contable"],
    },
    oportunidades: [
      "Especialización técnica en contabilidad y fiscalidad",
      "Roles de mayor responsabilidad en control financiero",
      "Proyectos de automatización contable",
      "Auditorías y cierres complejos",
    ],
  },
  {
    slug: "visual-merchandiser",
    codigo: "JTQVIS01",
    titulo: "Visual Merchandiser",
    departamento: "Marketing · Visual",
    reportaA: "Manager Marketing · Dirección",
    ubicacion: "San Cristóbal de La Laguna",
    jornada: "Completa",
    objetivo:
      "Diseñar, planificar, coordinar e implantar la estrategia de visual merchandising de la marca en todos los puntos de venta, asegurando la coherencia estética, la alineación con marketing y producto, la optimización del impacto comercial y la estandarización visual de la red de tiendas, reforzando la identidad de marca y la experiencia del cliente.",
    funciones: [
      { titulo: "Organización de campañas", detalle: "Reunión inicial con Marketing, calendar de campaña, ficha con fechas, materiales, vinilos y soportes a construir." },
      { titulo: "Briefing y concepto visual", detalle: "Brainstorming en Canva, mood board, concepto visual, escaparate, vinilos y materiales (~1,5 semanas)." },
      { titulo: "Presentación a Marketing y Producto", detalle: "Brainstorming conjunto y alineamiento con Social Media para coherencia de lenguaje visual." },
      { titulo: "Selección de materiales", detalle: "Búsqueda y comparativa; petición a Logística salvo materiales que requieren ojo estético." },
      { titulo: "Creación de vinilos", detalle: "Diseño en Canva por tienda, ajuste de medidas en Photoshop, vectorización en Illustrator, prueba en escaparate de La Colmena con Gráficas De Armas y OK final." },
      { titulo: "Registro de gastos", detalle: "Excel con campaña, precio y empresa." },
      { titulo: "Pruebas en escaparate", detalle: "4 tipologías de composición (tiendas grandes, medianas, peanas verticales, TQ)." },
      { titulo: "Cajas y video tutorial para tienda", detalle: "Caja personalizada por tipo de tienda y video explicativo del montaje." },
      { titulo: "Briefing y feedback a tiendas", detalle: "Mensaje, drops, tutorial, tiempos y paso a paso semanal; feedback individualizado tras montaje." },
      { titulo: "Diseño de remake interior y nueva sección Louvelet", detalle: "Bocetos, diseño técnico con medidas y maqueta física antes del visto bueno de Marketing." },
      { titulo: "Estandarización de escaparates", detalle: "Documentación tienda a tienda y diseño de cambios para coherencia visual gestionable desde La Colmena." },
      { titulo: "Rotación de productos", detalle: "Planificación de rotación en vitrinas, priorización de novedades y coordinación con Producto." },
      { titulo: "Inventario joyas Colmena", detalle: "Inventario anual de las joyas registradas en Te Quiero." },
    ],
    relaciones: {
      internas: ["Marketing", "Producto", "Social Media", "Compras", "Logística", "Dirección", "Equipo de tiendas"],
      externas: ["Proveedores de vinilos (Gráficas De Armas)", "Proveedores de materiales y soportes", "Empresas de impresión", "Fabricantes de expositores", "Proveedores de mobiliario", "Empresas de montaje en reformas"],
    },
    competenciasTecnicas: [
      "Visual merchandising estratégico",
      "Diseño conceptual de campañas",
      "Moodboards y conceptos visuales",
      "Diseño de escaparates y espacios comerciales",
      "Diseño técnico de expositores y soportes",
      "Bocetos y maquetas físicas",
      "Adaptación técnica por tienda",
      "Vectorización y archivos para impresión",
      "Gestión de proveedores y costes",
      "Estandarización visual de red de tiendas",
      "Briefings operativos y video tutoriales",
      "Canva, Photoshop, Illustrator",
    ],
    competenciasTea: [
      { area: "Intrapersonal", competencia: "Autocontrol y estabilidad emocional", nivel: "Alto", justificacion: "Múltiples campañas simultáneas, incidencias y presión de tiempos." },
      { area: "Intrapersonal", competencia: "Confianza en sí misma", nivel: "Muy Alto", justificacion: "Defiende conceptos visuales ante Dirección y áreas." },
      { area: "Intrapersonal", competencia: "Resistencia a la adversidad", nivel: "Alto", justificacion: "Resuelve imprevistos sin comprometer la imagen de marca." },
      { area: "Interpersonales", competencia: "Comunicación", nivel: "Muy Alto", justificacion: "Coordina marketing, producto, logística y tiendas con instrucciones claras." },
      { area: "Interpersonales", competencia: "Establecimiento de relaciones", nivel: "Alto", justificacion: "Relaciones fluidas con proveedores y equipos de tienda." },
      { area: "Interpersonales", competencia: "Negociación", nivel: "Medio-Alto", justificacion: "Presupuestos y condiciones con proveedores externos." },
      { area: "Interpersonales", competencia: "Influencia", nivel: "Alto", justificacion: "Impacta en presentación del producto y transmisión de campaña al cliente." },
      { area: "Interpersonales", competencia: "Trabajo en equipo", nivel: "Muy Alto", justificacion: "Colaboración constante con distintos departamentos." },
      { area: "Desarrollo de tareas", competencia: "Iniciativa", nivel: "Muy Alto", justificacion: "Propone mejoras visuales y desarrolla nuevos expositores." },
      { area: "Desarrollo de tareas", competencia: "Orientación a resultados", nivel: "Muy Alto", justificacion: "Influye en percepción de marca y rendimiento comercial." },
      { area: "Desarrollo de tareas", competencia: "Capacidad de análisis", nivel: "Alto", justificacion: "Analiza espacios, medidas, rotación y feedback de tiendas." },
      { area: "Desarrollo de tareas", competencia: "Toma de decisiones", nivel: "Alto", justificacion: "Decide conceptos, materiales y prioridades de implantación." },
      { area: "Entorno", competencia: "Conocimiento de la empresa", nivel: "Alto", justificacion: "Comprende identidad de marca, tipología de tienda y estrategia de producto." },
      { area: "Entorno", competencia: "Visión y anticipación", nivel: "Muy Alto", justificacion: "Planifica campañas con antelación y prevé necesidades técnicas." },
      { area: "Entorno", competencia: "Orientación al cliente", nivel: "Alto", justificacion: "Diseña espacios orientados a experiencia, recorrido y conversión." },
      { area: "Entorno", competencia: "Apertura", nivel: "Alto", justificacion: "Se nutre de tendencias y referencias externas para innovar." },
      { area: "Entorno", competencia: "Identificación con la empresa", nivel: "Muy Alto", justificacion: "Embajadora visual de la marca en todos los puntos de venta." },
      { area: "Gerenciales", competencia: "Dirección", nivel: "Medio-Alto", justificacion: "Coordina implantaciones y reformas sin equipo directo." },
      { area: "Gerenciales", competencia: "Liderazgo", nivel: "Alto", justificacion: "Lidera visualmente la red de tiendas en estética y coherencia de marca." },
      { area: "Gerenciales", competencia: "Planificación y organización", nivel: "Muy Alto", justificacion: "Calendarios de campaña, pruebas, producción, montaje y seguimiento multitienda." },
    ],
    requisitos: {
      formacion: ["Grado en Diseño de Interiores, Diseño Gráfico, Bellas Artes, Visual Merchandising o similar"],
      experiencia: ["2-3 años en visual merchandising retail (preferiblemente moda o joyería)"],
      herramientas: ["Canva", "Photoshop", "Illustrator", "Google Drive", "Excel (control de gastos)", "Medición y adaptación de espacios", "Materiales (metacrilato, madera, vinilo)"],
      otros: ["Pruebas in situ y maquetas", "Disponibilidad de desplazamientos", "Sensibilidad estética alineada con la marca", "Plazos de campaña", "Múltiples proyectos en paralelo"],
    },
    oportunidades: [
      "Responsable de Visual Merchandising",
      "Coordinación de equipo visual",
      "Definición estratégica global de marca",
      "Liderazgo de proyectos de remodelación integral",
      "Manual corporativo de visual merchandising",
    ],
  },
];

export function getDPT(slug: string): DPT | undefined {
  return DPTS.find((d) => d.slug === slug);
}
