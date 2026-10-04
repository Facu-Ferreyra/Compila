import type { Opcion, RondaPorTurnos } from "./tipos";

export function crearRondaPorTurnos(opciones: Opcion[], idsJugadores: string[]): RondaPorTurnos {
  const jugadores = idsJugadores.map((id) => ({ id, pozo: 0, enRonda: true }));

  return { opciones, idsElegidas: [], jugadores, indiceTurno: 0, terminada: false };
}