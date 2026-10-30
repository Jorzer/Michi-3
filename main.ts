
import { iniciarParallax } from "./src/ts/parallax.js";
import { iniciarGaleria } from "./src/ts/gallery.js";
import { iniciarNotas } from "./src/ts/notes.js";
import { iniciarAnimales } from "./src/ts/animals.js";

/**
 * Inicializa todos los módulos de la aplicación.
 */
async function iniciarAplicacion(): Promise<void> {
  try {
    // 1. Movimiento sutil de los elementos de la página
    iniciarParallax();

    // 2. Preparar los post-its para escuchar los cambios de fotografía
    iniciarNotas();

    // 3. Activar las apariciones aleatorias de los animales
    iniciarAnimales();

    // 4. Cargar e iniciar la galería
    await iniciarGaleria();

    console.log("Aplicación iniciada correctamente.");
  } catch (error) {
    console.error("Error al iniciar la aplicación:", error);
  }
}

/**
 * Esperar a que el documento HTML esté disponible.
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void iniciarAplicacion();
  }, { once: true });
} else {
  void iniciarAplicacion();
}
