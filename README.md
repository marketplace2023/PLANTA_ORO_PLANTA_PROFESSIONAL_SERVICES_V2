# Portal de Servicios Profesionales · Ecosistema FUR

Entorno donde cada **empresa contratista** gestiona sus servicios profesionales y su presencia en el directorio. Mismo layout y
diseño que el panel de planta, el de administración y el de proveedores (navy + gold, `docs/design.md`).

Los servicios activos aparecen en el directorio público de Servicios Profesionales de la web, filtrables por **etapa del proceso**
y por **especialidad**. La especialidad es texto libre: conviene reutilizar las que ya existen (el formulario las sugiere).

## Pantallas

| Sección | Qué hace |
|---|---|
| Resumen | Servicios activos/inactivos, especialidades, disponibilidad, calificación, verificación, avance del perfil y cobertura por etapas |
| Servicios | Crear, editar, desactivar y reactivar servicios (nombre, especialidad, descripción, etapas que atiende) |
| Perfil | Datos de la empresa, **logo**, certificaciones y disponibilidad. Razón social, NIF, país, estado, verificación y calificación los fija el administrador |
| Equipo | El responsable agrega o quita personas de la empresa |

- **Disponibilidad** (Disponible / limitada / No disponible): se cambia con un clic y se refleja al instante en el directorio público.
- Un servicio *inactivo* deja de verse en el directorio pero se conserva para reactivarlo.
- Una persona puede gestionar **varias empresas** (selector en la barra lateral).
- Sin empresa, el portal ofrece **registrarla**: queda *pendiente* hasta que el administrador la apruebe (Administración →
  Proveedores y contratistas → Contratistas). Mientras tanto puede completar el perfil y subir el logo, pero no crear servicios.
- Una empresa *suspendida* no se puede editar.

## Registro y acceso

Hay **una sola cuenta para todos los portales**: se crea desde «Crea una» en el login (nombre, apellido, correo y contraseña de al menos 10 caracteres) y esa misma credencial entra a los demás portales. Crear la cuenta no da acceso a nada por sí sola: el portal ofrece **registrar la empresa contratista**, que queda *pendiente* hasta que el administrador la apruebe (Administración → Proveedores y contratistas → Contratistas). Mientras la solicitud esté pendiente se puede preparar el perfil, pero no operar. La política de seguridad definitiva está por analizar.

## Logo

Se sube como archivo (PNG, JPG o WebP, hasta 5 MB). El servidor valida el **contenido real** (SVG y HTML se rechazan a propósito)
y lo sirve público en `GET /contractors/:id/logo`. Poner una URL externa reemplaza el archivo subido.

## Ejecutar

```bash
# En ../planta_beneficio_oro
npm run db:local        # Postgres local
npm run dev:api         # API en :3000

# En esta carpeta
npm install
npm run dev             # http://localhost:5179
```

Usuario de demo: `contratista@fur.local` / `fur-local-2026` (Mecánica Industrial Minera).

## Calidad

```bash
npm run lint
npm test
npm run build
```
