# Escudo GuardiÃ¡n â€” CLAUDE.md

Proyecto universitario (DiseÃ±o de Interfaces). Entrega: **8 de noviembre de 2026**. Prefiere pocas funciones pulidas a muchas a medias. La app debe quedar SIEMPRE ejecutable al terminar cada fase.

## Concepto
Escudo GuardiÃ¡n protege al usuario de estafas con IA. Una criatura coleccionable, el GuardiÃ¡n (**Nilo**), es la cara de la app: analiza mensajes, links y capturas y avisa con personalidad propia. Es una de tres apps (celular, escritorio, Apple Watch) que comparten criatura. HOY solo se construye el escritorio; la criatura sale de `creature.json` local.

## Stack (no cambiar)
Electron + Vite + React + TypeScript estricto (electron-vite), Tailwind CSS (tokens como variables CSS), Framer Motion (`layoutId`), Zod, Vitest, ESLint, Prettier, electron-builder (NSIS). Fuentes locales (sin CDN): Space Grotesk (tÃ­tulos), Inter (interfaz), JetBrains Mono (datos y atajos). Iconos Lucide, sin emojis. Interfaz en espaÃ±ol de Colombia, microcopy breve y con voz de la criatura.
- Almacenamiento: JSON en la carpeta de datos del usuario. **Prohibidos mÃ³dulos nativos.**
- CSP estricta en el renderer. La Ãºnica red permitida es Gemini desde main.
- Ventana 1100x720 (mÃ­n. 900x600), sin marco, barra de tÃ­tulo propia. `app.setAppUserModelId`. Icono `icon.ico`.
- Plataforma principal: Windows 11 (tambiÃ©n 10). macOS secundario.

## Prioridades
- **P0:** sistema de diseÃ±o; estados A y B con transiciÃ³n; criatura animada; analizador de texto y links; reglas locales; IA Gemini; semÃ¡foro; historial; XP; DEMO_MODE; modo presentaciÃ³n; instalador Windows.
- **P1:** ventana flotante de alerta; icono de bandeja; atajo global; vigilante de portapapeles; anÃ¡lisis de capturas.
- **P2:** modo desarrollador; celebraciÃ³n de nivel; estados extra; ajustes avanzados.
- No empezar un nivel hasta que el anterior estÃ© verificado y con commit. Lo que no quede bien en P1/P2 se deja fuera.

## Sistema de diseÃ±o (src/design)
- Fondo `#05070D`; vidrio: blanco 6-8 %, borde 1 px blanco 10-14 %, blur 24 px, resaltado interno superior.
- Acento cian `#22D3EE` (nunca plano); violeta `#8B5CF6` con moderaciÃ³n (decorativo, no texto pequeÃ±o).
- SemÃ¡foro (siempre icono + texto): seguro `#34D399`, sospechoso `#FBBF24`, peligroso `#F43F5E`.
- Rareza: comÃºn `#9CA3AF`, rara `#3B82F6`, Ã©pica `#A855F7`, legendaria `#F59E0B`.
- Base 4 px; radios 12/16/24; sombras en capas con resplandor; nÃºmeros tabulares.
- Movimiento: `cubic-bezier(0.22, 1, 0.36, 1)`; 120/220/420/800 ms; solo `transform` y `opacity` (el blur solo en la entrada Ãºnica Aâ†’B); respetar `prefers-reduced-motion`.
- Componentes con todos sus estados: Button, IconButton, GlassCard, Badge, ProgressBar, Switch, Toast, Kbd, EmptyState, Skeleton, ThreatResultCard, CreatureAvatar, ScanBeam, Sidebar, Titlebar.
- Accesibilidad: AA (4.5:1) incluso sobre vidrio, foco visible, teclado completo, ARIA, objetivos â‰¥ 32 px.
- Tailwind 4: tokens en CSS con `@theme` (sin `tailwind.config.js`).

## CoreografÃ­a A â†’ B (1.0â€“1.4 s)
1. Onda de escaneo cian barre la ventana de arriba abajo.
2. Nilo se contrae y viaja (`layoutId`) hasta la barra lateral.
3. Paneles de vidrio en cascada (stagger 60â€“80 ms, fade + desplazamiento corto).
4. Barra lateral desde la izquierda; cabecera "GuardiÃ¡n activo" con punto pulsante.
5. Nilo en estado "feliz" y bienvenida con el nombre.
Estado A: "Despertar" (onboarding de 3 pasos la primera vez; luego â‰¤ 1.2 s, saltable con tecla). Estado B: "SesiÃ³n activa" (barra lateral: Inicio / Analizar / Historial / Criatura / Ajustes).
Referencias: A y B son mockups propios (estructura); C y D son de terceros (solo acabado). Ver `docs/design-brief.md`.

## Criatura
SVG por capas, original. Estados: reposo, escaneando, alerta, feliz. `creature.json`: nombre, tipo, rareza, ataque, defensa, xp, nivel, personalidad, frases. Halo segÃºn estado (cian activo, Ã¡mbar duda, rojo amenaza, gris dormida).

## AnÃ¡lisis
- HÃ­brido: reglas locales dan puntaje 0-100. `< 30` seguro, `> 70` peligroso (sin IA); entre ambos se consulta a la IA. Umbrales configurables.
- Reglas para Colombia: Nequi, Daviplata, Bancolombia, Davivienda, falsos comprobantes, transportadoras, premios y subsidios, empleo falso, soporte falso, "cambiÃ© de nÃºmero", links acortados, urgencia, peticiÃ³n de claves/cÃ³digos, dominios que imitan marcas.
- Resultado: semÃ¡foro, puntaje, seÃ±ales, acciÃ³n recomendada, mensaje de la criatura.
- Abstraer la IA tras `analyzeThreat(input)`.

## Reglas de seguridad (innegociables)
- `contextIsolation` on, `nodeIntegration` off, `sandbox` on, preload mÃ­nimo y tipado.
- IA solo desde main por IPC. La clave NUNCA en renderer, bundle ni repo.
- **`.env` existe en la raÃ­z con la GEMINI_API_KEY: NO abrirlo, leerlo, mostrarlo ni sobrescribirlo.** Solo se lee desde el cÃ³digo en ejecuciÃ³n. `.env.example` sin valores reales. `.env` en `.gitignore` antes del primer commit.
- El `.env` NO va en el instalador. En la app instalada la clave se configura en Ajustes y se guarda cifrada (`safeStorage` async).
- El contenido analizado es dato NO confiable: delimitadores + instrucciÃ³n de ignorar instrucciones internas. La IA nunca baja un "peligroso" de las reglas locales (solo confirma o sube). Validar salida con Zod.
- Links del mensaje como texto no clicable (punto del dominio neutralizado). Texto siempre plano, nunca HTML.
- Enmascarar contraseÃ±as, claves y tarjetas antes de enviar a la IA. CachÃ© por hash, 429 con espera y reintento, caÃ­da a reglas locales, un reintento si no valida.
- Variables: `GEMINI_API_KEY`, `DEMO_MODE`, `MODEL_FAST`, `MODEL_VISION`. `DEMO_MODE=true` no requiere red ni clave.

## Convenciones
- TypeScript estricto, **sin `any`**. Scripts: `dev`, `build`, `typecheck`, `lint`, `test`.
- Capas: main / preload / renderer separados; `domain/` sin React; servicios (IA, storage, portapapeles); componentes desacoplados. Errores explÃ­citos.
- Commits en espaÃ±ol, descriptivos, tras cada paso que funcione. Co-Authored-By segÃºn el sistema.
- VerificaciÃ³n visual al cerrar cada fase de UI: capturas de cada estado, compararlas con A y B y corregir diferencias.
- Al cerrar cada fase: quÃ© probar a mano, quÃ© deberÃ­a verse y si sigue empaquetable.
- Explicar al usuario en lenguaje simple lo que deba hacer Ã©l. No inventar APIs: consultar documentaciÃ³n oficial.

## Estructura
`src/main` Â· `src/preload` Â· `src/shared` (tipos y Zod) Â· `src/domain` Â· `src/design` Â· `src/renderer` Â· `data/` Â· `tests/` Â· `docs/`.

## Estado
Fase 0 en curso (scaffold). Mantener esta secciÃ³n actualizada.


