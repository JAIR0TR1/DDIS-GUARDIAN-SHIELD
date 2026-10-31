# Justificación de diseño — Escudo Guardián

Documento de la materia Diseño de Interfaces. Explica **por qué** la interfaz es como es, con los principios de la materia y con ejemplos concretos de la aplicación. Complementa a [design-brief.md](design-brief.md), que recoge el análisis de las referencias visuales.

## 1. Problema y usuario
Las estafas por mensaje (falsos premios, «paquete retenido», «cambié de número», suplantación de Nequi o de bancos) funcionan porque la víctima decide **rápido, con miedo o con ilusión, y sin información**. Una herramienta de protección compite contra esa urgencia: si es lenta, confusa o intimidante, la gente no la usa.

De ahí salen tres requisitos de diseño:
1. **Respuesta inmediata y comprensible**: un veredicto en segundos, sin leer manuales.
2. **Confianza sin alarmismo**: avisar con claridad sin asustar de más ni tratar al usuario como ignorante.
3. **Privacidad visible**: que se entienda qué sale del equipo y qué no.

## 2. Concepto: una criatura como mediadora
Nilo, el Guardián, es la cara de la app. Se eligió una criatura (y no un panel técnico) por tres razones:
- **Mediación emocional.** «Esto es una estafa» dicho por un personaje cercano genera menos ansiedad y más disposición a actuar que un aviso rojo anónimo. Nilo habla en segunda persona, corto y directo, como un amigo que avisa.
- **Memorabilidad e identidad** (ley de Prägnanz): una forma simple y reconocible (cuerpo de bloque, orejas, visor con ojos, escudo) se recuerda y diferencia a la app de «otro dashboard oscuro».
- **Retroalimentación continua.** Su postura comunica estado sin texto: reposo, escaneando, alerta o feliz.

**Límite asumido:** el tono lúdico no debe infantilizar. Por eso los mensajes de peligro son concretos («No hagas clic. Te pide tu clave…») y el atuendo (gorra, tenis, cadena) da personalidad sin convertirlo en juguete.

## 3. Heurísticas de Nielsen aplicadas
| # | Heurística | Cómo se cumple en la app |
|---|---|---|
| 1 | Visibilidad del estado | Cabecera «Guardián activo» con punto pulsante; etiqueta «modo demo / modo real»; el escáner muestra «Escaneando…» y sus pasos; la barra de XP y el nivel; el fondo se tiñe de verde, ámbar o rojo según el último resultado; avisos (toasts) tras cada acción. |
| 2 | Lenguaje del mundo real | Español de Colombia («Nequi», «Daviplata», «te consigné de más»); semáforo universal; señales con nombres de la vida real («Te pide la clave o un código»). |
| 3 | Control y libertad | «Analizar otro» deshace el resultado; el saludo inicial se salta con cualquier tecla; «Borrar historial» pide confirmación y se puede cancelar; «Reducir movimiento» en Ajustes. |
| 4 | Consistencia y estándares | Un solo sistema de tokens (color, radios, sombras, movimiento) y los mismos componentes en todas las pantallas; los estados A y B comparten fondo, tipografía y criatura. |
| 5 | Prevención de errores | Los links del mensaje analizado **se muestran como texto no clicable** (con el punto neutralizado) para que nadie los abra por reflejo; el contenido nunca se interpreta como HTML; el nombre se valida; el mensaje tiene límite de 5000 caracteres con contador; la clave de la IA nunca se muestra. |
| 6 | Reconocer en vez de recordar | Atajos siempre visibles (`Kbd`); iconos **con** etiqueta; modo presentación con tres ejemplos listos; el campo de nombre y la acción principal están a la vista. |
| 7 | Flexibilidad y eficiencia | `Ctrl+Enter` para analizar; pegar sobre el panel de Inicio abre el analizador con el texto; atajo global previsto (`Ctrl+Shift+G`). |
| 8 | Diseño estético y minimalista | Cinco secciones, una acción primaria por pantalla, paneles de vidrio con poco texto; el HUD de fondo es tenue y no compite con el contenido. |
| 9 | Ayudar a reconocer y recuperarse de errores | Si la IA falla, se usa el resultado de las reglas locales **con un aviso claro** («La IA está ocupada… usé las reglas locales»); si la clave es inválida se dice qué hacer; los errores usan `role="alert"` y botón «Reintentar». |
| 10 | Ayuda y documentación | Onboarding de 3 pasos (qué hace, privacidad, atajo), aviso de privacidad en Ajustes y microcopy con la voz de la criatura. |

## 4. Leyes de la Gestalt
- **Proximidad:** las señales detectadas van agrupadas justo debajo del semáforo; la voz de Nilo y la acción recomendada, juntas y separadas por un divisor.
- **Semejanza:** todas las señales comparten forma (icono + etiqueta); el color del icono indica severidad.
- **Región común:** cada tarea vive en una tarjeta de vidrio con borde luminoso.
- **Figura y fondo:** el vidrio translúcido sobre una malla de gradientes separa con claridad el contenido del fondo; el desenfoque aporta profundidad sin ruido.
- **Continuidad y cierre:** los anillos concéntricos de escaneo alrededor de Nilo guían la mirada hacia él; el trazo punteado de la zona de pegado completa visualmente un «recipiente».
- **Prägnanz (simplicidad):** la mascota se reduce a formas geométricas básicas.

## 5. Jerarquía visual
- **Un protagonista por pantalla.** En Despertar es Nilo (grande, centrado, con halo). En Sesión activa es el **puntaje** (44 px, Space Grotesk, cifras tabulares), que se lee antes que cualquier otro elemento.
- **Tres niveles tipográficos con función:** Space Grotesk para títulos y cifras, Inter para la interfaz, JetBrains Mono para datos, atajos y el mensaje analizado (que se percibe como «dato», no como instrucción).
- **Color con significado, no decorativo:** cian = acción y marca; violeta = acento mínimo; verde, ámbar y rojo **solo** para el veredicto.

## 6. Ley de Fitts
- Los controles principales son grandes: el botón «Despertar al Guardián» ocupa todo el ancho del campo (48 px de alto); «Analizar» es de tamaño grande.
- **Objetivos mínimos de 36 px** en iconos y 44 px en la barra lateral (el requisito era 32 px).
- Los controles de ventana (minimizar, maximizar, cerrar) están en la esquina superior derecha, donde el cursor llega más rápido (bordes y esquinas tienen profundidad «infinita»).
- La zona de pegado del Inicio es un objetivo grande y clicable en todo su área.

## 7. Ley de Hick
- **Pocas opciones por decisión:** 5 secciones en la barra lateral, 3 ejemplos en el modo presentación, 3 pasos de onboarding, y una sola acción primaria visible por pantalla.
- El onboarding **pospone** las decisiones secundarias (por ejemplo, el vigilante del portapapeles es opcional y está apagado por defecto).
- Los resultados priorizan: primero semáforo y puntaje, después las señales, al final la acción recomendada.

## 8. Accesibilidad (WCAG 2.2)
| Criterio | Cómo se atiende | Verificación |
|---|---|---|
| 1.4.3 Contraste mínimo (4,5:1) | Tokens de texto probados incluso sobre el peor caso del vidrio y la malla de fondo. Un ajuste real: el rojo de texto es `#FF8A9C` y `#F43F5E` se reserva a rellenos y bordes. | `tests/contrast.test.ts` (automática) |
| 1.4.11 Contraste no textual (3:1) | Iconos del semáforo sobre vidrio. | `tests/contrast.test.ts` |
| 1.4.1 Uso del color | El semáforo **siempre** lleva icono y texto («Peligroso»), nunca solo color. | Revisión de componentes |
| 2.1.1 Teclado / 2.4.7 Foco visible | Todo es operable con teclado; anillo de foco cian visible; `Ctrl+Enter`, `Enter`, `Espacio` en interruptores. | Revisión; pendiente de prueba manual completa (ver QA) |
| 2.3.3 Animación | `prefers-reduced-motion` y el ajuste «Reducir movimiento»: fundidos simples y pose fija de la mascota. | Implementado; verificación manual en QA |
| 4.1.2 Nombre, función, valor | `role="switch"`, `role="progressbar"` con valores, `aria-label` en iconos, `role="alert"` en errores. | Revisión de componentes |
| 2.5.8 Tamaño del objetivo | Objetivos ≥ 32 px. | Revisión |

## 9. Decisiones de diseño y su porqué
### 9.1 La transición Despertar → Sesión activa
No es un adorno: resuelve un problema de **orientación**. Al pasar de «presentación» a «herramienta», una transición continua con un **elemento compartido** (Nilo viaja a la barra lateral) mantiene la **constancia del objeto**: el usuario entiende que es el mismo personaje y que el espacio cambió, no que «apareció otra pantalla». La secuencia (onda de escaneo → viaje de Nilo → paneles en cascada → barra lateral) dura 1,0 a 1,4 s para ser percibida sin hacer esperar, y respeta `prefers-reduced-motion` degradándose a un fundido simple. Solo se anima desenfoque en esa entrada única; el resto usa solo `transform` y `opacity` para mantener la fluidez.

### 9.2 Modo oscuro
- **Contexto:** es una herramienta que «vigila» y se consulta en momentos de tensión; el fondo oscuro reduce la fatiga y da un aire de centro de control.
- **Semáforo:** verde, ámbar y rojo destacan más y se distinguen mejor sobre fondo oscuro con resplandor.
- **Costo asumido:** el contraste sobre superficies translúcidas es más delicado; por eso se midió con pruebas automáticas y se limitó la intensidad de la malla bajo los paneles.
- **Limitación honesta:** la app es solo oscura; no se implementó modo claro.

### 9.3 Semáforo con icono y texto
Un tercio de los usuarios puede tener dificultad con el rojo/verde y la gente de estrés alto lee de forma superficial. Icono + palabra + color redundan la señal (WCAG 1.4.1) y hacen el veredicto legible de un vistazo.

### 9.4 El escáner y el resaltado de señales
Mostrar **por qué** se emitió un veredicto genera confianza: el texto analizado se marca con las partes que dispararon cada señal. Convierte una «caja negra» en una explicación verificable y enseña al usuario a reconocer patrones por sí mismo.

### 9.5 Vidrio, profundidad y la mascota 3D
El vidrio (desenfoque, borde luminoso, resaltado interno) crea jerarquía de capas sin recurrir a sombras pesadas. La mascota en 3D da **afecto y diferenciación**; se limita a lo que aporta (saludo, mirada, estados) y tiene respaldos: foto fija en tamaños diminutos, SVG sin WebGL y pose fija con movimiento reducido.

### 9.6 Privacidad como parte de la interfaz
El aviso de privacidad está en el onboarding y en Ajustes; la IA solo ve mensajes dudosos y con claves, códigos y tarjetas tapados; el historial nunca sale del equipo; la clave de la IA se guarda cifrada y nunca vuelve a mostrarse. La confianza se diseña, no solo se promete.

## 10. Limitaciones y trabajo futuro
- **No hubo pruebas con usuarios reales.** La evaluación es una inspección experta (heurísticas) más verificaciones automáticas; la validación con personas queda como siguiente paso.
- **Solo modo oscuro.**
- La app es la versión de escritorio; el ecosistema (celular, reloj) no está construido.
- Las reglas locales se calibraron con un corpus de 30 mensajes escrito por el equipo; sirve como prueba de regresión, no como medida de precisión en el mundo real.
