# Matriz de pruebas — MAIA-PdG Frontend

## Convenciones

- **Herramienta:** [Vitest](https://vitest.dev/) + Testing Library.
- **Ubicación:** archivos `*.test.ts`, `*.test.tsx` junto al código o bajo `src/test/` y `src/**/__tests__/`.
- **Comando rápido (sin umbral de cobertura):** `npx vitest run`
- **Comando con cobertura:** `npm run test` — puede fallar con **código distinto de 0** si no se cumplen los umbrales globales configurados en Vitest (80%), aunque todos los casos pasen.

---

## Inventario completo (repositorio)

Lista de **todos** los archivos de prueba actuales y rol de cada uno.

| # | Archivo | Casos (`it`) | Tipo principal | Ámbito / qué valida |
|---|---------|--------------|----------------|---------------------|
| 1 | `src/contexts/__tests__/AuthContext.test.tsx` | 5 | Integración (contexto) | Sesión desde JWT válido/inválido; login exitoso y fallido (`null`); logout. |
| 2 | `src/test/Login.test.tsx` | 5 | Componente | Formulario login; envío exitoso y navegación; credenciales inválidas; error de red; estado de carga. |
| 3 | `src/test/Register.test.tsx` | 5 | Componente | Formulario registro; validación contraseñas; registro + login automático y navegación; error API. |
| 4 | `src/test/ResourceLibrary.test.tsx` | 9 | Componente | Biblioteca: título, carga de recursos/favoritos/colecciones, toggle favorito, colecciones, estadísticas, búsqueda, estado vacío. |
| 5 | `src/services/api.chat.test.tsx` | 3 | Unidad (API) | Cliente chat: POST interacciones, query de historial propio, historial por email. |
| 6 | `src/pages/ChatHistory.test.tsx` | 2 | Componente | Página historial chat: render básico; filtros sin error. |
| 7 | `src/pages/ChatHistoryAdmin.test.tsx` | 1 | Componente | Acceso admin bloqueado si el rol no es jefe de departamento. |
| 8 | `src/test/supportRequestsAPI.test.ts` | 3 | Unidad (API) | Solicitudes: listado por `CONTESTADA`, estadísticas `recibidas`/`contestadas`, respuesta solo con `responseText`. |
| 9 | `src/test/requestStatus.test.ts` | 3 | Unidad (utilidad) | Etiquetas y colores de estado (`RECIBIDA` / `CONTESTADA` / legacy); `isRequestAnswered`. |
| 10 | `src/pages/RequestManagement.test.tsx` | 2 | Componente | Gestión solicitudes: contadores desde API; pestaña contestadas usa `CONTESTADA`. |
| 11 | `src/test/notificationsAPI.test.ts` | 5 | Unidad (API) | Notificaciones: URLs, `PUT`, `userId` codificado, token `Bearer`. |
| 12 | `src/pages/Notifications.test.tsx` | 1 | Componente | Lista de notificaciones; abrir detalle vía modal sin ir a `/support`; `markAsRead`. |

**Totales:** **12 archivos**, **44** casos `it` (según el código actual).

---

## Agrupación por dominio funcional

### Autenticación y sesión

| Archivos | Notas |
|----------|--------|
| `AuthContext.test.tsx` | Contexto global de auth. |
| `Login.test.tsx`, `Register.test.tsx` | Pantallas de entrada. |

### Biblioteca de recursos

| Archivos | Notas |
|----------|--------|
| `ResourceLibrary.test.tsx` | Página principal de biblioteca (API de recursos y favoritos mockeada). |

### Chat

| Archivos | Notas |
|----------|--------|
| `api.chat.test.tsx` | Contrato HTTP del cliente de chat. |
| `ChatHistory.test.tsx` | UI historial de docente. |
| `ChatHistoryAdmin.test.tsx` | Restricción de rol en vista admin. |

### Solicitudes de acompañamiento / soporte

| Archivos | Notas |
|----------|--------|
| `supportRequestsAPI.test.ts`, `requestStatus.test.ts`, `RequestManagement.test.tsx` | API, utilidades de estado y página de gestión (jefe). |

### Notificaciones

| Archivos | Notas |
|----------|--------|
| `notificationsAPI.test.ts`, `Notifications.test.tsx` | API REST y pantalla de notificaciones + detalle de solicitud. |

---

## Resumen

| Métrica | Valor |
|---------|--------|
| Archivos de test | 12 |
| Casos `it` (aprox.) | 44 |
| Cobertura (`npm run test`) | Depende de umbrales del proyecto; ver informe en consola |

Para alinear esta matriz tras añadir o quitar pruebas: ejecutar `npx vitest run` y, si hace falta, contar con `rg "^\\s*it\\(" src -g "*.test.*"`.
