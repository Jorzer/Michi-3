
/* ==========================================================================
   notes.ts — Gestión de los cinco post-its

   Responsabilidades:
   1. Mantener las colecciones de mensajes.
   2. Asociar una colección con cada fotografía.
   3. Esperar cinco segundos después del cambio de fotografía.
   4. Animar la salida y entrada de los mensajes.
   5. Evitar animaciones anteriores cuando llega un nuevo evento.

   Integración:
   - index.html: elementos .nota[data-nota] con un elemento <p>.
   - layout.css: clases .es-activa y .es-saliendo.
   - gallery.ts: evento personalizado "galeria:cambio".
   - main.ts: inicialización del módulo.
   ========================================================================== */


// ---------- 1. Configuración ----------

// Tiempo de espera después de cambiar la fotografía.
const RETRASO_NOTAS = 5000;

// Debe coincidir con la duración de arrancar-nota en layout.css.
const DURACION_SALIDA = 600;

// Separación entre las entradas de los post-its.
const INTERVALO_NOTAS = 100;


// ---------- 2. Contenido de los post-its ----------

// Cada colección contiene exactamente cinco mensajes.
// Puedes personalizar estos textos sin modificar la lógica.

const COLECCIONES_DE_NOTAS: string[][] = [

  [
    "Quiero volver a conquistarte Bailando",
    "Eres el pedacito de vida que me faltaba.",
    "Vuelve a robarme mi celular y llenarla de tus fotos random.",
    "Gracias por estar aquí y entenderme.",
    "Gracias por aprender de Pokemon por mi"
  ],

  [
    "Quieres ir a bailar Dancehall conmigo?.",
    "Quiero sacarte tantas sonrisas que te acuerdes de como sonreia Michi.",
    "Enseñame a manejar para llevarte hasta el fin del mundo.",
    "Podemos ser dos viejitos mañosos y que tu mandes en la casa?.",
    "Quiero crear más recuerdos contigo."
  ],

  [
    "Estoy mejorando cada dia para ser mejor novio",
    "Y si nos tomamos más fotitos con caras random y dandote besitos y las presumo todos los dias?.",
    "Wannie me dijo que cuidara a Mama Mich por toda la vida.",
    "Alice se quejo conmigo de que no lo estoy haciendo bien y decidi mejorar para ser tu mejor compañia.",
    "Me encantaria seguir escribiendo una historia contigo"
  ],

  [
    "Hagamos que Jorgito y Michi sean felices juntos.",
    "Luego de ser tu FEFE puedo ser tu Bovio?.",
    "Volvamos a compartir nuestras cartas de Pokemon como la pareja de Umbreon y Espeon que somos",
    "Silver me conto una noche que tu me amabas, yo le dije que yo te amaba más y peleo conmigo.",
    "Eres mamá gata, puedo seguir siendo papá gato?"
  ],

  [
    "Tú eres mi moto mami, puedo ser tu carro papi?",
    "Me voy a meter a un jardin a robar claveles para amarte un ramo gigante.",
    "Y si compartimos nuestroz corazones cafes por toda la vida?",
    "Y si te acaricio la espalda sera que puedo llegar a acariciarte el alma?",
    "Nunca quise tener una familia... Hasta que la forme contigo"
  ]

];


// ---------- 3. Estado del módulo ----------

interface ElementoNota {
  contenedor: HTMLElement;
  texto: HTMLElement;
}

// Elementos HTML de los cinco post-its.
let elementosNotas: ElementoNota[] = [];

// Temporizador que espera antes de actualizar.
let temporizadorNotas: number | null = null;

// Índice de la colección actualmente mostrada.
let coleccionActual = -1;

// Evita inicializaciones duplicadas.
let inicializada = false;

// Identificador para invalidar actualizaciones anteriores.
let identificadorActualizacion = 0;

// Indica si existe una animación de actualización en curso.
let actualizacionEnCurso = false;


// ---------- 4. Inicialización ----------

export function iniciarNotas(): void {

  if (inicializada) {
    return;
  }

  // Buscar los cinco post-its.
  const notasEncontradas = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".nota[data-nota]"
    )
  );

  // Comprobar que existan exactamente cinco.
  if (notasEncontradas.length !== 5) {

    console.error(
      `Notas: se esperaban 5 elementos HTML y se encontraron ${notasEncontradas.length}.`
    );

    return;
  }

  // Ordenar según el atributo data-nota.
  notasEncontradas.sort(
    (a, b) =>
      Number(a.dataset.nota) - Number(b.dataset.nota)
  );

  // Comprobar que los identificadores sean válidos.
  const identificadoresValidos = notasEncontradas.every(
    (elemento, indice) =>
      Number(elemento.dataset.nota) === indice + 1
  );

  if (!identificadoresValidos) {

    console.error(
      "Notas: los atributos data-nota deben ir del 1 al 5."
    );

    return;
  }

  // Comprobar que cada post-it tenga un párrafo.
  const notasPreparadas: ElementoNota[] = [];

  for (const nota of notasEncontradas) {

    const parrafo = nota.querySelector<HTMLElement>("p");

    if (!parrafo) {

      console.error(
        `Notas: el elemento data-nota="${nota.dataset.nota}" no contiene un párrafo <p>.`
      );

      return;
    }

    notasPreparadas.push({
      contenedor: nota,
      texto: parrafo
    });

  }

  elementosNotas = notasPreparadas;

  // Registrar el evento de cambio de fotografía.
  document.addEventListener(
    "galeria:cambio",
    manejarCambioFotografia
  );

  // Mostrar la primera colección inmediatamente.
  mostrarColeccion(0);

  inicializada = true;

}


// ---------- 5. Detectar cambios de fotografía ----------

function manejarCambioFotografia(
  evento: Event
): void {

  const eventoGaleria = evento as CustomEvent<{
    indice: number;
  }>;

  const indice = eventoGaleria.detail?.indice;

  // Validar el índice recibido.
  if (
    typeof indice !== "number" ||
    !Number.isInteger(indice) ||
    indice < 0
  ) {
    return;
  }

  // Si hay una animación en curso, invalidarla inmediatamente.
  // No esperamos a que transcurran los cinco segundos.
  if (actualizacionEnCurso) {

    identificadorActualizacion++;

    actualizacionEnCurso = false;

    // La colección podría haber quedado parcialmente visible.
    coleccionActual = -1;

  }

  // Cancelar cualquier actualización pendiente.
  detenerTemporizador();

  // Programar la actualización de los post-its.
  temporizadorNotas = window.setTimeout(() => {

    temporizadorNotas = null;

    const indiceColeccion =
      indice % COLECCIONES_DE_NOTAS.length;

    void actualizarNotas(indiceColeccion);

  }, RETRASO_NOTAS);

}


// ---------- 6. Actualizar las notas ----------

async function actualizarNotas(
  indiceColeccion: number
): Promise<void> {

  // Evitar repetir una colección que ya está completamente visible.
  if (
    indiceColeccion === coleccionActual &&
    !actualizacionEnCurso
  ) {
    return;
  }

  const mensajes =
    COLECCIONES_DE_NOTAS[indiceColeccion];

  if (!mensajes || mensajes.length !== 5) {

    console.error(
      "Notas: la colección seleccionada no contiene cinco mensajes."
    );

    return;
  }

  // Identificador de esta actualización.
  const actualizacion = ++identificadorActualizacion;

  actualizacionEnCurso = true;

  // Animar la salida de los post-its.
  elementosNotas.forEach(({ contenedor }) => {

    contenedor.classList.remove("es-activa");

    contenedor.classList.add("es-saliendo");

  });

  await esperar(DURACION_SALIDA);

  // Comprobar si llegó una actualización más reciente.
  if (actualizacion !== identificadorActualizacion) {
    return;
  }

  // Actualizar el contenido sin eliminar los párrafos.
  elementosNotas.forEach(({ contenedor, texto }, indice) => {

    texto.textContent = mensajes[indice];

    contenedor.classList.remove("es-saliendo");

  });

  // Animar la entrada de cada post-it.
  for (
    let indice = 0;
    indice < elementosNotas.length;
    indice++
  ) {

    // Cancelar si existe una actualización más reciente.
    if (actualizacion !== identificadorActualizacion) {
      return;
    }

    elementosNotas[indice].contenedor.classList.add("es-activa");

    // Separación entre las entradas.
    await esperar(INTERVALO_NOTAS);

  }

  // Registrar la colección cuando todas las notas estén visibles.
  if (actualizacion === identificadorActualizacion) {

    coleccionActual = indiceColeccion;

    actualizacionEnCurso = false;

  }

}


// ---------- 7. Mostrar una colección ----------

function mostrarColeccion(
  indiceColeccion: number
): void {

  const mensajes =
    COLECCIONES_DE_NOTAS[indiceColeccion];

  if (!mensajes || mensajes.length !== 5) {
    return;
  }

  elementosNotas.forEach(({ contenedor, texto }, indice) => {

    texto.textContent = mensajes[indice];

    contenedor.classList.remove("es-saliendo");

    contenedor.classList.add("es-activa");

  });

  coleccionActual = indiceColeccion;

}


// ---------- 8. Detener temporizador ----------

function detenerTemporizador(): void {

  if (temporizadorNotas !== null) {

    window.clearTimeout(temporizadorNotas);

    temporizadorNotas = null;

  }

}


// ---------- 9. Utilidad de espera ----------

function esperar(milisegundos: number): Promise<void> {

  const movimientoReducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (movimientoReducido) {
    return Promise.resolve();
  }

  return new Promise((resolver) => {

    window.setTimeout(
      resolver,
      milisegundos
    );

  });

}


// ---------- 10. Liberar recursos ----------

export function destruirNotas(): void {

  detenerTemporizador();

  // Invalidar cualquier animación en ejecución.
  identificadorActualizacion++;

  actualizacionEnCurso = false;

  // Eliminar el evento.
  document.removeEventListener(
    "galeria:cambio",
    manejarCambioFotografia
  );

  // Limpiar las clases de animación.
  elementosNotas.forEach(({ contenedor }) => {

    contenedor.classList.remove(
      "es-activa",
      "es-saliendo"
    );

  });

  elementosNotas = [];

  coleccionActual = -1;

  inicializada = false;

}
