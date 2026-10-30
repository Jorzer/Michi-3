/* ==========================================================================
 
   gallery.ts — Gestión de la galería de fotografías
 
   Responsabilidades:
 
   1. Consultar las fotografías disponibles mediante un JSON local.
   2. Mostrar una fotografía a la vez.
   3. Respetar el orden definido en el manifiesto.
   4. Controlar la reproducción automática.
   5. Permitir navegación manual.
   6. Gestionar las transiciones.
   7. Sincronizar los post-its mediante el evento galeria:cambio.
 
   Integración:
 
   - index.html: elementos y controles de la galería.
   - layout.css: estilos y animaciones.
   - notes.ts: sincronización de mensajes.
   - main.ts: inicialización del módulo.
 
   No utiliza Firebase, bases de datos ni almacenamiento remoto.
 
   ========================================================================== */
 
 
interface ImagenGaleria {
  archivo: string;
  descripcion: string;
}
 
 
// ---------- 1. Configuración ----------
 
const RUTA_IMAGENES =
  `${import.meta.env.BASE_URL}recursos/imagenes/`;
 
const RUTA_MANIFIESTO =
  `${RUTA_IMAGENES}imagenes.json`;
 
const INTERVALO_AUTOMATICO = 7000;
const DURACION_TRANSICION = 300;
 
 
// ---------- 2. Elementos HTML ----------
 
const foto =
  document.querySelector<HTMLImageElement>("#foto");
 
const botonAnterior =
  document.querySelector<HTMLButtonElement>("#btn-anterior");
 
const botonSiguiente =
  document.querySelector<HTMLButtonElement>("#btn-siguiente");
 
const botonPausa =
  document.querySelector<HTMLButtonElement>("#btn-pausa");
 
 
// ---------- 3. Estado de la galería ----------
 
let imagenes: ImagenGaleria[] = [];
 
let indiceActual = 0;
 
let reproduccionActiva = true;
 
let temporizador: number | undefined;
 
let inicializada = false;
 
let cambiandoImagen = false;
 
// Identificador para invalidar operaciones pendientes
// cuando se destruye o reinicia la galería.
 
let sesion = 0;
 
 
// Preferencia de movimiento reducido
 
const movimientoReducido = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);
 
 
// ---------- 4. Cargar y validar el manifiesto ----------
 
async function cargarImagenes(): Promise<ImagenGaleria[]> {
 
  const respuesta = await fetch(RUTA_MANIFIESTO);
 
  if (!respuesta.ok) {
    throw new Error(
      `No se pudo cargar imagenes.json: ${respuesta.status}`
    );
  }
 
  const manifiesto: unknown = await respuesta.json();
 
  if (
    !manifiesto ||
    typeof manifiesto !== "object" ||
    !("imagenes" in manifiesto) ||
    !Array.isArray(manifiesto.imagenes)
  ) {
    throw new Error(
      "El manifiesto no tiene una estructura válida."
    );
  }
 
  const imagenesValidas = manifiesto.imagenes.filter(
    (imagen: unknown): imagen is ImagenGaleria => {
 
      if (
        !imagen ||
        typeof imagen !== "object" ||
        !("archivo" in imagen) ||
        !("descripcion" in imagen)
      ) {
        return false;
      }
 
      return (
        typeof imagen.archivo === "string" &&
        imagen.archivo.trim().length > 0 &&
        !imagen.archivo.includes("/") &&
        !imagen.archivo.includes("\\") &&
        typeof imagen.descripcion === "string"
      );
    }
  );
 
  if (imagenesValidas.length === 0) {
    throw new Error(
      "El manifiesto no contiene fotografías válidas."
    );
  }
 
  return imagenesValidas;
}
 
 
// ---------- 5. Precargar fotografías ----------
 
function precargarImagen(
  imagen: ImagenGaleria
): Promise<string> {
 
  return new Promise((resolve, reject) => {
 
    const nuevaImagen = new Image();
 
    nuevaImagen.onload = () => {
      resolve(nuevaImagen.src);
    };
 
    nuevaImagen.onerror = () => {
      reject(
        new Error(
          `No se pudo cargar la imagen: ${imagen.archivo}`
        )
      );
    };
 
    nuevaImagen.src =
      `${RUTA_IMAGENES}${encodeURIComponent(imagen.archivo)}`;
 
  });
}
 
 
// ---------- 6. Actualizar controles ----------
 
function actualizarControles(): void {
 
  if (botonAnterior) {
    botonAnterior.disabled =
      imagenes.length <= 1 || cambiandoImagen;
  }
 
  if (botonSiguiente) {
    botonSiguiente.disabled =
      imagenes.length <= 1 || cambiandoImagen;
  }
 
  if (botonPausa) {
    botonPausa.textContent =
      reproduccionActiva ? "Pausar" : "Reanudar";
 
    botonPausa.setAttribute(
      "aria-label",
      reproduccionActiva
        ? "Pausar presentación"
        : "Reanudar presentación"
    );
  }
}
 
 
// ---------- 7. Esperar las transiciones ----------
 
function esperarTransicion(): Promise<void> {
 
  if (movimientoReducido.matches) {
    return Promise.resolve();
  }
 
  return new Promise((resolve) => {
 
    window.setTimeout(
      resolve,
      DURACION_TRANSICION
    );
 
  });
}
 
 
// ---------- 8. Mostrar una fotografía ----------
 
async function mostrarImagen(
  indice: number,
  sesionActual: number = sesion
): Promise<boolean> {
 
  if (
    !foto ||
    !inicializada ||
    cambiandoImagen ||
    imagenes.length === 0
  ) {
    return false;
  }
 
  cambiandoImagen = true;
 
  actualizarControles();
 
  const nuevoIndice =
    (indice + imagenes.length) % imagenes.length;
 
  const nuevaImagen = imagenes[nuevoIndice];
 
  try {
 
    // Preparar la fotografía antes de mostrarla.
 
    const rutaImagen = await precargarImagen(nuevaImagen);
 
    // Comprobar que la operación sigue siendo válida.
 
    if (
      !inicializada ||
      sesion !== sesionActual
    ) {
      return false;
    }
 
    // Salida de la fotografía anterior.
 
    if (!foto.hidden) {
 
      foto.classList.add("es-saliendo");
 
      await esperarTransicion();
 
      if (
        !inicializada ||
        sesion !== sesionActual
      ) {
        return false;
      }
 
    }
 
    // Actualizar el contenido de la fotografía.
 
    foto.src = rutaImagen;
 
    foto.alt = nuevaImagen.descripcion;
 
    foto.hidden = false;
 
    indiceActual = nuevoIndice;
 
    // Entrada de la nueva fotografía.
 
    foto.classList.remove("es-saliendo");
 
    foto.classList.add("es-entrando");
 
    await esperarTransicion();
 
    if (
      !inicializada ||
      sesion !== sesionActual
    ) {
      return false;
    }
 
    foto.classList.remove("es-entrando");
 
    // Avisar a notes.ts que cambió la fotografía.
 
    document.dispatchEvent(
      new CustomEvent("galeria:cambio", {
        detail: {
          indice: indiceActual
        }
      })
    );
 
    return true;
 
  } catch (error) {
 
    console.error(
      "Error al mostrar la fotografía:",
      error
    );
 
    return false;
 
  } finally {
 
    // Evitar modificar el estado de una sesión nueva.
 
    if (sesion === sesionActual) {
 
      foto?.classList.remove(
        "es-saliendo",
        "es-entrando"
      );
 
      cambiandoImagen = false;
 
      actualizarControles();
 
    }
 
  }
 
}
 
 
// ---------- 9. Navegación manual ----------
 
async function mostrarAnterior(): Promise<void> {
 
  detenerTemporizador();
 
  await mostrarImagen(indiceActual - 1);
 
  programarSiguienteCambio();
 
}
 
 
async function mostrarSiguiente(): Promise<void> {
 
  detenerTemporizador();
 
  await mostrarImagen(indiceActual + 1);
 
  programarSiguienteCambio();
 
}
 
 
// ---------- 10. Reproducción automática ----------
 
function detenerTemporizador(): void {
 
  if (temporizador !== undefined) {
 
    window.clearTimeout(temporizador);
 
    temporizador = undefined;
 
  }
 
}
 
 
function programarSiguienteCambio(): void {
 
  detenerTemporizador();
 
  if (
    !inicializada ||
    !reproduccionActiva ||
    document.hidden ||
    imagenes.length <= 1
  ) {
    return;
  }
 
  temporizador = window.setTimeout(async () => {
 
    temporizador = undefined;
 
    await mostrarImagen(indiceActual + 1);
 
    programarSiguienteCambio();
 
  }, INTERVALO_AUTOMATICO);
 
}
 
 
// ---------- 11. Pausar y reanudar ----------
 
function alternarReproduccion(): void {
 
  reproduccionActiva = !reproduccionActiva;
 
  if (reproduccionActiva) {
 
    programarSiguienteCambio();
 
  } else {
 
    detenerTemporizador();
 
  }
 
  actualizarControles();
 
}
 
 
// ---------- 12. Visibilidad de la página ----------
 
function manejarVisibilidad(): void {
 
  if (document.hidden) {
 
    detenerTemporizador();
 
  } else {
 
    programarSiguienteCambio();
 
  }
 
}
 
 
// ---------- 13. Liberar eventos ----------
 
function liberarEventos(): void {
 
  botonAnterior?.removeEventListener(
    "click",
    mostrarAnterior
  );
 
  botonSiguiente?.removeEventListener(
    "click",
    mostrarSiguiente
  );
 
  botonPausa?.removeEventListener(
    "click",
    alternarReproduccion
  );
 
  document.removeEventListener(
    "visibilitychange",
    manejarVisibilidad
  );
 
}
 
 
// ---------- 14. Inicializar galería ----------
 
export async function iniciarGaleria(): Promise<void> {
 
  if (inicializada) {
    return;
  }
 
  if (!foto) {
 
    console.error(
      "No se encontró el elemento #foto."
    );
 
    return;
 
  }
 
  try {
 
    imagenes = await cargarImagenes();
 
    // Evitar que una inicialización anterior
    // continúe después de una destrucción.
 
    const sesionActual = ++sesion;
 
    inicializada = true;
 
    botonAnterior?.addEventListener(
      "click",
      mostrarAnterior
    );
 
    botonSiguiente?.addEventListener(
      "click",
      mostrarSiguiente
    );
 
    botonPausa?.addEventListener(
      "click",
      alternarReproduccion
    );
 
    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );
 
    // Mostrar la primera fotografía.
 
    const resultado = await mostrarImagen(
      0,
      sesionActual
    );
 
    if (!resultado) {
 
      throw new Error(
        "No se pudo mostrar la primera fotografía."
      );
 
    }
 
    programarSiguienteCambio();
 
  } catch (error) {
 
    liberarEventos();
 
    detenerTemporizador();
 
    inicializada = false;
 
    cambiandoImagen = false;
 
    foto?.classList.remove(
      "es-saliendo",
      "es-entrando"
    );
 
    actualizarControles();
 
    console.error(
      "No se pudo iniciar la galería:",
      error
    );
 
  }
 
}
 
 
// ---------- 15. Destruir galería ----------
 
export function destruirGaleria(): void {
 
  // Invalidar operaciones asíncronas pendientes.
 
  sesion++;
 
  detenerTemporizador();
 
  liberarEventos();
 
  foto?.classList.remove(
    "es-saliendo",
    "es-entrando"
  );
 
  inicializada = false;
 
  cambiandoImagen = false;
 
  actualizarControles();
 
}