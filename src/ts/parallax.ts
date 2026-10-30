
/* ==========================================================================
   parallax.ts — Efecto de profundidad según el movimiento del cursor

   Responsabilidades:
   1. Detectar la posición del cursor.
   2. Normalizar las coordenadas entre -1 y 1.
   3. Suavizar el desplazamiento mediante interpolación.
   4. Aplicar movimiento según la profundidad de cada elemento.
   5. Respetar las preferencias de accesibilidad.

   Integración:
   - base.css: configuración global y accesibilidad.
   - layout.css: atributo [data-profundidad] y propiedades CSS.
   - main.ts: inicialización del módulo.
   ========================================================================== */


// ---------- 1. Configuración ----------

// Velocidad de interpolación.
// Menor valor = movimiento más lento y suave.

const SUAVIDAD = 0.08;

// Desplazamiento máximo por nivel de profundidad.

const DESPLAZAMIENTO = 3;

// Precisión para detener la animación.

const UMBRAL = 0.001;


// ---------- 2. Estado del parallax ----------

// Posición objetivo determinada por el cursor.

let objetivoX = 0;
let objetivoY = 0;

// Posición actual interpolada.

let posicionX = 0;
let posicionY = 0;

// Identificador del frame de animación.

let frameId: number | null = null;

// Evitar inicializaciones duplicadas.

let inicializado = false;


// ---------- 3. Inicialización ----------

export function iniciarParallax(): void {

  // Evitar registrar los mismos eventos varias veces.

  if (inicializado) {
    return;
  }

  // Detectar dispositivos con cursor preciso.

  const tieneCursor = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  // Detectar preferencia de movimiento reducido.

  const reducirMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // No activar el efecto si no corresponde.

  if (!tieneCursor.matches || reducirMovimiento.matches) {
    return;
  }

  // Registrar eventos.

  window.addEventListener(
    "pointermove",
    manejarMovimiento,
    { passive: true }
  );

  document.addEventListener(
    "pointerleave",
    regresarAlCentro
  );

  window.addEventListener(
    "blur",
    regresarAlCentro
  );

  inicializado = true;
}


// ---------- 4. Detección del cursor ----------

function manejarMovimiento(evento: PointerEvent): void {

  // Ignorar movimientos que no provengan de un mouse.

  if (evento.pointerType !== "mouse") {
    return;
  }

  // Normalizar las coordenadas entre -1 y 1.
  // El centro de la pantalla representa 0.

  objetivoX = (evento.clientX / window.innerWidth) * 2 - 1;

  objetivoY = (evento.clientY / window.innerHeight) * 2 - 1;

  // Iniciar la animación.

  solicitarAnimacion();
}


// ---------- 5. Regresar al centro ----------

function regresarAlCentro(): void {

  objetivoX = 0;
  objetivoY = 0;

  solicitarAnimacion();
}


// ---------- 6. Solicitar animación ----------

function solicitarAnimacion(): void {

  // Evitar múltiples ciclos simultáneos.

  if (frameId !== null) {
    return;
  }

  frameId = requestAnimationFrame(actualizarParallax);
}


// ---------- 7. Aplicar desplazamiento ----------

function aplicarDesplazamiento(): void {

  const elementos = document.querySelectorAll<HTMLElement>(
    "[data-profundidad]"
  );

  elementos.forEach((elemento) => {

    // Obtener el nivel de profundidad definido en el HTML.

    const profundidad = Number(elemento.dataset.profundidad);

    // Ignorar valores inválidos o negativos.

    if (!Number.isFinite(profundidad) || profundidad < 0) {
      return;
    }

    // Calcular el desplazamiento contrario al cursor.

    const x = -posicionX * profundidad * DESPLAZAMIENTO;

    const y = -posicionY * profundidad * DESPLAZAMIENTO;

    // Entregar los valores al CSS.

    elemento.style.setProperty(
      "--parallax-x",
      `${x}px`
    );

    elemento.style.setProperty(
      "--parallax-y",
      `${y}px`
    );

  });
}


// ---------- 8. Motor de animación ----------

function actualizarParallax(): void {

  // Liberar el identificador del frame actual.

  frameId = null;

  // Interpolación lineal (LERP).

  posicionX += (objetivoX - posicionX) * SUAVIDAD;

  posicionY += (objetivoY - posicionY) * SUAVIDAD;

  // Comprobar si todavía existe movimiento pendiente.

  const diferenciaX = Math.abs(objetivoX - posicionX);

  const diferenciaY = Math.abs(objetivoY - posicionY);

  const movimientoPendiente =
    diferenciaX > UMBRAL ||
    diferenciaY > UMBRAL;

  // Ajustar exactamente al objetivo cuando el movimiento
  // sea suficientemente pequeño.

  if (!movimientoPendiente) {

    posicionX = objetivoX;
    posicionY = objetivoY;

  }

  // Aplicar el desplazamiento una sola vez por frame.

  aplicarDesplazamiento();

  // Continuar únicamente si todavía existe movimiento.

  if (movimientoPendiente) {
    solicitarAnimacion();
  }

}
