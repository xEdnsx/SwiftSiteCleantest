/**
 * Tema claro / oscuro. Lógica pura (sin Angular) para poder probarla con `npm test`.
 * - Si la persona eligió un tema, se respeta (se guarda en localStorage).
 * - Si nunca eligió, se sigue el del teléfono (prefers-color-scheme).
 */
export type Tema = 'claro' | 'oscuro';

export const CLAVE_TEMA = 'swiftsite.tema';

export function esTema(valor: unknown): valor is Tema {
  return valor === 'claro' || valor === 'oscuro';
}

/** Tema a usar: el guardado si es válido; si no, el del sistema. */
export function resolverTema(guardado: unknown, sistemaOscuro: boolean): Tema {
  if (esTema(guardado)) return guardado;
  return sistemaOscuro ? 'oscuro' : 'claro';
}

/** Color de la barra del navegador (meta theme-color) para cada tema. */
export function colorBarra(tema: Tema): string {
  return tema === 'oscuro' ? '#071428' : '#F2F8FC';
}

function leer(): string | null {
  try { return localStorage.getItem(CLAVE_TEMA); } catch { return null; }
}

export function temaActual(): Tema {
  const sistema = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return resolverTema(leer(), sistema);
}

/** Aplica el tema al documento (clase en <html> + color de barra). */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  raiz.classList.toggle('oscuro', tema === 'oscuro');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorBarra(tema));
}

/** Guarda la elección de la persona y la aplica. */
export function elegirTema(tema: Tema): void {
  try { localStorage.setItem(CLAVE_TEMA, tema); } catch { /* sin almacenamiento: solo vale esta sesión */ }
  aplicarTema(tema);
}

/** Se llama una vez al arrancar, antes de pintar, para evitar el parpadeo. */
export function iniciarTema(): void {
  aplicarTema(temaActual());
}
