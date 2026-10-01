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