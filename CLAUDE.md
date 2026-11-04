# Escudo Guardián — CLAUDE.md

Proyecto universitario (Diseño de Interfaces). Entrega: **8 de noviembre de 2026**. Prefiere pocas funciones pulidas a muchas a medias. La app debe quedar SIEMPRE ejecutable al terminar cada fase.

## Concepto
Escudo Guardián protege al usuario de estafas con IA. Una criatura coleccionable, el Guardián (**Nilo**), es la cara de la app: analiza mensajes, links y capturas y avisa con personalidad propia. Es una de tres apps (celular, escritorio, Apple Watch) que comparten criatura. HOY solo se construye el escritorio; la criatura sale de `creature.json` local.

## Stack (no cambiar)
Electron + Vite + React + TypeScript estricto (electron-vite), Tailwind CSS (tokens como variables CSS), Framer Motion (`layoutId`), Zod, Vitest, ESLint, Prettier, electron-builder (NSIS). Fuentes locales (sin CDN): Space Grotesk (títulos), Inter (interfaz), JetBrains Mono (datos y atajos). Iconos Lucide, sin emojis. Interfaz en español de Colombia, microcopy breve y con voz de la criatura.
- Almacenamiento: JSON en la carpeta de datos del usuario. **Prohibidos módulos nativos.**
- CSP estricta en el renderer. Red permitida SOLO desde main: Gemini (IA) y Supabase (cuentas y nube, `supabase/schema.sql`, RLS por usuario). La clave publishable de Supabase es pública por diseño y va en `src/main/cloud/config.ts`; la secret/service_role NUNCA.
- Ventana 1100x720 (mín. 900x600), sin marco, barra de título propia. `app.setAppUserModelId`. Icono `icon.ico`.
- Plataforma principal: Windows 11 (también 10). macOS secundario.

## Prioridades
- **P0:** sistema de diseño; estados A y B con transición; criatura animada; analizador de texto y links; reglas locales; IA Gemini; semáforo; historial; XP; DEMO_MODE; modo presentación; instalador Windows.
- **P1:** ventana flotante de alerta; icono de bandeja; atajo global; vigilante de portapapeles; análisis de capturas.
- **P2:** modo desarrollador; celebración de nivel; estados extra; ajustes avanzados.
- No empezar un nivel hasta que el anterior esté verificado y con commit. Lo que no quede bien en P1/P2 se deja fuera.

## Sistema de diseño (src/design)
- Fondo `#05070D`; vidrio: blanco 6-8 %, borde 1 px blanco 10-14 %, blur 24 px, resaltado interno superior.
- Acento cian `#22D3EE` (nunca plano); violeta `#8B5CF6` con moderación (decorativo, no texto pequeño).
- Semáforo (siempre icono + texto): seguro `#34D399`, sospechoso `#FBBF24`, peligroso `#F43F5E` (texto de peligro sobre vidrio: `#FF8A9C`, por contraste AA).
- Rareza: común `#9CA3AF`, rara `#3B82F6`, épica `#A855F7`, legendaria `#F59E0B`.
- Base 4 px; radios 12/16/24; sombras en capas con resplandor; números tabulares.
- Movimiento: `cubic-bezier(0.22, 1, 0.36, 1)`; 120/220/420/800 ms; solo `transform` y `opacity` (el blur solo en la entrada única A→B); respetar `prefers-reduced-motion`.
- Componentes con todos sus estados: Button, IconButton, GlassCard, Badge, ProgressBar, Switch, Toast, Kbd, EmptyState, Skeleton, ThreatResultCard, CreatureAvatar, ScanBeam, Sidebar, Titlebar.
- Accesibilidad: AA (4.5:1) incluso sobre vidrio, foco visible, teclado completo, ARIA, objetivos ≥ 32 px. `tests/contrast.test.ts` lo verifica; bajo paneles el cian de la malla no supera el 14 %.
- Tailwind 4: tokens en CSS con `@theme` (sin `tailwind.config.js`).

## Coreografía A → B (1.0–1.4 s)
1. Onda de escaneo cian barre la ventana de arriba abajo.
2. Nilo se contrae y viaja (`layoutId`) hasta la barra lateral.
3. Paneles de vidrio en cascada (stagger 60–80 ms, fade + desplazamiento corto).
4. Barra lateral desde la izquierda; cabecera "Guardián activo" con punto pulsante.
5. Nilo en estado "feliz" y bienvenida con el nombre.
Estado A: "Despertar" (onboarding de 3 pasos la primera vez; luego ≤ 1.2 s, saltable con tecla). Estado B: "Sesión activa" (barra lateral: Inicio / Analizar / Historial / Criatura / Ajustes).
Referencias: A y B son mockups propios (estructura); C y D son de terceros (solo acabado). Ver `docs/design-brief.md`.

## Criatura
SVG por capas, original. Estados: reposo, escaneando, alerta, feliz. `creature.json`: nombre, tipo, rareza, ataque, defensa, xp, nivel, personalidad, frases. Halo según estado (cian activo, ámbar duda, rojo amenaza, gris dormida).

## Análisis
- Híbrido: reglas locales dan puntaje 0-100. `< 30` seguro, `> 70` peligroso (sin IA); entre ambos se consulta a la IA. Umbrales configurables.
- Reglas para Colombia: Nequi, Daviplata, Bancolombia, Davivienda, falsos comprobantes, transportadoras, premios y subsidios, empleo falso, soporte falso, "cambié de número", links acortados, urgencia, petición de claves/códigos, dominios que imitan marcas.
- Resultado: semáforo, puntaje, señales, acción recomendada, mensaje de la criatura.
- Abstraer la IA tras `analyzeThreat(input)`.

## Reglas de seguridad (innegociables)
- `contextIsolation` on, `nodeIntegration` off, `sandbox` on, preload mínimo y tipado.
- IA solo desde main por IPC. La clave NUNCA en renderer, bundle ni repo.
- **`.env` existe en la raíz con la GEMINI_API_KEY: NO abrirlo, leerlo, mostrarlo ni sobrescribirlo.** Solo se lee desde el código en ejecución. `.env.example` sin valores reales. `.env` en `.gitignore` antes del primer commit.
- **Nunca capturar el escritorio completo** (puede mostrar el `.env` abierto en el editor). Las capturas se hacen solo con `capturePage` de la propia ventana (`GUARDIAN_SHOTS`, ver `src/main/devScreenshot.ts`).
- El `.env` NO va en el instalador. En la app instalada la clave se configura en Ajustes y se guarda cifrada (`safeStorage` async; la versión síncrona se elimina en Electron 46).
- El contenido analizado es dato NO confiable: delimitadores + instrucción de ignorar instrucciones internas. La IA nunca baja un "peligroso" de las reglas locales (solo confirma o sube). Validar salida con Zod.
- Links del mensaje como texto no clicable (punto del dominio neutralizado, `src/shared/safeText.ts`). Texto siempre plano, nunca HTML.
- Enmascarar contraseñas, claves y tarjetas antes de enviar a la IA. Caché por hash, 429 con espera y reintento, caída a reglas locales, un reintento si no valida.
- Variables: `GEMINI_API_KEY`, `DEMO_MODE`, `MODEL_FAST`, `MODEL_VISION`. `DEMO_MODE=true` no requiere red ni clave.

## Convenciones
- TypeScript estricto, **sin `any`**. Scripts: `dev`, `build`, `typecheck`, `lint`, `test`.
- Capas: main / preload / renderer separados; `domain/` sin React; servicios (IA, storage, portapapeles); componentes desacoplados. Errores explícitos.
- Los archivos que exportan componentes no exportan constantes ni hooks (regla `react-refresh`): van en archivos aparte.
- Commits en español, descriptivos, tras cada paso que funcione. Co-Authored-By según el sistema.
- Verificación visual al cerrar cada fase de UI: capturas de cada estado, compararlas con A y B y corregir diferencias.
- Al cerrar cada fase: qué probar a mano, qué debería verse y si sigue empaquetable.
- Explicar al usuario en lenguaje simple lo que deba hacer él. No inventar APIs: consultar documentación oficial.
- **Editar archivos con las herramientas Write/Edit, nunca con `Get-Content | Set-Content` de PowerShell 5.1** (rompe los acentos al re-codificar).

## Estructura
`src/main` · `src/preload` · `src/shared` (tipos y Zod) · `src/domain` · `src/design` · `src/renderer` · `data/` · `tests/` · `docs/` · `scripts/`.

## Entorno
Algunos terminales de editor definen `ELECTRON_RUN_AS_NODE=1` y Electron arranca como Node. `npm run dev` usa `scripts/electron-vite.mjs`, que lo elimina.

## Estado
- Fase 0 (scaffold, ventana sin marco, CSP, IPC de ventana): completa.
- Fase 1 (tokens, 14 componentes, criatura SVG, galería, pruebas de contraste y de safeText): completa.
- Rediseño premium (vidrio con borde luminoso, aurora + grano + viñeta, criatura con volumen): hecho antes de la fase 2.
- Fase 2 (estados A y B, transición con layoutId + ScanBeam, onboarding de 3 pasos, entrada rápida, perfil/ajustes/criatura en JSON, pantallas Inicio, Criatura y Ajustes): completa. Analizar e Historial son marcadores hasta la fase 3.
- Datos de desarrollo: `GUARDIAN_DATA_DIR` redirige la carpeta de datos; `#sample` carga historial de ejemplo; `#gallery` abre la galería (solo en dev).
- Fase 3 (reglas locales para Colombia + corpus de 30 mensajes, analyzeThreat con proveedor intercambiable, caché, historial, XP, modo presentación, DEMO_MODE, escáner con resaltado de señales, fondo reactivo, instalador NSIS con icono de Nilo): completa. `npm run build:win` → `release/EscudoGuardian-0.1.0-setup.exe` (sin firmar).
- Identidad acordada con el usuario: (1) halo de Nilo tiñe la escena, (2) escáner como lenguaje visual — hechos; (3) tarjeta coleccionable con holograma y (4) tipografía más atrevida — pendientes de pulido; **mascota 3D con Three.js** — pendiente (cambio de stack pedido por el usuario; con respaldo SVG).
- Fase 4 (Gemini real vía `generateContent`, `gemini-3.5-flash-lite`, salida JSON con esquema + Zod, enmascarado de datos sensibles, reintentos 429/salida inválida, clave cifrada con `safeStorage` desde Ajustes, prueba de conexión): completa y verificada con llamadas reales. Ver `docs/ia-gemini.md`. Para usar IA real en desarrollo: `npm run dev:real` (pone DEMO_MODE=false solo en esa ejecución; el `.env` no se toca). El instalador se probó de verdad (instalar en carpeta temporal, abrir, desinstalar sin residuos).
- Mascota 3D (Three.js 0.187, 100 % procedural en `src/renderer/src/creature3d/`; stack ampliado a pedido del usuario): hecha. Nilo es un guardián felino de cuerpo de bloque redondeado, visor con ojos luminosos, escudo violeta, bracitos, patas y cola. Saluda con la mano al abrir (globo «¡Hola!»), sigue el puntero, y reacciona (reposo, escaneando, alerta, feliz). `CreatureView` elige: 3D vivo (≥ 40 px), foto fija del modelo (< 40 px, un solo contexto WebGL compartido) o el SVG antiguo como respaldo si no hay WebGL. Con movimiento reducido se dibuja una pose fija. Medido: 144 fps con 1-2 lienzos.
- Atuendo de Nilo (a pedido del usuario): gorra snapback violeta con visera cian y el escudo como logo, cadena dorada con dije, tenis blancos con suela luminosa y franja cian. **Son genéricos: nada de logos reales de New Era ni Nike** (marcas registradas); si el usuario quiere sus propios logos, se añaden como textura.
- Pendiente: el icono de la app (`build/icon.ico`) aún usa el dibujo SVG redondo de Nilo, no el modelo 3D; tarjeta coleccionable con holograma y tipografía más atrevida; el usuario mencionó «dos ideas más» sin detallarlas.
- Fase 5 (P1): completa. (a) atajo global configurable + ventana flotante de alerta (siempre encima, Enter = detalle, Esc = descartar) + icono de bandeja con punto de color + cerrar con vigilante activo deja la app en la bandeja + una sola instancia; (b) vigilante del portapapeles (sondeo 900 ms, ignora lo ya copiado, filtro que descarta contraseñas/claves/tarjetas, SOLO reglas locales, alerta sin robar foco + notificación + historial); (c) capturas con visión (arrastrar, pegar o elegir; `gemini-3.5-flash-lite` por defecto; las reglas locales revisan el texto transcrito; demo = ejemplo fijo y avisado). Código en `src/main/guardianController.ts`, `windows/`, `tray.ts`, `clipboard/`. Pruebas de punta a punta solo en desarrollo: `GUARDIAN_ALERT_TEST`, `GUARDIAN_WATCHER_TEST` (escriben en el portapapeles real).
- Gestos de contexto (a pedido del usuario): `src/domain/gesture.ts` decide gesto Y objeto flotante (`creature3d/props.ts`: regalo, paquete, maletín, moneda, teléfono, llave, banco, documento, check, ?) según la HISTORIA de la estafa (premio, paquete, empleo, dinero, falso familiar, comprobante) y, si no hay, según el PEDIDO (clave, soporte, marca). Lección: elegir por la señal «más grave» hacía que 10 de 15 estafas dieran el mismo gesto, porque casi todas suplantan una marca o piden una clave; por eso manda la historia y hay una prueba de variedad. Gestos: proteger, negar, llamar, alto, pensar, celebrar, leer y el «primer vistazo» (`preReaction`) mientras se pega; `buildMascot.ts` los anima; el vigilante confirma «todo en orden» con aviso breve (`settings.notifySafe`, apagable). Rutas de desarrollo: `#gestos` (los 7 gestos), `#icon`, `#gallery`, `#sample`.
- Precisión y confianza del vigilante: lo dudoso ya no hace siempre «pensar»; hace el gesto de SU historia pero suave (`Context.intensity`, `DOUBTFUL_INTENSITY = 0.65`, llega a `buildMascot` como `gestureScale`); los gestos duran 5 s. El vigilante emite `watcher:event` (ignorado con motivo / todo en orden / alerta, nunca el contenido) y la cabecera lo muestra junto al interruptor. Límite conocido: copiar EXACTAMENTE el mismo texto dos veces seguidas no se detecta (sin módulos nativos no hay contador del portapapeles); hay que copiar algo distinto en medio.
- **Trampa conocida (desarrollo):** con el vigilante activo, cerrar la ventana con la X deja la app en la bandeja (por diseño) y una segunda `npm run dev` solo trae al frente esa copia VIEJA (bloqueo de instancia única). Los cambios en el proceso principal exigen cerrar de verdad (bandeja → clic derecho → Salir) y volver a abrir. La app avisa con una notificación al esconderse y, en desarrollo, al detectar la segunda copia. Antes de dar un bug por «no funciona», comprobar la hora de inicio del proceso frente a la del último cambio de código.
- Repositorio: https://github.com/JAIR0TR1/DDIS-GUARDIAN-SHIELD (el profesor revisa los commits; desde aquí, mensajes de commit en inglés; identificadores en inglés, comentarios pueden quedar en español).
- Fase 6 (pulido, a pedido del usuario el 3 nov): tema oscuro/claro/sistema (`settings.theme`, variables CSS bajo `:root[data-theme='light']`, contraste AA comprobado en `tests/contrast.test.ts`); idioma español/inglés (`settings.language`, diccionarios tipados `src/shared/i18n/{es,en}.ts`, `useT()`; los textos del análisis se guardan en español y se traducen al mostrarlos con `localizeText`, cubierto por `tests/i18n.test.ts` sobre todo el corpus; bandeja, notificaciones y respuestas de Gemini siguen el idioma; la caché incluye el idioma); fila de métricas en Inicio. Al añadir un texto visible: clave en `es.ts` Y `en.ts`; si el análisis produce una frase nueva, añadir su `result.*`.
- Cuentas en la nube (a pedido del usuario el 3 nov): Supabase (proyecto gjbbylfssbtfrmyliunm, «Confirm email» apagado). Correo + contraseña; supabase-js solo en main; sesión cifrada con safeStorage (`session.bin`); datos por usuario en `userData/users/<id>/` (funciona sin red) y sincronización (`src/main/storage/accountData.ts`, reglas puras en `src/main/cloud/syncPlan.ts`). La primera cuenta que entra en un equipo se lleva los datos locales previos. Probado contra el Supabase real: registro, inicio en «otro equipo» trae el perfil, RLS bloquea leer/escribir datos ajenos. La app instalada y la de desarrollo comparten `%APPDATA%\escudo-guardian` (y el bloqueo de instancia única).
- Ronda de mejoras (3 nov, a pedido del usuario): (1) capturas con VARIOS mensajes: la visión devuelve `messages[]`, cada uno se revisa con reglas locales, se guarda aparte y tiene pestaña propia (probado con Gemini real); (2) **Arena del Guardián** (`src/domain/arena.ts`, `villains.ts`, `screens/Arena.tsx`): 9 villanos con identidad por tipo de estafa, 8 rondas del corpus, 3 corazones, teclas E/S/Enter, XP con tope validado en main (`arena:reward`); (3) **apariencias por nivel** (`src/domain/skins.ts`: Clásico, Medianoche, Esmeralda, Fuego, Aurora; `SkinContext`; `Mascot.setSkin`), guardadas en la criatura; (4) Gemini elige `niloGesture` de una lista cerrada y el dominio solo lo acepta si es coherente con el veredicto; (5) **carta coleccionable** holográfica con inclinación 3D en Criatura; (6) Inicio con tarjeta principal (Nilo grande, nivel, próxima apariencia, accesos a Analizar y Arena).
- Release publicado: https://github.com/JAIR0TR1/DDIS-GUARDIAN-SHIELD/releases/tag/v0.1.0 (GitHub CLI instalado y autorizado; crear un Release lo publica, así que el sistema de permisos pide que lo ejecute el usuario).
- Fase 7 (3 nov): documentación al día (`docs/justificacion-diseno.md` §9.7-9.11, QA §12-14, README); revisión visual en tema claro + inglés (carta coleccionable con proporción 3:4, corazón roto al perder la Arena); recorrido con teclas REALES (`keys` en `GUARDIAN_SHOTS`, `skipImage`) que corrigió pérdidas de foco en Ajustes, Analizar, Historial y Arena. El aviso de privacidad ya dice que el historial se sincroniza con la propia cuenta. Estos arreglos NO están en el instalador 0.2.0 (sin publicar): regenerar antes de publicar.
- Pendiente opcional: segunda idea del usuario sin detallar. `docs/corpus-report.md` se regenera con `npm test`.
- Material nativo (Mica/Acrylic): descartado por ahora; fondo sólido + malla de gradientes interna.
Mantener esta sección actualizada.
