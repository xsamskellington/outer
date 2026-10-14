<p align="center">
  <a href="https://outer313.com">
    <img src="https://www.outer313.com/opengraph-image" alt="OUTER — estudio y laboratorio creativo" width="720">
  </a>
</p>

<p align="center">
  Estudio y laboratorio creativo que explora y habita las fronteras entre la tek y el arte.
  <br>
  <a href="https://outer313.com"><strong>outer313.com</strong></a>
  ·
  <a href="https://www.instagram.com/outer_313/">@outer_313</a>
  ·
  <a href="mailto:hola@outer313.com">hola@outer313.com</a>
</p>

---

## Qué hay acá

El sitio de OUTER: una home con forma de escritorio y un laboratorio de herramientas visuales que corren en el navegador.

| Ruta | Qué es |
| --- | --- |
| [`/`](https://outer313.com) | **Escritorio.** Ventanas arrastrables (`trabajos.txt`, `lab/`, `about.md`) sobre un fondo de dither en vivo. En mobile, un dock abajo muestra una ventana a la vez. |
| [`/outer-vj`](https://outer313.com/outer-vj) | **OUTER VJ.** Generador ASCII / dither en tiempo real para visuales: presets, paletas, movimiento continuo y pantalla completa. Por [Mati Mast](https://www.instagram.com/mati.mast/). |
| [`/wirefield`](https://outer313.com/wirefield) | **Wirefield.** Sistema de partículas 3D generativo (three.js) con efecto Plexus, superficies trianguladas y 24 presets. Por [Mati Mast](https://www.instagram.com/mati.mast/). |

Las tres páginas funcionan en desktop y en mobile, y tienen su propia imagen para cuando se comparte el link.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [three.js](https://threejs.org/) para Wirefield (se carga solo en esa página)
- Canvas 2D para el dither de la home y de OUTER VJ
- CSS Modules, sin librerías de UI
- Deploy en [Vercel](https://vercel.com/) con **Node.js 24.x**

## Correrlo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Los cambios se ven al guardar.

Para probarlo desde el celular en la misma red WiFi:

```bash
npx next dev -H 0.0.0.0
```

y entrá a `http://<IP-de-tu-compu>:3000`.

Otros comandos:

```bash
npm run lint    # revisa el código
npm run build   # build de producción (lo mismo que corre Vercel)
npm start       # sirve el build localmente
```

## Cómo está organizado

```
src/app/
├── page.tsx                  # home (escritorio)
├── layout.tsx                # metadata, idioma, fuente Roboto (next/font)
├── og.tsx                    # imagen para compartir, usada por cada opengraph-image.tsx
├── components/
│   ├── desktop/              # escritorio: ventanas, íconos, dock, fondo
│   ├── works/data.ts         # ← lista de trabajos
│   ├── lab/previews.tsx      # miniaturas animadas de OUTER VJ y Wirefield
│   ├── canvas/dither.ts      # loop de canvas compartido (pausa fuera de pantalla)
│   └── content/              # home original, guardada como backup (no se usa)
├── outer-vj/                 # OUTER VJ: config, motor de render y UI
└── wirefield/                # Wirefield: presets, motor three.js, plexus y UI
```

## Tareas comunes

### Agregar un trabajo

Sumá una línea en [`src/app/components/works/data.ts`](src/app/components/works/data.ts), arriba de todo para que aparezca primero:

```ts
{ title: 'Artista — Tema', category: 'videoclips', latest: true, url: 'https://…' },
```

`category` puede ser `cine`, `series`, `videoclips` o `instalaciones`. Con `latest: true` aparece la etiqueta **nuevo**.

### Agregar un preset o una paleta a OUTER VJ

Todo está en [`src/app/outer-vj/config.ts`](src/app/outer-vj/config.ts): agregá una entrada en `PRESETS` o en `PALETTES` y aparece sola en los menús.

### Actualizar Wirefield a una versión nueva

Wirefield es un port a React del archivo HTML de Mati. Si llega una versión nueva, se compara contra la anterior y se portan solo los cambios: los presets viven en [`presets.ts`](src/app/wirefield/presets.ts), la simulación en [`engine.ts`](src/app/wirefield/engine.ts) y la interfaz en [`Wirefield.tsx`](src/app/wirefield/Wirefield.tsx).

## Rendimiento

Las herramientas están pensadas para correr fluidas también en el celular:

- las animaciones se pausan cuando no están en pantalla y respetan *reducir movimiento*;
- en pantallas verticales la densidad del dither se calcula sobre el lado largo;
- el motor de Wirefield no genera basura de memoria por cuadro (buffers reservados de antemano) y no recalcula bounding spheres;
- en el celular la resolución de dibujo se limita para cuidar la batería.

## Créditos

**OUTER VJ** y **Wirefield** son de [Mati Mast](https://www.instagram.com/mati.mast/) ([@mati.mast](https://www.instagram.com/mati.mast/)).
Sitio y estudio: [OUTER](https://outer313.com).
