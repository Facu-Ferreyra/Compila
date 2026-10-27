# Buscaminas de Programación — Arquitectura v0.2

> Complementa a `docs/SPEC.md`. La spec dice **qué** hace el sistema; este documento dice **cómo** está construido.
> Todo lo marcado como *provisional* se confirma o corrige al llegar al paso correspondiente de la hoja de ruta (sección 9), y el cambio se registra acá en el mismo commit.

---

## 1. Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| Lenguaje | TypeScript (modo `strict`) en todo el proyecto | Un solo lenguaje, tipos compartidos entre front y back |
| Monorepo | pnpm workspaces | Paquetes internos sin publicar en npm |
| Motor del juego | TypeScript puro + Vitest | Sin dependencias de frameworks; se testea aislado |
| Backend | NestJS | Arquitectura modular, guards para auth/roles, soporte de WebSockets |
| Base de datos | PostgreSQL | Relacional; ranking y partidas son consultas con joins |
| ORM | Prisma | Consultas tipadas y migraciones versionadas |
| Tiempo real | Socket.IO vía `@nestjs/websockets` | Salas multijugador |
| Frontend | Next.js (App Router) + React | Visto en el curso; SEO para las páginas públicas |
| Tests backend | Jest (default de NestJS) + Supertest | Tests de endpoints |
| Contenedores | Docker + docker-compose | PostgreSQL local desde el paso 2 |
| CI | GitHub Actions | Lint + tests en cada push y PR |

Las versiones exactas se fijan al crear cada paquete, usando la última LTS/estable disponible en ese momento.

---

## 2. Estructura del monorepo

```
buscaminas/
├── CLAUDE.md                 ← instrucciones para el asistente local
├── docs/
│   ├── SPEC.md
│   └── ARQUITECTURA.md
├── packages/
│   └── motor/                ← lógica del juego + tipos compartidos
│       ├── src/
│       │   ├── tipos.ts      ← Ronda, Opcion, RondaEnJuego, Accion...
│       │   ├── ronda.ts      ← reglas de la sección 3 de la spec
│       │   ├── jugador.ts    ← interfaz Jugador
│       │   └── bot/          ← EstrategiaBot y sus implementaciones
│       └── test/
├── apps/
│   ├── api/                  ← NestJS
│   └── web/                  ← Next.js
├── docker-compose.yml
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

**Regla de dependencias:** `api` y `web` pueden importar de `motor`. `motor` no importa de nadie. `web` nunca importa de `api` (se comunican solo por HTTP y WebSocket).

---

## 3. Paquete `motor`

- Contiene **toda** la lógica de reglas: elegir opción, plantarse, ronda perfecta, fin de ronda, turnos, eliminación.
- Funciones puras siempre que sea posible: reciben un estado y una acción, devuelven un estado nuevo (sin mutar el anterior).
- No sabe nada de HTTP, base de datos ni sockets.
- Exporta también los tipos que usa el frontend para no duplicarlos.
- **Tipos públicos vs privados:** `OpcionPublica` (sin `esCorrecta`) es lo único que viaja al cliente durante una ronda activa. Ver spec, sección 8.

---

## 4. Backend (`apps/api`) — módulos NestJS

| Módulo | Responsabilidad |
|---|---|
| `PrismaModule` | Conexión a la base de datos, compartida por todos |
| `AuthModule` | Registro, login email/contraseña, OAuth GitHub, emisión y refresco de tokens |
| `UsuariosModule` | Perfil, estadísticas |
| `RondasModule` | Banco de rondas (lectura para el juego, CRUD para admin) |
| `RondasPropiasModule` | CRUD de las rondas privadas de cada usuario (spec 6.5) |
| `PartidasModule` | Modo Solo y Vs IA; usa `motor` |
| `DesafioDiarioModule` | Selección de las 10 rondas del día y cambio a las 00:00 de Argentina |
| `RankingModule` | Consultas de ranking diario e histórico |
| `SalasModule` | Gateway de Socket.IO, estado de salas, turnos, reconexión |
| `AdminModule` | Generación de rondas con LLM, aprobación |

**Capas dentro de cada módulo:** `controller` (HTTP) → `service` (reglas de negocio, llama a `motor`) → Prisma. Los controllers no contienen lógica.

---

## 5. Autenticación y autorización

- La autenticación vive **solo en el backend**. Next.js no maneja sesiones propias.
- **Access token:** JWT de vida corta (~15 min). Viaja en el header `Authorization: Bearer …` y en el `auth` del handshake de Socket.IO.
- **Contraseñas:** se guardan hasheadas con **argon2id** (alternativa: bcrypt). El hash nunca sale del backend.
- **Refresh token:** vida larga, en cookie `httpOnly`, `Secure`, `SameSite=Lax`. Se guarda hasheado en la base para poder revocarlo.
- **Guards de NestJS:** `JwtAuthGuard` (¿está logueado?) y `RolesGuard` + decorador `@Roles('ADMIN')` (¿tiene permiso?). Sin rol suficiente → `403`.
- **OAuth GitHub:** con Passport (`passport-github2`). Vinculación de cuentas por email verificado (spec 6.1).
- **Admin:** script `pnpm --filter api seed:admin` que lee `ADMIN_EMAIL` (spec 6.4).

⚠️ **Nota para el deploy:** si el frontend y el backend quedan en dominios distintos (ej. `*.vercel.app` y `*.onrender.com`), el navegador trata la cookie del refresh token como de terceros y puede bloquearla. Solución prevista: un dominio propio con subdominios (`app.midominio.com` y `api.midominio.com`). Se confirma en el paso 5 (primer deploy).

---

## 6. Desafío diario y zona horaria

- Zona horaria de negocio: `America/Argentina/Buenos_Aires`.
- La base guarda timestamps en UTC. La **fecha del desafío** se calcula convirtiendo "ahora" a hora de Argentina y tomando la fecha calendario.
- Nunca se usa `new Date().getDate()` directamente en el servidor: depende de la zona horaria de la máquina donde corre.
- Tabla `DesafioDiario` con `fecha` (tipo `DATE`, única) y sus 10 rondas en orden.

---

## 7. Modelo de datos (provisional)

Se refina en los pasos 2, 4, 6, 7, 8 y 12. Los nombres de campos definitivos quedan en `schema.prisma`.

```mermaid
erDiagram
    Usuario ||--o{ Partida : juega
    Usuario ||--o{ CuentaOAuth : vincula
    Usuario ||--o{ Ronda : crea
    Ronda ||--|{ Opcion : tiene
    DesafioDiario ||--|{ DesafioRonda : contiene
    Ronda ||--o{ DesafioRonda : aparece_en
    Partida ||--o{ Jugada : registra
    Opcion ||--o{ Jugada : elegida_en
    Sala ||--o{ ParticipanteSala : tiene
    Usuario ||--o{ ParticipanteSala : participa
    Sala ||--o| Partida : genera
    DesafioDiario ||--o{ Partida : se_juega_en

    Usuario {
        string id
        string email
        string nombreUsuario
        string hashContrasena
        bool emailVerificado
        Rol rol
    }
    Ronda {
        string id
        string consigna
        string categoria
        int dificultad
        EstadoRonda estado
        string autorId "nulo en rondas del banco"
    }
    Opcion {
        string id
        string texto
        bool esCorrecta
        string explicacion
    }
    Partida {
        string id
        ModoJuego modo
        int puntajeTotal
        datetime iniciadaEn
        datetime terminadaEn
    }
    Jugada {
        string id
        int numeroRonda
        TipoAccion accion
        datetime creadaEn
    }
    DesafioDiario {
        date fecha
    }
    Sala {
        string codigo
        EstadoSala estado
    }
```

Preguntas abiertas que se resuelven al implementar:
- ¿Una partida de sala es **una** `Partida` con varios participantes, o una `Partida` por jugador? (paso 12)
- ¿El estado en curso de una sala vive en memoria, en la base o en Redis? (paso 12)
- ¿Cómo se prueba que el desafío diario **nunca** toma una ronda con `autorId`? Candidato: un test que siembra rondas propias y verifica que no aparecen. (paso 7)

---

## 8. Contrato de la API (provisional)

### REST
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/registro` | — | Crear cuenta (siempre rol `USER`) |
| POST | `/auth/login` | — | Login email/contraseña |
| GET | `/auth/github` | — | Iniciar OAuth |
| POST | `/auth/refresh` | cookie | Nuevo access token |
| POST | `/auth/logout` | ✔ | Revocar refresh token |
| GET | `/usuarios/:nombreUsuario` | — | Perfil público |
| POST | `/partidas` | ✔ | Iniciar partida (`modo`, `dificultad` si es Vs IA) |
| GET | `/partidas/:id/ronda-actual` | ✔ | Consigna + 16 `OpcionPublica` |
| POST | `/partidas/:id/jugadas` | ✔ | Elegir opción o plantarse |
| GET | `/ranking/diario` | — | Ranking del día |
| GET | `/ranking/historico` | — | Ranking histórico |
| POST | `/admin/rondas/generar` | ADMIN | Pedir borrador al LLM |
| PATCH | `/admin/rondas/:id` | ADMIN | Editar / aprobar |
| GET | `/rondas-propias` | ✔ | Listar las rondas propias del usuario |
| POST | `/rondas-propias` | ✔ | Crear una ronda propia |
| GET | `/rondas-propias/:id` | ✔ | Ver una ronda propia (`404` si es de otro) |
| PATCH | `/rondas-propias/:id` | ✔ | Editar una ronda propia (`404` si es de otro) |
| DELETE | `/rondas-propias/:id` | ✔ | Borrar una ronda propia (`404` si es de otro) |

### Socket.IO (paso 12)
Eventos previstos: `sala:unirse`, `sala:estado`, `sala:iniciar`, `turno:jugar`, `turno:resultado`, `turno:timeout`, `ronda:fin`, `partida:fin`, `jugador:desconectado`.

---

## 9. Hoja de ruta

Cada paso termina con un commit (o PR) y cumple su **criterio de terminado**.

| # | Paso | Criterio de terminado |
|---|---|---|
| 0 | Repo, monorepo, `CLAUDE.md`, docs | `pnpm install` funciona; docs commiteados |
| 1 | Motor: tipos y reglas del modo Solo | Tests Vitest de acierto, mina, plantarse, ronda perfecta y opción repetida en verde |
| 2 | API base + Prisma + Docker (Postgres) + CI | Partida Solo jugable completa desde Postman; GitHub Actions corre lint y tests en cada push y PR |
| 3 | Frontend mínimo | Partida Solo jugable en el navegador, con estados de carga, vacío y error |
| 4 | Auth email + roles, perfil | Guards probados: 401 sin login, 403 sin rol; contraseñas hasheadas con argon2id |
| 5 | Primer deploy | Link público con HTTPS, base en la nube y refresh token funcionando en producción |
| 6 | Rondas propias (CRUD) + aislamiento | Tests: un usuario no puede ver, editar ni borrar rondas de otro (`404`) |
| 7 | Desafío diario + ranking | Cambio de día verificado con test que simula las 23:59 y 00:01 de Argentina |
| 8 | Panel admin + LLM | Ronda generada, revisada y aprobada aparece en el banco |
| 9 | Motor: turnos, eliminación y bots | Tests de las 3 dificultades con semilla aleatoria fija |
| 10 | Vs IA en el frontend | Partida completa contra cada dificultad |
| 11 | OAuth GitHub | Login con GitHub y vinculación por email verificado probados |
| 12 | Salas con Socket.IO | 3 navegadores juegan una partida completa, con una desconexión y reconexión |
| 13 | Cierre de portfolio + CD | README con capturas y decisiones técnicas, `docs/justificacion.md`, video demo, deploy automático desde `main` |

El paso 9 retoma el trabajo pausado en la rama `paso-2-motor-turnos-bots` (commit `bd9ae2e`). La hoja de ruta se reordenó para tener antes el deploy, la auth y un CRUD de usuario.

---

## 10. Convenciones

- **Commits:** Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`).
- **Ramas:** `main` siempre funciona; una rama por paso (`paso-1-motor-solo`).
- **Idioma:** dominio del juego en español (`Ronda`, `Opcion`, `pozo`); términos técnicos estándar en inglés (`controller`, `service`, `guard`).
- **Variables de entorno:** nunca se commitean. Existe `.env.example` con todas las claves y sin valores reales.
