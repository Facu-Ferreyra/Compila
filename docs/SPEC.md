# Buscaminas de Programación — Especificación v0.3

> Estado: **aprobada para empezar la implementación**. Las decisiones tomadas están en la sección 11.
> Regla del proyecto: ningún comportamiento se programa si no está descrito acá. Si el código y la spec no coinciden, se corrige uno de los dos a propósito, nunca por accidente.

---

## 1. Resumen

Juego web de preguntas de programación con mecánica de "arriesgar o plantarse". Cada ronda muestra una **consigna** y **16 opciones**: 12 la cumplen (correctas) y 4 no (minas). El jugador elige opciones una por una para acumular puntos y decide cuándo plantarse antes de tocar una mina.

**Público:** estudiantes y desarrolladores que quieren repasar conceptos jugando.
**Objetivo del proyecto:** pieza de portfolio full stack TypeScript.

---

## 2. Glosario

| Término | Definición |
|---|---|
| Ronda | Una consigna + 16 opciones (12 correctas, 4 minas). |
| Opción | Un texto elegible (ej. `map`). Tiene `esCorrecta` y una `explicacion`. |
| Mina | Opción que **no** cumple la consigna. |
| Pozo | Puntos acumulados en la ronda actual, todavía no asegurados. |
| Plantarse | Terminar la ronda voluntariamente y sumar el pozo al puntaje total. |
| Ronda perfecta | Encontrar las 12 correctas sin tocar una mina. |
| Partida | Secuencia completa de rondas de un modo de juego. |
| Desafío diario | Conjunto de rondas idéntico para todos los usuarios en un día dado. El día es calendario en **hora de Argentina** (`America/Argentina/Buenos_Aires`, UTC−3): el desafío cambia a las 00:00 de Argentina. |

---

## 3. Reglas del modo Solo

1. La ronda empieza con `pozo = 0`. Las 16 opciones se muestran en orden aleatorio.
2. En cada acción, el jugador puede:
   - **Elegir una opción no elegida antes:**
     - Si es correcta → `pozo += 1`, la opción queda marcada como acierto.
     - Si es mina → `pozo = 0`, la ronda termina, se revelan todas las respuestas.
   - **Plantarse** → `puntajeTotal += pozo`, la ronda termina, se revelan todas las respuestas.
3. Si el jugador encuentra las 12 correctas → `pozo = 15` (12 + 3 de bonus), se suma al total y la ronda termina.
4. Al terminar cada ronda se muestran las explicaciones de todas las opciones.
5. Plantarse con `pozo = 0` está permitido (equivale a pasar la ronda).
6. La partida termina al completar todas las rondas.

**Puntaje máximo por ronda:** 15. **Puntaje máximo de partida:** `15 × cantidadDeRondas`.

✅ **Decidido — Cantidad de rondas por partida:** **10 rondas** por desafío diario, tomadas de un banco de rondas aprobadas, sin repetir una ronda hasta agotar el banco.

---

## 4. Contenido de las rondas

### 4.1 Requisitos de cada ronda
- Exactamente 16 opciones: 12 correctas y 4 minas.
- Cada opción tiene una sola respuesta defendible. Si una opción es discutible, se reemplaza.
- Cada opción tiene una `explicacion` de máximo 140 caracteres.
- Las minas deben ser **errores plausibles** (ej. `append` en una consigna sobre arrays de JavaScript, porque es de Python), no opciones absurdas.
- Cada ronda tiene `categoria` (ej. JavaScript, SQL, Git) y `dificultad` (1 a 5).

### 4.2 Estados de una ronda
`BORRADOR` → `APROBADA` → (opcional) `ARCHIVADA`.
Solo las rondas `APROBADA` pueden aparecer en partidas.

### 4.3 Generación asistida por IA (panel de administración)
- Solo accesible para usuarios con rol `ADMIN` (ver sección 6.4).
- Un administrador pide al LLM una ronda indicando categoría y dificultad.
- El resultado se valida contra un esquema (16 opciones, 12/4, explicaciones presentes). Si no cumple, se descarta.
- La ronda se guarda como `BORRADOR`. **Nunca** se aprueba automáticamente: un humano la revisa, edita y aprueba.

---

## 5. Modo Vs IA

El rival es un **bot con reglas**, no un modelo de lenguaje. El servidor conoce las respuestas; la dificultad simula errores humanos.

### 5.1 Dinámica
✅ **Decidido:** tablero compartido, turnos alternados, mismas reglas que la sección 7.2. La variante "cada uno en su tablero" queda para una versión futura (ver sección 10).

### 5.2 Dificultades

| Dificultad | Probabilidad de elegir una correcta en cada turno | Se planta cuando el pozo llega a |
|---|---|---|
| Básico | 60 % | 4 |
| Intermedio | 75 % | 8 |
| Avanzado | 90 % | nunca (busca la ronda perfecta) |

Los valores son iniciales y se ajustarán con pruebas de juego.

### 5.3 Diseño
- Todo participante implementa la interfaz `Jugador`. `JugadorHumano` recibe su acción del cliente; `JugadorBot` la calcula.
- Cada modo de juego define su propia `EstrategiaBot`. Agregar un modo nuevo no modifica estrategias existentes.
- El bot espera entre 0,8 y 2 segundos antes de actuar, para que el humano pueda seguir la jugada.

---

## 6. Usuarios, perfil y ranking

### 6.1 Cuenta
- Registro con email y contraseña. Nombre de usuario único, visible en el ranking.
- ✅ **Decidido:** también login con GitHub (OAuth).
- Si alguien entra con GitHub y ya existe una cuenta con el mismo email **verificado**, se vincula a esa cuenta en lugar de crear una duplicada.

### 6.2 Perfil
Muestra: nombre de usuario, avatar, partidas jugadas, mejor puntaje, racha de días consecutivos jugando el desafío diario, porcentaje de rondas perfectas.

### 6.3 Ranking
- **Solo cuenta el desafío diario en modo Solo.** Vs IA y Salas no suman al ranking general, para evitar acumular puntos contra bots fáciles.
- Un intento por usuario por día.
- Tablas: ranking del día e histórico (suma de puntajes).

### 6.4 Roles
- Cada usuario tiene un campo `rol` con valores `USER` o `ADMIN`. Valor por defecto: `USER`.
- **Ningún endpoint público permite asignar o cambiar el rol.** El registro siempre crea `USER`.
- El admin se define con la variable de entorno `ADMIN_EMAIL`. Un script de seed (`npm run seed:admin`) busca ese usuario y le asigna `ADMIN`.
- El backend verifica el rol en cada endpoint de administración (`/admin/*`). Ocultar el panel en el frontend es solo comodidad visual, no seguridad.
- En v1 hay un solo admin, pero el modelo admite varios sin cambios.

---

## 7. Salas multijugador

### 7.1 Creación y acceso
- Un usuario registrado crea una sala y recibe un link con código único (ej. `/sala/X7K2P9`).
- Solo usuarios registrados pueden unirse. Si quien abre el link no inició sesión, se lo manda al login y luego vuelve a la sala.
- Máximo **6 jugadores** por sala. El creador es el **anfitrión** y es quien inicia la partida.
- Una sala sin actividad durante 30 minutos se cierra.

### 7.2 Reglas de juego
✅ **Decidido — Pozos individuales con eliminación** (sujeto a revisión tras pruebas de juego):
1. Tablero compartido, turnos en orden fijo.
2. En su turno, cada jugador elige una opción o se planta.
3. Correcta → `+1` a **su** pozo. Mina → pierde **su** pozo y queda fuera de la ronda. Plantarse → asegura su pozo y queda fuera de la ronda.
4. La ronda termina cuando todos quedaron fuera o se encontraron las 12 correctas.
5. Si se encuentran las 12, los jugadores que siguen en la ronda reciben +3 de bonus.

### 7.3 Turnos y desconexiones
- Tiempo límite por turno: **30 segundos**. Si vence, el jugador se planta automáticamente.
- Si un jugador se desconecta, tiene 60 segundos para reconectarse. Mientras tanto, sus turnos se resuelven como "plantarse".
- Si el anfitrión se va, el rol pasa al jugador que se unió primero.

---

## 8. Seguridad e integridad

- El cliente **nunca** recibe `esCorrecta` de una opción antes de elegirla. Las respuestas se revelan solo al terminar la ronda.
- Toda jugada se valida en el servidor: turno correcto, opción existente y no elegida antes, ronda activa.
- El puntaje lo calcula y guarda exclusivamente el servidor.
- Límite de peticiones en login y registro.

---

## 9. Requisitos no funcionales

- Diseño responsivo (usable en celular).
- Accesible: el tablero se puede jugar con teclado, y los estados acierto/mina no dependen solo del color.
- El motor del juego no depende de frameworks y tiene tests unitarios.
- CI: los tests corren en cada push; no se mergea a `main` con tests fallando.

---

## 10. Fuera de alcance (v1)

- Otros modos de juego además del Buscaminas.
- Chat dentro de las salas.
- Bots dentro de salas multijugador.
- Vs IA: elegir entre tablero compartido por turnos o cada jugador en su propio tablero.
- Gestión de roles desde la interfaz (en v1 se asignan solo por script).
- Aplicación móvil nativa.

---

## 11. Registro de decisiones

| # | Tema | Decisión |
|---|---|---|
| 1 | Rondas por partida | 10 |
| 2 | Vs IA: tablero | Compartido con turnos |
| 3 | Login | Email + contraseña y GitHub |
| 4 | Mina en salas | Pozos individuales con eliminación |
| 5 | Definición del admin | Campo `rol` + script de seed con `ADMIN_EMAIL` |
| 6 | Zona horaria del desafío diario | Hora de Argentina (UTC−3) |
| 7 | Stack y arquitectura | Ver `docs/ARQUITECTURA.md` |
