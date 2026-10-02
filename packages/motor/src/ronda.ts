import type { Opcion, RondaEnJuego } from "./tipos";

export function crearRonda(opciones: Opcion[]): RondaEnJuego {
  return { opciones, idsElegidas: [], pozo: 0, terminada: false };
}

export function elegirOpcion(ronda: RondaEnJuego, idOpcion: string): RondaEnJuego {
  const opcion = ronda.opciones.find((o) => o.id === idOpcion);
  if (!opcion) {
    throw new Error(`La opción ${idOpcion} no existe en la ronda`);
  }

  const idsElegidas = [...ronda.idsElegidas, idOpcion];

  if (!opcion.esCorrecta) {
    return { ...ronda, idsElegidas, pozo: 0, terminada: true };
  }

  return { ...ronda, idsElegidas, pozo: ronda.pozo + 1 };
}