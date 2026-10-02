import { describe, expect, it } from "vitest";
import { crearRonda, elegirOpcion, plantarse } from "../src/ronda";

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

  it("deja el pozo en 0 y termina la ronda cuando la opción es una mina", () => {
    const ronda = crearRonda(opcionesDePrueba());
    const conDosAciertos = elegirOpcion(elegirOpcion(ronda, "c1"), "c2");

    const despues = elegirOpcion(conDosAciertos, "m1");

    expect(despues.pozo).toBe(0);
    expect(despues.terminada).toBe(true);
  });

  it("deja el pozo en 15 y termina la ronda al encontrar las 12 correctas", () => {
    let ronda = crearRonda(opcionesDePrueba());
    
    for (let i = 1; i <= 12; i++) {
    ronda = elegirOpcion(ronda,`c${i}`);
    }

    expect(ronda.pozo).toBe(15);
    expect(ronda.terminada).toBe(true);
  });
});

describe("plantarse", () => {
  it ("termina la ronda y conserva el pozo y las opciones elegidas", () =>{
    const ronda = crearRonda(opcionesDePrueba());
    const conDosAciertos = elegirOpcion(elegirOpcion(ronda,"c1"),"c2");

    const despues = plantarse(conDosAciertos);

    expect(despues.pozo).toBe(2);
    expect(despues.terminada).toBe(true);
    expect(despues.idsElegidas).toEqual(["c1", "c2"]);
  })
})

describe("jugadas inválidas", () => {
  it ("lanza un error al elegir una opción ya elegida", () =>{
    const ronda = crearRonda(opcionesDePrueba());
    const conUnAcierto = elegirOpcion(ronda,"c1");

    expect(() => elegirOpcion(conUnAcierto, "c1")).toThrow();
  })

  it("lanza un error al elegir una opción en una ronda terminada", () => {
    const ronda = crearRonda(opcionesDePrueba());
    const terminadaPorMina = elegirOpcion(ronda, "m1");

    expect(() => elegirOpcion(terminadaPorMina, "c1")).toThrow();
  });

  it("lanza un error al elegir una opción que no existe en la ronda", () => {
    const ronda = crearRonda(opcionesDePrueba());

    expect(() => elegirOpcion(ronda, "no-existe")).toThrow();
  });

  it("lanza un error al plantarse en una ronda terminada", () => {
    const ronda = crearRonda(opcionesDePrueba());
    const terminadaPorMina = elegirOpcion(ronda, "m1");

    expect(() => plantarse(terminadaPorMina)).toThrow();
  });
})
