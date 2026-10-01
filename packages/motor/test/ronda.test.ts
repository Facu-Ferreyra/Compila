import { describe, expect, it } from "vitest";
import { crearRonda, elegirOpcion } from "../src/ronda";

function opcionesDePrueba() {
  const opciones = [];
  for (let i = 1; i <= 12; i++) {
    opciones.push({ id: `c${i}`, texto: `correcta ${i}`, esCorrecta: true, explicacion: "" });
  }
  for (let i = 1; i <= 4; i++) {
    opciones.push({ id: `m${i}`, texto: `mina ${i}`, esCorrecta: false, explicacion: "" });
  }
  return opciones;
}

describe("elegir una opción", () => {
  it("suma 1 al pozo cuando la opción es correcta", () => {
    const ronda = crearRonda(opcionesDePrueba());

    const despues = elegirOpcion(ronda, "c1");

    expect(despues.pozo).toBe(1);
  });
});