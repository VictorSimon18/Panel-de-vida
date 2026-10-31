// Finanzas (se construye en la fase 3)
import { placeholder } from "./area.js";

export const render = state => placeholder(state, "fin", 3, [
  "Cuentas (banco, efectivo, ahorro…) con transferencias entre ellas",
  "Gastos e ingresos con categorías y subcategorías",
  "Suscripciones y gastos fijos que se apuntan solos cada mes",
  "Metas de ahorro con progreso",
  "Gráficos de evolución del saldo y gasto por categoría"
]);
