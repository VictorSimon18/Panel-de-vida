# Panel de Vida

Panel personal minimalista (estilo «Grafito», oscuro) para el iPhone: **finanzas**, **trabajo y estudios**, **hábitos y deporte**, y **agenda y tareas**, más una pantalla de **resumen** con niveles y experiencia (XP).

- Es una app web instalable (PWA): se añade a la pantalla de inicio y se abre a pantalla completa, como una app normal.
- Funciona sin conexión.
- **Tus datos se guardan solo en tu móvil** (IndexedDB). Nunca se suben a ningún servidor, ni siquiera a GitHub.
- No tiene dependencias: HTML, CSS y JavaScript.

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Mockups de la pantalla principal (elegida la variante A, HUD compacto) | ✅ |
| 1 | Estructura: PWA, navegación, almacenamiento, copias de seguridad | ✅ |
| 2 | Estilo completo y pantalla de resumen | ✅ |
| 3 | Finanzas | ✅ |
| 4 | Trabajo y estudios | ✅ |
| 5 | Hábitos y deporte | ✅ |
| 6 | Agenda y tareas | ✅ |
| 7 | Gamificación (XP, logros, celebraciones) y avisos en el Calendario | ✅ |

## Instalarla en el iPhone

1. Abre la dirección de la app en **Safari** (otros navegadores de iPhone no permiten instalarla).
2. Pulsa **Compartir** (el cuadrado con una flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio** y confirma.
4. Ábrela siempre desde ese icono. Los datos de la app instalada están separados de los de Safari.

## Finanzas

- **Cuentas:** banco, efectivo, ahorro, inversión, tarjeta… cada una con su saldo inicial. El saldo actual es el inicial más todos sus movimientos.
- **Movimientos:** gastos, ingresos y transferencias entre cuentas. Se pueden apuntar con el botón **+**. Tocar un movimiento lo abre para editarlo o borrarlo.
- **Importes:** valen `12,50`, `1.234,56` o `12.5`.
- **Categorías:** hay una lista inicial con subcategorías y se puede cambiar en *Gastos → Categorías*. Al borrar una subcategoría, sus movimientos pasan a la categoría principal.
- **Fijos:** se repiten cada mes, semana o año y se apuntan solos el día que toca, aunque la app lleve días sin abrirse.
- **Metas de ahorro:** objetivo, aportaciones y, si les pones fecha límite, cuánto tienes que ahorrar al mes para llegar.

## Trabajo y estudios

- **Tiempo:** apuntas a mano las horas de trabajo o de estudio, con botones rápidos de +15 min, +30 min, +1 h y +2 h y un proyecto opcional. Arriba ves la semana día a día y puedes ir a semanas anteriores. Debajo, las horas de las últimas 8 semanas.
- **Proyectos y objetivos:** se dividen en hitos. El porcentaje de avance sale de los hitos completados. Cada proyecto puede tener fecha límite y muestra las horas que le has dedicado. Los terminados se pueden archivar.
- **Aprendizaje:** cursos, libros y habilidades con su progreso (p. ej. 12/40 lecciones). Con **+1** avanzas una unidad.

## Hábitos y deporte

- **Hábitos:**
  - Cada hábito tiene un objetivo con cantidad (p. ej. 2 L) y lo que suma cada toque de **+** (p. ej. 0,5 L).
  - La frecuencia puede ser diaria, en días concretos o X veces por semana.
  - Un hábito puede **marcarse solo** al apuntar un entreno de gimnasio, de fútbol o cualquiera.
- **Rachas:** días seguidos cumpliendo (o semanas, en los hábitos semanales). Si no cumples un día que tocaba, la racha vuelve a 0. Mientras el día de hoy no termina, no rompe la racha.
- **Mapa de calor:** uno general de 17 semanas y otro dentro de cada hábito. Toca un hábito para verlo junto con su mejor racha y su % de cumplimiento.
- **Gimnasio:** rutinas guardadas. Al entrenar, cada ejercicio sale relleno con lo que hiciste la última vez, y el peso de la primera serie se copia a las siguientes. Avisa de los récords nuevos y muestra la evolución de cada ejercicio con su 1RM estimado (fórmula de Epley).
- **Fútbol:** entrenamientos y partidos con sus minutos.
- **Cuerpo:** peso, % de grasa y cintura, con gráfico.
- **Bienestar:** horas y calidad del sueño, y estado de ánimo (de Fatal a Genial) de los últimos 14 días.
- **Botón +:** *Hábito, sueño o ánimo* abre el registro rápido del día, y *Entreno o tiempo* incluye Gimnasio y Fútbol.

## Agenda y tareas

- **Tareas:** fecha y hora opcionales, prioridad, etiquetas y nota. Se agrupan en Atrasadas, Hoy, Mañana, Esta semana, Más adelante y Sin fecha. Se pueden filtrar por pendientes o completadas y por etiqueta.
- **Repetición:** cada día, entre semana, cada semana, cada 2 semanas, cada mes o cada año. Al completar una tarea recurrente se crea la siguiente. Si la desmarcas, la siguiente desaparece.
- **Eventos:** todo el día o con hora de inicio y fin, lugar, nota y aviso previo.
- **Calendario:** vista mensual con puntos de colores (eventos, tareas, atrasadas). Al tocar un día ves lo que tiene y puedes añadir algo en esa fecha.

### Avisos en el iPhone (Calendario)

Una web no puede enviar notificaciones programadas por sí sola, así que los avisos los da el Calendario de iOS:

1. **Agenda → Exportar al Calendario del iPhone → Abrir en Calendario.**
2. El iPhone muestra los eventos del archivo. Pulsa **Añadir todo** y elige un calendario.
3. Los eventos se exportan con el aviso que elegiste. Las tareas con hora avisan a esa hora y las de todo el día, a las 9:00. Las tareas recurrentes se exportan con su repetición.

La opción **Solo lo nuevo** exporta únicamente lo creado o cambiado desde la última exportación, para no duplicar. Si cambias o borras algo que ya habías exportado, cámbialo también en el Calendario.

Si **Abrir en Calendario** no muestra el botón *Añadir todo*, usa **Compartir archivo** → *Guardar en Archivos*. Después, en la app Archivos, toca el `.ics` para importarlo.

## Navegación

En cualquier pantalla que no sea el resumen, el botón de la casita (arriba a la izquierda) te devuelve al inicio.

## Datos de ejemplo

Para ver cómo queda el panel con datos antes de apuntar los tuyos: **Ajustes → Cargar datos de ejemplo**. Esta opción solo aparece si el panel está vacío. Con **Quitar datos de ejemplo** vuelve a quedar vacío y se mantiene tu alias.

## Copias de seguridad (importante en iPhone)

iOS puede borrar los datos de una web si pasa mucho tiempo sin abrirse. Para no perder nada:

- **Exportar:** Ajustes (rueda dentada en el resumen) → **Exportar copia** → **Guardar en Archivos** (mejor en iCloud Drive). Se genera un archivo `panel-de-vida-AAAA-MM-DD.json`.
- **Importar:** Ajustes → **Importar copia** → elige el archivo. Sustituye todos los datos actuales, y la app te pide confirmación antes.
- Si llevas 7 días sin exportar, el resumen muestra un aviso.

## Publicarla con GitHub Pages

1. En GitHub, abre el repositorio → **Settings** → **General**. Comprueba que es **público**.
2. **Settings** → **Pages** → en *Build and deployment*, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)` → **Save**.
3. En un par de minutos la app estará en `https://<tu-usuario>.github.io/panel-de-vida/`.

### Al publicar cambios

Con conexión, la app siempre pide primero la última versión de cada archivo; sin conexión, usa la copia guardada. Así los cambios publicados se ven al volver a abrirla.

Aun así, sube el número de `VERSION` en `sw.js` (por ejemplo, de `v0.3.1` a `v0.3.2`) cada vez que añadas o quites archivos, para que se renueve la copia que se usa sin conexión.

## Probarla en el ordenador

Los módulos de JavaScript no funcionan abriendo `index.html` con doble clic: hace falta un pequeño servidor local.

```bash
cd panel-de-vida
python3 -m http.server 8000
# y abre http://localhost:8000
```

En Chrome o Safari, activa la vista de móvil de las herramientas de desarrollo para verla a tamaño iPhone.

## Estructura del código

```
index.html              Página única: contenedor de vistas y barra inferior
manifest.webmanifest    Datos de la app instalable (nombre, icono, colores)
sw.js                   Service worker: modo sin conexión
css/
  tokens.css            Colores, tipografía y medidas (cambia aquí el estilo)
  base.css              Reset, fondo grafito y estructura
  components.css        Tarjetas, barras de XP, barra inferior, hojas, botones…
fonts/inter-latin.woff2 Tipografía Inter (incluida para funcionar sin conexión)
icons/                  Icono de la app (SVG y PNG)
js/
  app.js                Arranque y navegación entre pantallas (#resumen, #finanzas…)
  db.js                 Acceso a IndexedDB
  state.js              Estructura de los datos, guardado y migraciones de versión
  game.js               XP calculada, niveles, títulos y logros
  celebrate.js          Celebraciones: +XP, aviso de subida de nivel, avisos de logro
  backup.js             Exportar e importar copias
  quickadd.js           Menú del botón +
  stats.js              Cálculos del resumen (hoy, hábitos, dinero, semana, racha)
  charts.js             Gráficos SVG propios (barras + línea semanal, anillos)
  icons.js              Juego de iconos
  demo.js               Datos de ejemplo (se cargan y se quitan desde Ajustes)
  ui.js                 Utilidades: formatos, hoja inferior, avisos
  finance.js            Lógica de finanzas: categorías, saldos, fijos automáticos
  work.js               Lógica de trabajo y estudios: horas por semana, proyectos, aprendizaje
  forms.js              Piezas de formulario compartidas
  habits.js             Lógica de hábitos: rachas, cumplimiento, mapa de calor
  sport.js              Lógica de deporte: récords, fútbol, sueño y ánimo
  agenda.js             Lógica de agenda: repeticiones, agrupación, calendario, exportación .ics
  views/                Una vista por pantalla (resumen, finanzas, trabajo, hábitos, agenda, ajustes)
                        y sus formularios (p. ej. finanzas-forms.js)
```

### Cómo se guardan los datos

Todo el estado es un único objeto JSON (ver `defaultState()` en `js/state.js`) guardado en IndexedDB. Ese mismo objeto es el que se exporta como copia. Cada cambio de formato sube `SCHEMA_VERSION` y añade una migración, para que las copias antiguas sigan funcionando.

### Gamificación

- **La XP se calcula a partir de tus datos** (ver `computeXP()` en `js/game.js`) en vez de sumarse en cada acción. Si borras algo o desmarcas una tarea, la XP se ajusta sola, y marcar y desmarcar no la infla. Solo se guardan los logros desbloqueados, con su fecha, y el último nivel celebrado.
- **Tabla de XP:** está en la pantalla **Logros** (toca la tarjeta de XP del resumen) y en `XP` / `XP_RULES` de `js/game.js`. Cambia ahí los valores si quieres otro ritmo.
- **Niveles:** pasar del nivel *n* al *n+1* cuesta `100 + 50·(n−1)` XP. Hay un nivel global (la suma) y uno por área.
- **Títulos según el nivel global:** Novato (1), Iniciado (3), Runner (5), Netrunner (10), Operador (15), Ciberninja (20), Arquitecto (30) y Leyenda neón (40).
- **Logros:** 35, en `ACHIEVEMENTS` de `js/game.js`. Los bloqueados muestran su progreso.
- **Celebraciones:**
  - Al ganar XP aparece una burbuja "+XP".
  - Al subir de nivel global, una tarjeta centrada con el nuevo nivel y el título.
  - Al subir de nivel en un área o desbloquear un logro, un aviso arriba.
  - Si el iPhone tiene activado *Reducir movimiento*, se muestran sin animación.
  - Importar una copia o cargar los datos de ejemplo no lanza celebraciones.
