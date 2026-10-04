export type Opcion = {
  id: string;
  texto: string;
  esCorrecta: boolean;
  explicacion: string;
};

export type RondaEnJuego = {
  opciones: Opcion[];
  idsElegidas: string[];
  pozo: number;
  terminada: boolean;
};

export type JugadorEnRonda = {
  id: string;
  pozo: number;
  enRonda: boolean;
};

export type RondaPorTurnos = {
  opciones: Opcion[];
  idsElegidas: string[];
  jugadores: JugadorEnRonda[];
  indiceTurno: number;
  terminada: boolean;
};