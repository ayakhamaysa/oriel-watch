# ORIEL Heritage 40 — 3D Watch

A launch page for a luxury automatic watch, built around a real-time 3D model made entirely in code.

- **Live time:** the hands show the visitor's real time, with a smooth sweeping seconds hand.
- **Exploded view:** scroll and the watch opens layer by layer (crystal, bezel, hands, dial, movement, caseback).
- **Living movement:** turn it over to see the gears turn, the balance wheel swing and the rotor spin through the sapphire back.
- **Configurator:** case metal, dial and strap, with a live price.
- **Presentation box:** at the end the watch rests in its branded box, strap wrapped around the cushion, ready to order on WhatsApp.
- Drag to turn, English / Arabic (RTL), no 3D files to download: every part and finish (sunburst dial, perlage, Côtes de Genève, leather grain) is generated in code.

**Built with:** React, Three.js, React Three Fiber, drei, Framer Motion, Tailwind CSS, Vite.

> Concept brand for a portfolio.

## Run it
```
npm install
npm run dev
```

## Edit
- Choices, prices, specs, WhatsApp number: `src/data/watch.js`
- Texts (English / Arabic): `src/data/ui.js`
- The watch parts: `src/components/Watch.jsx`
- Where the watch stands in each section: `src/components/Stage.jsx` (POSES)

Made by [One Click](https://www.instagram.com/oneclick.ps)
