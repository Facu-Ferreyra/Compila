import type { Opcion, RondaEnJuego } from "./tipos";
const CORRECTAS_POR_RONDA =12;
const BONUS_RONDA_PERFECTA =3;

export function crearRonda(opciones: Opcion[]): RondaEnJuego {
  return { opciones, idsElegidas: [], pozo: 0, terminada: false };
}

export function elegirOpcion(ronda: RondaEnJuego, idOpcion: string): RondaEnJuego {
  if (ronda.terminada) {
    throw new Error("La ronda ya terminó");
  }

  const opcion = ronda.opciones.find((o) => o.id === idOpcion);
  if (!opcion) {
    throw new Error(`La opción ${idOpcion} no existe en la ronda`);
  }

  if(ronda.idsElegidas.includes(idOpcion)){throw new Error (`La opción ${idOpcion} ya ha sido seleccionada en la ronda`);}

  const idsElegidas = [...ronda.idsElegidas, idOpcion];

  if (!opcion.esCorrecta) {
    return { ...ronda, idsElegidas, pozo: 0, terminada: true };
  }

  const pozo =ronda.pozo +1;
  if (pozo===CORRECTAS_POR_RONDA){return { ...ronda, idsElegidas, pozo: CORRECTAS_POR_RONDA+BONUS_RONDA_PERFECTA, terminada : true};}

  return { ...ronda, idsElegidas, pozo};
}

export function plantarse (ronda: RondaEnJuego):RondaEnJuego{
  return{...ronda, terminada: true};
}

