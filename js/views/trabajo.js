// Trabajo y estudios (se construye en la fase 4)
import { placeholder } from "./area.js";

export const render = state => placeholder(state, "work", 4, [
  "Registro manual de horas por proyecto o materia",
  "Proyectos y objetivos con hitos y porcentaje de avance",
  "Aprendizaje: cursos, libros y habilidades con su progreso",
  "Gráficos de horas por semana y por proyecto"
]);
