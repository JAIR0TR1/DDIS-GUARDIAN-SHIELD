# Escudo Guardián

Protege del fraude digital con una criatura guardiana, **Nilo**: analiza mensajes y links, avisa con semáforo (seguro, sospechoso, peligroso) y explica por qué. Proyecto universitario de Diseño de Interfaces (aplicación de escritorio; hermana de las apps de celular y reloj).

## Instalar y usar (sin programar)
1. Ejecuta `EscudoGuardian-0.2.0-setup.exe` (se genera con `npm run build:win` en `release/`).
2. Windows puede mostrar el aviso azul «SmartScreen» porque el instalador no está firmado: pulsa **Más información → Ejecutar de todas formas**.
3. Abre Escudo Guardián, **crea una cuenta** (correo y contraseña) o inicia sesión. La primera vez te pide tu nombre; después Nilo te saluda.
4. En **Analizar**, pega un mensaje y pulsa Analizar. Sin clave de IA funciona en modo demo; para usar la IA real, pega tu clave de Gemini en **Ajustes** (se guarda cifrada).

No es una página web: es una aplicación de escritorio. Tus datos se guardan en el equipo y se sincronizan con tu cuenta en la nube, así que puedes entrar desde cualquier computador con la app instalada.

Descarga directa: [Releases del repositorio](https://github.com/JAIR0TR1/DDIS-GUARDIAN-SHIELD/releases).

## Qué incluye
- Analizador de mensajes, links y capturas con semáforo, puntaje, señales y acción recomendada. Si una captura trae varios mensajes, cada uno se analiza por separado.
- **Nilo**, un guardián 3D que saluda, sigue el puntero y reacciona al contexto con gestos y un objeto flotante según la estafa (regalo, paquete, maletín, teléfono…).
- Historial, experiencia y niveles; modo presentación; modo demo sin red.
- **Arena del Guardián**: minijuego de 8 rondas contra nueve villanos (uno por tipo de estafa) que entrena a reconocer estafas y le da experiencia a Nilo.
- **Apariencias de Nilo** que se desbloquean por nivel y **carta coleccionable** holográfica.
- Cuentas con correo y contraseña (medidor de fuerza y contraseña sugerida).
- Interfaz en **español o inglés** y tema **oscuro, claro o del sistema**, desde Ajustes.
- Vigilante del portapapeles, atajo global, alerta flotante e icono en la bandeja.

## Requisitos
- Windows 10 u 11
- Node.js 20.19+ o 22.12+ (se probó con Node 24) y npm

## Instalación para desarrollo
```bash
npm install
npm run dev
```

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre la app en modo desarrollo (usa lo que diga tu `.env`) |
| `npm run dev:real` | Igual, pero con la IA real (Gemini) solo en esa ejecución, sin editar el `.env` |
| `npm run build` | Revisa los tipos y compila |
| `npm run build:win` | Genera el instalador de Windows en `release/` |
| `npm run build:unpack` | Genera la app sin instalador en `release/win-unpacked/` |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | Revisa el estilo del código |
| `npm test` | Ejecuta las pruebas |
| `npm run icon` | Regenera `build/icon.ico` con Nilo |

## Variables de entorno
Copia `.env.example` como `.env` (nunca se sube al repositorio):

| Variable | Para qué sirve |
|---|---|
| `DEMO_MODE` | `true` (por defecto): respuestas de ejemplo, sin internet ni clave. `false`: usa la IA real. Se cambia reiniciando la app. |
| `GEMINI_API_KEY` | Clave de Google AI Studio (plan gratuito). Solo la lee el proceso principal. |
| `MODEL_FAST` | Modelo rápido para casos ambiguos. |
| `MODEL_VISION` | Modelo con visión para capturas. |

El instalador **no** incluye el `.env`.

## Modo demo y modo presentación
Con `DEMO_MODE=true` todo funciona sin internet. En **Analizar** hay tres ejemplos listos (estafa clara, dudoso, legítimo) para mostrar el flujo completo en una sustentación.

## Cómo analiza
1. Reglas locales (pensadas para Colombia: Nequi, Daviplata, bancos, transportadoras, premios, empleo falso, etc.) dan un puntaje de 0 a 100.
2. Menos de 30: seguro. Más de 70: peligroso. Ambos sin llamar a la IA.
3. Entre 30 y 70 se pide una segunda opinión a la IA. La IA nunca puede bajar un «peligroso» de las reglas.

Informe de las reglas sobre 30 mensajes de ejemplo: [docs/corpus-report.md](docs/corpus-report.md).

## Funciones de fondo
- **Atajo global** (por defecto `Ctrl+Shift+G`, configurable en Ajustes): analiza lo que copiaste desde cualquier programa y muestra una alerta flotante. `Enter` abre el detalle, `Esc` la descarta.
- **Icono en la bandeja** con un punto de color según el estado; clic para abrir, clic derecho para el menú.
- **Vigilante del portapapeles** (opcional, apagado por defecto): avisa si copias algo sospechoso. Ignora contraseñas, claves y tarjetas, y nunca envía nada a la IA.
- **Capturas de pantalla**: arrástralas, pégalas con `Ctrl+V` o elígelas; la IA lee el texto y lo analiza.

## Cuentas y nube
Cada usuario crea una cuenta con correo y contraseña. Perfil, criatura, ajustes e historial se guardan en **Supabase** (PostgreSQL) y se sincronizan: inicias sesión en cualquier equipo y ves tus datos. Cada usuario solo puede leer y escribir sus propias filas (Row Level Security, ver `supabase/schema.sql`). Sin internet la app sigue funcionando con la copia local y sube los cambios después.

## Datos
Además de la nube, todo se guarda en archivos JSON en la carpeta de datos del usuario (`%APPDATA%\escudo-guardian`, una subcarpeta por cuenta). No hay base de datos local ni módulos nativos.

## Documentación
- [docs/design-brief.md](docs/design-brief.md): análisis de las referencias visuales y decisiones de diseño.
- [docs/justificacion-diseno.md](docs/justificacion-diseno.md): justificación de las decisiones de diseño.
- [docs/QA.md](docs/QA.md): casos de prueba manuales.
- [docs/ia-gemini.md](docs/ia-gemini.md): cómo se conecta y protege la IA.
- [CLAUDE.md](CLAUDE.md): especificación resumida y convenciones del proyecto.
