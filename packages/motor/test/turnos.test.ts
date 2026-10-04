import { describe, expect, it } from "vitest";
import { crearRondaPorTurnos } from "../src/turnos";
import { opcionesDePrueba } from "./ayudas";

describe("crearRondaPorTurnos", () => {
    it ("arranca con todos los jugadores en ronda, pozo 0 y el turno del primero", () => {
        const ronda = crearRondaPorTurnos(opcionesDePrueba(), ["ana","bot"]);

        expect(ronda.jugadores).toEqual([
            { id: "ana", pozo: 0, enRonda: true},
            { id: "bot", pozo: 0, enRonda: true},
        ]);

        
        expect(ronda.indiceTurno).toBe(0);
        expect(ronda.terminada).toBe(false);
    });
})