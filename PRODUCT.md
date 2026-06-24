# Product

## Register

product

## Users

Dueños y gerentes de PyMEs latinoamericanas que gestionan operaciones diarias: flotas de vehículos, cocinas/restaurantes, finanzas, inventario y equipos. Usan Merlin tanto en escritorio (oficina) como en móvil (campo, calle), necesitando que la interfaz funcione bien en ambas condiciones. Los operadores también registran datos en el día a día desde el teléfono.

## Product Purpose

Merlin es una plataforma multi-tenant de gestión empresarial que centraliza flotas, cocinas, finanzas, inventario, contactos y equipos en un solo lugar. Cada organización tiene su espacio aislado con roles granulares (owner, admin, collaborator, viewer). El éxito es que un dueño de PyME pueda gestionar toda su operación sin necesitar múltiples herramientas ni capacitación técnica.

## Brand Personality

Amigable, moderno, accesible. Merlin habla en español, tutea al usuario, y transmite cercanía sin ser infantil. El tono es directo y claro — como un colega competente que te simplifica el trabajo. Referencia de feel: Stripe Dashboard (claridad), Vercel (modernidad), Linear (eficiencia sin ruido).

## Anti-references

- ERPs corporativos (SAP, Oracle, Odoo): interfaces recargadas, menús anidados infinitos, tablas que ocupan toda la pantalla sin jerarquía visual, estética de los 2000s
- Dashboards con demasiados gráficos y KPIs compitiendo por atención
- Formularios densos con 30 campos visibles a la vez sin agrupación

## Design Principles

1. **Claridad sobre decoración** — Cada elemento tiene un propósito. Si no ayuda al usuario a completar su tarea, no está.
2. **Mobile-real, no mobile-responsive** — Diseñado para usarse con una mano en la calle, no solo "que quepa en pantalla chica".
3. **Progresivo, no abrumador** — Mostrar lo esencial primero, revelar complejidad bajo demanda. Un dueño nuevo debe sentirse cómodo en 5 minutos.
4. **Consistencia silenciosa** — Mismos patrones en todos los módulos. El usuario aprende una vez y navega todo sin pensar.
5. **Bilingüe por diseño** — La interfaz es en español pero los patterns y la arquitectura soportan internacionalización sin hacks.

## Accessibility & Inclusion

- WCAG 2.1 AA como mínimo
- Uso dual: escritorio en oficina + móvil en campo (bajo el sol, en movimiento)
- Alto contraste necesario para legibilidad en exteriores
- Touch targets mínimos de 44px para operadores con guantes o manos ocupadas
- Soporte para `prefers-reduced-motion` en todas las animaciones
