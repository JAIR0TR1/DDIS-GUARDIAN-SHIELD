# Design brief — Escudo Guardián

Documento previo al código. Fecha: 30 de octubre de 2026. Entrega: 8 de noviembre de 2026.

## 1. Asignación de las cuatro imágenes

| Imagen | Contenido | Rol |
|---|---|---|
| 1 | Portada "AI Assistant · UI Kit" (móviles oscuros, acento verde menta, orbe 3D) | **Referencia C** (terceros, solo acabado) |
| 2 | Dashboard de escritorio "AI Assistance" con esfera cian y partículas ("Listening…") | **Referencia D** (terceros, solo acabado) |
| 3 | Captura "Hola, soy Nilo": criatura con anillos, campo de nombre y botón | **Referencia A** (mockup propio, estado Despertar) |
| 4 | Captura "Hola, Jairo": barra lateral, última amenaza, analizar e historial | **Referencia B** (mockup propio, estado Sesión activa) |

**Aviso de coincidencia.** Las cuatro imágenes corresponden a la descripción, con un matiz: ni C ni D son glassmorphism de verdad. C es un kit móvil oscuro con tarjetas de degradado sutil, y D es un HUD oscuro con brillos y partículas. El vidrio translúcido no sale de ellas, sino del sistema de diseño (sección 5 del encargo) y de la malla de gradientes que pondremos detrás. De C y D tomamos el acabado: brillo, profundidad y luz contenida.

## 2. Lo observado

### Referencia A — Despertar
- **Paleta.** Fondo casi negro azulado (~#05070D). Cian #22D3EE para botón, ojos de la criatura y anillos. Violeta solo en el escudo de la frente. Texto principal blanco, secundario gris azulado.
- **Jerarquía.** 1) criatura (núcleo), 2) saludo "Hola, soy Nilo" (~26 px, semibold), 3) subtítulo de dos líneas, 4) campo, 5) botón cian, 6) pista "Enter para empezar". Todo en un solo eje vertical centrado.
- **Espaciado y radios.** Bloques separados en saltos de 8/16/24 px. Campo y botón de ~362×48 px con radio ~12 px, mismo ancho, separados ~12 px. El botón ocupa el ancho completo del campo.
- **Tipografía.** Títulos en grotesca geométrica (Space Grotesk). Interfaz en Inter. Datos en mono pequeño: "Sistema en reposo" arriba a la izquierda (cian) y "v0.1 · modo demo" arriba a la derecha (gris), con estética de terminal.
- **Iconografía.** Línea fina de trazo uniforme (Lucide): escudo, rayo en el botón. Kbd con borde y fondo sutil.
- **Criatura.** Cabeza redonda con contorno cian, orejas triangulares, ojos cian ovalados con brillo, sonrisa mínima, escudo violeta. Tres anillos concéntricos de trazo fino y opacidad decreciente.

### Referencia B — Sesión activa
- **Estructura.** Barra de título propia con icono de escudo y controles. Barra lateral estrecha (~72 px): avatar de la criatura arriba, 4 iconos (Inicio activo con borde cian y fondo teñido, Analizar, Historial, Criatura) y Ajustes abajo. Cabecera con saludo y estado, y a la derecha el nivel y la barra de XP en mono. Debajo, rejilla de dos columnas (~60/40): "Última amenaza" a la izquierda; "Analizar" e "Historial" apilados a la derecha.
- **Semáforo.** Insignia con icono y texto ("Peligroso" en rosa sobre fondo rosa tenue y borde rosa). El puntaje "92/100" es el elemento más grande de la pantalla, con cifras tabulares. Las señales llevan icono de color (ámbar para link y urgencia, rojo para la clave). El mensaje de la criatura va tras un divisor, con avatar y frase imperativa breve.
- **Paneles.** Fondo apenas más claro que el lienzo (~#0D0F14), borde de 1 px (~#22252E), radio ~16 px, padding ~20 px. Son planos: no hay profundidad, brillo ni translucidez.
- **Zona de análisis.** Borde punteado cian, texto central, botón cian "Analizar" y Kbd "Ctrl+Shift+G" a su lado.
- **Historial.** Filas con icono de semáforo, título y hora relativa en gris a la derecha.
- **Flecha inferior.** El círculo con flecha abajo es un recurso del mockup (aparece también en D). **No se implementa.**

### Referencia C — UI kit de asistente (solo acabado)
- Fondo azul pizarra casi negro con un acento verde menta muy saturado, usado con parsimonia (insignia, CTA, palabras clave del titular).
- Tarjetas con **degradado interno tenue** que tiñe del color del acento, bordes finos y radios generosos. Sensación de capas.
- Un objeto central luminoso (orbe de partículas) como imagen de marca. Botón principal en píldora, de ancho completo, con texto oscuro.
- Titulares muy gruesos con una palabra resaltada en el acento.

### Referencia D — Dashboard HUD (solo acabado)
- Fondo azul índigo oscuro y paneles de azul más claro. Esfera cian con **halo exterior y partículas violeta/magenta** que cruzan como onda de audio.
- Etiquetas pequeñas en mayúsculas de color cian como encabezados de módulo. Barras de progreso finas con punta brillante. Datos en capas (porcentajes, listas).
- Mensaje de estado en texto grande y claro ("Listening…") bajo el objeto central.
- Limitación: está en baja resolución y el texto no se lee bien. Solo sirve como referencia de atmósfera.

## 3. Qué tomamos, qué mejoramos y por qué

| Tomamos | De | Por qué |
|---|---|---|
| Composición, jerarquía, paleta, criatura y semáforo | A y B | Es la identidad propia y ya está definida. |
| Objeto luminoso como núcleo, con halo | A, C, D | Da foco y vuelve a la criatura la protagonista (ley de la región común y foco visual). |
| Degradado interno tenue que tiñe del acento en paneles | C | Da profundidad sin recargar. |
| Etiquetas pequeñas en mono mayúsculas y datos en capas | D | Estética HUD/escáner, coherente con "guardián que vigila". |
| Barras finas con punta luminosa | D | Barra de XP y de puntaje más precisas y legibles. |

| Mejoramos | Cómo |
|---|---|
| Paneles planos → vidrio real | Fondo blanco al 6-8 %, borde de 1 px al 10-14 %, `backdrop-filter` de 24 px, resaltado interno superior y sombra en capas. Detrás, malla de gradientes y formas de color dentro de la ventana, para que el desenfoque se note. Si el sistema lo soporta, material nativo (Mica o Acrylic), con fallback sólido. |
| Criatura plana → criatura viva | SVG por capas: respira, parpadea, ojos con brillo, halo y anillos animados con `transform` y `opacity`. Estados: reposo, escaneando, alerta, feliz. |
| Mockup estático → coreografía | Transición A → B continua, con la criatura como elemento compartido. |
| Semáforo solo por color → icono y texto | Accesibilidad (WCAG 1.4.1) y lectura rápida. |
| Contraste a verificar | Rosa, ámbar y violeta sobre vidrio: validaremos AA (4.5:1) con un script en la fase 1. El violeta `#8B5CF6` se usará solo como acento decorativo e icono, no como texto pequeño. |
| Objetivos de clic | Mínimo 32 px (los iconos de la barra lateral ya cumplen, pero los controles de ventana hay que revisarlos). |

**Lo que no tomamos:** layouts de C y D, el verde menta, el índigo de D, sus fotografías, el orbe 3D ni sus partículas literales. La identidad es cian + violeta sobre azul casi negro, con la criatura Nilo.

## 4. Principios de coherencia entre estados A y B
- Los mismos tokens, la misma tipografía y el mismo lenguaje de movimiento (curva `cubic-bezier(0.22, 1, 0.36, 1)`; 120 / 220 / 420 / 800 ms).
- El mismo fondo de malla en ambos estados. En A está más abierto y centrado; en B se atenúa y queda detrás de los paneles.
- La criatura es la misma en los dos estados: pasa de núcleo (A) a avatar de la barra lateral (B). La transición es continua, sin salto.
- Datos y atajos siempre en JetBrains Mono, pequeños.

## 5. Decisiones técnicas que afectan al diseño (verificadas en documentación oficial)
- **Material nativo.** `backgroundMaterial` (`mica`, `acrylic`, `tabbed`, `none`, `auto`) solo funciona en **Windows 11 22H2 o superior**. La documentación de Electron dice que `transparent` en Windows solo funciona con ventana sin marco. No documenta restricciones al combinar `backgroundMaterial` con `frame: false`. Por eso lo probaremos de verdad antes de decidir (ver plan). El fallback sólido será el camino por defecto en Windows 10.
- **Ventana sin marco.** `thickFrame: false` quita sombra, animaciones y redimensionado por arrastre. Dejaremos `thickFrame` en su valor por defecto para conservar el redimensionado. Las esquinas redondeadas solo se aplican desde Windows 11.
- **Controles de ventana.** Los controles diseñados llamarán al proceso main por IPC. Con `titleBarOverlay` se podrían usar los nativos, pero no encajan con la identidad visual.
