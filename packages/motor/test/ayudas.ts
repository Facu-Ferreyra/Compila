export function opcionesDePrueba() {
  const opciones = [];
  for (let i = 1; i <= 12; i++) {
    opciones.push({ id: `c${i}`, texto: `correcta ${i}`, esCorrecta: true, explicacion: "" });
  }
  for (let i = 1; i <= 4; i++) {
    opciones.push({ id: `m${i}`, texto: `mina ${i}`, esCorrecta: false, explicacion: "" });
  }
  return opciones;
}