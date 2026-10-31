# Escudo Guardián

Protege del fraude digital con una criatura guardiana, **Nilo**: analiza mensajes y links, avisa con semáforo (seguro, sospechoso, peligroso) y explica por qué. Proyecto universitario de Diseño de Interfaces (aplicación de escritorio; hermana de las apps de celular y reloj).

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

## Datos
Todo se guarda en archivos JSON en la carpeta de datos del usuario (`%APPDATA%\Escudo Guardián`). No hay base de datos ni módulos nativos.

## Documentación
- [docs/design-brief.md](docs/design-brief.md): análisis de las referencias visuales y decisiones de diseño.
- [CLAUDE.md](CLAUDE.md): especificación resumida y convenciones del proyecto.
