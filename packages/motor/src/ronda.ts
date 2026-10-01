import type { Opcion, RondaEnJuego } from "./tipos";

export function crearRonda(opciones: Opcion[]): RondaEnJuego {
  return { opciones, idsElegidas: [], pozo: 0, terminada: false };
}

export function elegirOpcion(ronda: RondaEnJuego, idOpcion: string): RondaEnJuego {
  return {
    ...ronda,
    idsElegidas: [...ronda.idsElegidas, idOpcion],
    pozo: ronda.pozo + 1,
  };
}