// Agenda y tareas (se construye en la fase 6)
import { placeholder } from "./area.js";

export const render = state => placeholder(state, "ag", 6, [
  "Tareas con fecha límite, prioridad y etiquetas",
  "Tareas recurrentes que se repiten solas",
  "Eventos con hora en vista de calendario",
  "Exportar al Calendario del iPhone (.ics) para recibir avisos"
]);
