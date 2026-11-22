# Ficha para el portafolio: Escudo Guardián

Todo lo de esta ficha se puede comprobar en el repositorio o ejecutando los comandos que se indican. Lo que no se pudo comprobar no está.

## Nombre

Escudo Guardián

## Descripción corta (1 línea)

App de escritorio para Windows que revisa mensajes, links y capturas y avisa con un semáforo si son una estafa, con un guardián 3D llamado Nilo.

## Descripción larga

Escudo Guardián analiza mensajes, links y capturas de pantalla y dice si son seguros, sospechosos o peligrosos, con el puntaje, las señales que lo delatan y qué hacer. Primero aplican reglas locales pensadas para las estafas de Colombia (Nequi, Daviplata, bancos, paquetes retenidos, premios, empleos falsos) y, en los casos dudosos, se pide una segunda opinión a Gemini. Nilo, una criatura coleccionable en 3D, da el aviso con su propia voz, sube de nivel y desbloquea apariencias. Es un proyecto de la materia Diseño de Interfaces.

## Problema y para quién

Las estafas por mensaje funcionan porque la víctima decide rápido, con miedo o con ilusión y sin información. La app va dirigida a personas que reciben mensajes sospechosos por WhatsApp, SMS o correo y quieren una segunda opinión en segundos, sin leer manuales. El diseño busca avisar con claridad sin asustar de más.

## Funciones principales

1. **Análisis híbrido**: reglas locales dan un puntaje de 0 a 100; entre 30 y 70 se consulta a Gemini, que puede confirmar o subir un veredicto pero nunca bajar un «peligroso».
2. **Capturas de pantalla**: la IA lee la imagen y cada mensaje que contiene se analiza por separado.
3. **Vigilante del portapapeles, atajo global y alerta flotante**: avisa desde cualquier programa; el vigilante es opcional y solo usa reglas locales.
4. **Nilo y la Arena del Guardián**: criatura 3D que reacciona al contexto, apariencias por nivel, carta coleccionable y un minijuego con nueve villanos.
5. **Cuentas en la nube**: historial, criatura y ajustes sincronizados con Supabase, con seguridad por filas.
6. **Interfaz en español e inglés**, tema oscuro, claro o del sistema, contraste AA y uso completo con teclado.

## Tecnologías

Versiones tal como están en `package.json`:

- Electron ^45.1.0, electron-vite ^6.0.0, Vite ^8.3.4
- React ^19.3.0, TypeScript ^5.9.3 (modo estricto)
- Tailwind CSS ^4.3.3, Framer Motion ^14.8.0, Three.js ^0.187.0, Lucide React ^1.65.0
- Zod ^4.6.7
- Supabase (`@supabase/supabase-js` ^2.118.0): cuentas y base de datos con seguridad por filas
- Google Gemini, modelo `gemini-3.5-flash-lite` por defecto, solo desde el proceso principal
- Vitest ^5.0.5, ESLint ^9.39.5, Prettier ^3.9.10
- electron-builder ^26.15.3 (instalador NSIS para Windows)

## Cifras verificables

| Dato | Valor | Cómo comprobarlo |
|---|---|---|
| Versión | 0.3.0 | `package.json` |
| Pruebas automáticas | 266 pasan, en 19 archivos | `npm test` |
| Corpus de reglas | 30 mensajes: 15 estafas y 15 legítimos | `docs/corpus-report.md` |
| Estafas del corpus | 14 salen como peligrosas, 1 cae en la zona que se consulta a la IA, 0 salen como seguras | `docs/corpus-report.md` |
| Legítimos del corpus | 15 salen como seguros, 0 falsos positivos | `docs/corpus-report.md` |
| Arena | 8 rondas, 3 corazones, 9 villanos | `src/domain/arena.ts`, `src/domain/villains.ts` |
| Apariencias de Nilo | 5, desbloqueadas por nivel | `src/domain/skins.ts` |
| Instalador | 117,7 MB, sin firmar | `npm run build:win` |
| Instalador probado | instalado en carpeta temporal, abierto y desinstalado sin dejar archivos, accesos ni registro; sin `.env` ni claves en el paquete | `docs/QA.md`, sección 6 |

El corpus lo escribió el equipo: sirve como prueba de regresión de las reglas, no como medida de precisión en el mundo real.

## Enlaces

- Repositorio: https://github.com/JAIR0TR1/DDIS-GUARDIAN-SHIELD
- Releases: https://github.com/JAIR0TR1/DDIS-GUARDIAN-SHIELD/releases (hoy solo está publicada la 0.1.0; la 0.3.0 se publica con el comando de `docs/release-notes-0.3.0.md`)
- Instalador local: `C:\proyectos\escudo-guardian\release\EscudoGuardian-0.3.0-setup.exe`
- Justificación de diseño: `docs/justificacion-diseno.md`
- Guion de demo: `docs/demo-profesor.md`

## Capturas para mostrar, en orden

Están en `docs/screenshots/`, tomadas en modo demo con un perfil de ejemplo («Camila», nivel 3).

1. `02-analizar-peligroso.jpg`: el resultado de un mensaje peligroso con las señales resaltadas.
2. `01-inicio.jpg`: la pantalla de inicio con Nilo, el nivel y la última amenaza.
3. `06-criatura-carta.jpg`: la carta coleccionable y las apariencias.
4. `07-arena.jpg`: una ronda de la Arena del Guardián.

## Estado del proyecto

Versión 0.3.0 terminada y verificada en la rama `release-v0.3`, todavía sin unir a `main`. Falta:

- Publicar el Release 0.3.0 en GitHub.
- Las pruebas manuales que dependen de Windows, del instalador o de otro equipo (SmartScreen, notificación nativa, Narrador, otro computador): `docs/QA.md`, sección 15.
- Reactivar el proyecto gratuito de Supabase si sigue pausado; mientras lo esté, no se puede crear cuenta ni iniciar sesión.
- No se hicieron pruebas con usuarios reales; la evaluación es una inspección con heurísticas más pruebas automáticas.
