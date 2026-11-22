# Escudo Guardián 0.3.0

Escudo Guardián revisa mensajes, links y capturas de pantalla y avisa con un semáforo (seguro, sospechoso o peligroso) si parecen una estafa. Está pensado para las estafas que circulan en Colombia: Nequi, Daviplata, bancos, paquetes retenidos, premios, empleos falsos, el «cambié de número». Nilo, un guardián 3D, da el aviso con su propia voz.

La versión 0.2.0 no llegó a publicarse, así que estas notas cubren todo lo que cambió desde la 0.1.0.

## Novedades desde la 0.1.0

- **Cuentas.** Se crean con correo y contraseña. El historial, la criatura y los ajustes se guardan en la nube y se ven desde cualquier equipo. Cada cuenta solo puede leer sus propias filas. Al registrarse, un medidor explica qué le falta a la contraseña y ofrece una sugerida.
- **Español e inglés**, y tema oscuro, claro o del sistema, desde Ajustes. El cambio de idioma incluye los resultados del análisis, la bandeja y las notificaciones.
- **Arena del Guardián.** Un minijuego de 8 rondas y 3 corazones contra nueve villanos, uno por tipo de estafa. Se responde «Es estafa» o «Es seguro» (teclas `E` y `S`) y cada acierto suma experiencia a Nilo.
- **Apariencias de Nilo** que se desbloquean por nivel (Clásico, Medianoche, Esmeralda, Fuego y Aurora) y una carta coleccionable holográfica en la pantalla Criatura.
- **Capturas con varios mensajes.** Si una captura trae más de un mensaje, cada uno se analiza por separado y tiene su pestaña y su semáforo.
- **Nilo reacciona al contexto.** En los casos dudosos, Gemini elige el gesto de Nilo de una lista cerrada, y la app solo lo acepta si encaja con el veredicto.
- **Inicio renovado**, con Nilo grande, el nivel, la próxima apariencia y accesos directos a Analizar y a la Arena.

## Pulido de esta versión

Se revisó cada pantalla a 900×600, 1100×720 y 1920×1080, en tema oscuro y claro, en español y en inglés, y se recorrió todo con teclas reales.

- El campo del nombre recibe el foco en el último paso de la bienvenida.
- La carta coleccionable ya no se corta en ventanas angostas.
- El formulario de «Crear cuenta» se desplaza en vez de quedar cortado arriba.
- El saludo y la barra de nivel quedan alineados con el contenido en pantalla completa.
- Las flechas, `Inicio` y `Fin` mueven la selección y el foco entre las pestañas de una captura.
- En Ajustes el foco ya no se pierde al cambiar una opción; en Historial, «Cancelar» recibe el foco y `Esc` cancela el borrado.
- Una captura sin clave de IA dice que necesita la IA, en vez de hablar de reglas locales que no se usaron.
- El texto del historial vacío ya no dice «solo en tu computador», porque ahora se sincroniza con la cuenta.
- La versión que muestra la app sale de `package.json`.
- El ícono usa un primer plano de la cara y la gorra en los tamaños de 16 a 32 px, donde el cuerpo entero se perdía sobre la barra de tareas.

## Instalar (Windows 10 u 11)

1. Descarga `EscudoGuardian-0.3.0-setup.exe`.
2. Ábrelo. Como el instalador no está firmado, Windows puede mostrar «Windows protegió tu PC»: pulsa **Más información** y luego **Ejecutar de todas formas**.
3. Abre Escudo Guardián y crea una cuenta o inicia sesión.

Sin clave de Gemini la app funciona en modo demo: las reglas locales son las reales y la segunda opinión de la IA se simula. La clave se pega en Ajustes y se guarda cifrada.

## Verificación

- 266 pruebas automáticas pasan en 19 archivos, entre ellas el contraste AA en ambos temas y un corpus de 30 mensajes (15 estafas y 15 legítimos).
- Con las reglas locales, 14 de las 15 estafas salen como peligrosas y la otra cae en la zona que se consulta a la IA. Ninguna estafa sale como segura y ningún mensaje legítimo sale como sospechoso.
- El instalador se instaló en una carpeta temporal, se abrió y se desinstaló sin dejar archivos, accesos ni entradas de registro. El paquete no contiene `.env` ni claves.

## Límites conocidos

- Crear una cuenta o iniciar sesión por primera vez necesita internet.
- El instalador no está firmado.
- Copiar exactamente el mismo texto dos veces seguidas no activa el vigilante del portapapeles por segunda vez; hay que copiar algo distinto en medio.
- Las pruebas manuales que dependen de Windows o de otro equipo (SmartScreen, notificación nativa, Narrador, otro computador) están listadas en `docs/QA.md`, sección 15.
