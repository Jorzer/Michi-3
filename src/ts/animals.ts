
/* ==========================================================================
   animals.ts — Comportamiento de los pequeños visitantes

   Responsabilidades:
   1. Detectar los tres animales del HTML.
   2. Seleccionar aleatoriamente cuál aparecerá.
   3. Controlar cuánto tiempo permanece visible.
   4. Evitar apariciones consecutivas del mismo animal.
   5. Respetar la visibilidad de la página.
   6. Evitar temporizadores y eventos duplicados.

   Integración:
   - index.html: elementos .animal[data-animal].
   - layout.css: clase .es-asomado.
   - main.ts: inicialización del módulo.
   ========================================================================== */


// ---------- 1. Configuración ----------

// Tiempo mínimo entre apariciones.
const ESPERA_MINIMA = 4000;

// Tiempo máximo entre apariciones.
const ESPERA_MAXIMA = 10000;

// Permanencia mínima visible.
const PERMANENCIA_MINIMA = 2500;

// Permanencia máxima visible.
const PERMANENCIA_MAXIMA = 5500;


// ---------- 2. Tipos ----------

type AnimalId =
  | "gato-calico"
  | "gato-atigrado"
  | "hamster";

interface Animal {
  id: AnimalId;
  elemento: HTMLElement;
}


// ---------- 3. Estado del módulo ----------

// Animales encontrados en el HTML.
let animales: Animal[] = [];

// Animal actualmente visible.
let animalActivo: Animal | null = null;

// Último animal que apareció.
let ultimoAnimal: AnimalId | null = null;

// Temporizador de la siguiente aparición.
let temporizador: number | null = null;

// Temporizador para ocultar al animal.
let temporizadorOcultar: number | null = null;

// Estado de visibilidad de la página.
let paginaVisible = !document.hidden;

// Evita inicializaciones duplicadas.
let inicializado = false;


// ---------- 4. Inicialización ----------

export function iniciarAnimales(): void {

  if (inicializado) {
    return;
  }

  // Actualizar el estado real de visibilidad.
  paginaVisible = !document.hidden;

  // Buscar los animales definidos en el HTML.
  const elementos = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".animal[data-animal]"
    )
  );

  // Identificadores permitidos.
  const identificadoresValidos: AnimalId[] = [
    "gato-calico",
    "gato-atigrado",
    "hamster"
  ];

  // Obtener los identificadores encontrados.
  const identificadoresEncontrados = elementos.map(
    (elemento) => elemento.dataset.animal
  );

  // Comprobar que existan exactamente tres elementos.
  const cantidadCorrecta =
    elementos.length === identificadoresValidos.length;

  // Comprobar que todos los identificadores sean válidos.
  const todosValidos = identificadoresEncontrados.every(
    (id) =>
      identificadoresValidos.includes(id as AnimalId)
  );

  // Comprobar que no existan identificadores duplicados.
  const sinDuplicados =
    new Set(identificadoresEncontrados).size ===
    identificadoresValidos.length;

  if (
    !cantidadCorrecta ||
    !todosValidos ||
    !sinDuplicados
  ) {

    console.error(
      "Animales: se esperaban exactamente tres elementos únicos: gato-calico, gato-atigrado y hamster."
    );

    animales = [];

    return;
  }

  // Preparar los elementos.
  animales = elementos.map((elemento) => ({
    id: elemento.dataset.animal as AnimalId,
    elemento
  }));

  // Asegurar que comiencen ocultos.
  animales.forEach((animal) => {

    animal.elemento.classList.remove(
      "es-asomado"
    );

  });

  // Registrar cambios de visibilidad.
  document.addEventListener(
    "visibilitychange",
    manejarVisibilidad
  );

  inicializado = true;

  // Programar la primera aparición.
  if (paginaVisible) {
    programarAparicion();
  }

}


// ---------- 5. Programar aparición ----------

function programarAparicion(): void {

  detenerTemporizador();

  if (
    !inicializado ||
    !paginaVisible ||
    animales.length === 0 ||
    animalActivo !== null
  ) {
    return;
  }

  const espera = numeroAleatorio(
    ESPERA_MINIMA,
    ESPERA_MAXIMA
  );

  temporizador = window.setTimeout(
    mostrarAnimal,
    espera
  );

}


// ---------- 6. Mostrar un animal ----------

function mostrarAnimal(): void {

  temporizador = null;

  if (
    !paginaVisible ||
    !inicializado ||
    animalActivo !== null
  ) {
    return;
  }

  // Obtener candidatos excluyendo al último animal.
  const candidatos = animales.filter(
    (animal) => animal.id !== ultimoAnimal
  );

  // Seleccionar un candidato aleatorio.
  const indice = Math.floor(
    Math.random() * candidatos.length
  );

  const seleccionado = candidatos[indice];

  if (!seleccionado) {
    return;
  }

  // Mostrar al animal.
  seleccionado.elemento.classList.add("es-asomado");

  animalActivo = seleccionado;

  ultimoAnimal = seleccionado.id;

  // Determinar cuánto tiempo permanecerá visible.
  const permanencia = numeroAleatorio(
    PERMANENCIA_MINIMA,
    PERMANENCIA_MAXIMA
  );

  temporizadorOcultar = window.setTimeout(
    ocultarAnimal,
    permanencia
  );

}


// ---------- 7. Ocultar al animal ----------

function ocultarAnimal(): void {

  temporizadorOcultar = null;

  if (animalActivo === null) {
    return;
  }

  // Retirar la clase que activa la aparición.
  animalActivo.elemento.classList.remove(
    "es-asomado"
  );

  animalActivo = null;

  // Programar la siguiente aparición.
  programarAparicion();

}


// ---------- 8. Control de visibilidad ----------

function manejarVisibilidad(): void {

  paginaVisible = !document.hidden;

  if (!paginaVisible) {

    // Detener las apariciones mientras la página está oculta.
    detenerTemporizador();

    detenerTemporizadorOcultar();

    // Ocultar cualquier animal que estuviera visible.
    if (animalActivo !== null) {

      animalActivo.elemento.classList.remove(
        "es-asomado"
      );

      animalActivo = null;

    }

    return;
  }

  // Al regresar a la página, comenzar un nuevo ciclo.
  programarAparicion();

}


// ---------- 9. Control de temporizadores ----------

function detenerTemporizador(): void {

  if (temporizador !== null) {

    window.clearTimeout(temporizador);

    temporizador = null;

  }

}


function detenerTemporizadorOcultar(): void {

  if (temporizadorOcultar !== null) {

    window.clearTimeout(temporizadorOcultar);

    temporizadorOcultar = null;

  }

}


// ---------- 10. Generador de números aleatorios ----------

function numeroAleatorio(
  minimo: number,
  maximo: number
): number {

  return Math.floor(
    Math.random() * (maximo - minimo + 1)
  ) + minimo;

}


// ---------- 11. Liberar recursos ----------

export function destruirAnimales(): void {

  detenerTemporizador();

  detenerTemporizadorOcultar();

  document.removeEventListener(
    "visibilitychange",
    manejarVisibilidad
  );

  // Ocultar todos los animales.
  animales.forEach((animal) => {

    animal.elemento.classList.remove(
      "es-asomado"
    );

  });

  animales = [];

  animalActivo = null;

  ultimoAnimal = null;

  inicializado = false;

}
