import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { brand, cases, dials, find, parts, specs, straps, totalPrice } from "../data/watch";
import { ui } from "../data/ui";

// Text that rises softly into view
function Rise({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.35 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// One full-screen section. data-stage tells the 3D watch which pose to take
function Section({ id, children, className = "" }) {
  return (
    <section id={id} data-stage className={`relative min-h-svh flex px-5 md:px-[7vw] ${className}`}>
      {children}
    </section>
  );
}

// A side column of text (start = left in English, right in Arabic)
const Column = ({ children, side = "start" }) => (
  <div className={`w-full md:w-[42%] ${side === "end" ? "md:ms-auto" : ""}`}>{children}</div>
);

export function Hero({ lang }) {
  const t = ui[lang];
  return (
    <Section id="top" className="flex-col items-center justify-between pt-28 pb-14 text-center">
      <Rise>
        <p className="label">
          {t.heroLabel} · <span dir="ltr">{brand.name}</span>
        </p>
        <h1 className="font-display text-6xl md:text-8xl mt-4 shine" dir="ltr">
          {t.heroTitle}
        </h1>
      </Rise>
      <Rise delay={0.2}>
        <p className="text-haze max-w-md mx-auto">{t.heroText}</p>
        <p className="label mt-6 animate-pulse">{t.scroll} ↓</p>
      </Rise>
    </Section>
  );
}

// The visitor's own time, written out, ticking every second
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const two = (n) => String(n).padStart(2, "0");
  return (
    <p className="font-display text-6xl md:text-7xl tabular-nums mt-8 text-gold" dir="ltr">
      {two(now.getHours())}:{two(now.getMinutes())}
      <span className="text-haze">:{two(now.getSeconds())}</span>
    </p>
  );
}

export function Live({ lang }) {
  const t = ui[lang];
  return (
    <Section id="time" className="items-end md:items-center pb-16 md:pb-0">
      <Column>
        <Rise>
          <p className="label flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t.liveLabel}
          </p>
          <h2 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">{t.liveTitle}</h2>
          <p className="text-haze mt-5 max-w-sm leading-relaxed">{t.liveText}</p>
          <Clock />
        </Rise>
      </Column>
    </Section>
  );
}

export function Inside({ lang }) {
  const t = ui[lang];
  return (
    <Section id="inside" className="items-end md:items-center pb-10 md:pb-0">
      <Column>
        <Rise>
          <p className="label">{t.insideLabel}</p>
          <h2 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">{t.insideTitle}</h2>
          <p className="text-haze mt-5 max-w-sm">{t.insideText}</p>
        </Rise>
        {/* The six layers, front to back */}
        <ol className="mt-8 space-y-2 hidden md:block">
          {parts.map((p, i) => (
            <Rise key={p.id} delay={0.1 + i * 0.08}>
              <li className="flex items-baseline gap-4 border-b border-edge pb-2">
                <span className="font-display text-gold" dir="ltr">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{p[lang]}</span>
                <span className="text-haze text-sm ms-auto">{p.detail[lang]}</span>
              </li>
            </Rise>
          ))}
        </ol>
      </Column>
    </Section>
  );
}

export function Movement({ lang }) {
  const t = ui[lang];
  return (
    <Section id="movement" className="items-end md:items-center pb-16 md:pb-0">
      <Column side="end">
        <Rise>
          <p className="label">{t.movementLabel}</p>
          <h2 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">{t.movementTitle}</h2>
          <p className="text-haze mt-5 max-w-md leading-relaxed">{t.movementText}</p>
        </Rise>
        <Rise delay={0.15} className="grid grid-cols-3 gap-4 mt-10">
          {t.stats.map((s) => (
            <div key={s.n}>
              <p className="font-display text-4xl md:text-5xl" dir="ltr">
                {s.n}
                <span className="text-gold text-2xl">{s.u}</span>
              </p>
              <p className="text-haze text-xs mt-1">{s[lang]}</p>
            </div>
          ))}
        </Rise>
      </Column>
    </Section>
  );
}

// Round color buttons for one choice (case, dial or strap)
function Choice({ title, list, value, onPick, lang, metal }) {
  const picked = find(list, value);
  return (
    <div className="mt-3 md:mt-7">
      <div className="flex justify-between text-sm">
        <span className="text-haze">{title}</span>
        <span>{picked[lang]}</span>
      </div>
      <div className="flex gap-3.5 mt-2 md:mt-3">
        {list.map((o) => {
          const on = o.id === value;
          // metals get a shiny gradient, the rest a soft one
          const fill = metal
            ? `linear-gradient(135deg, #fff9 0%, ${o.color} 38%, ${o.color} 62%, #0007 100%)`
            : `radial-gradient(circle at 30% 25%, #ffffff33, transparent 55%), ${o.color}`;
          return (
            <button
              key={o.id}
              onClick={() => onPick(o.id)}
              aria-label={o[lang]}
              aria-pressed={on}
              className={`relative w-9 h-9 md:w-10 md:h-10 rounded-full transition-transform hover:scale-110 ${on ? "scale-110" : ""}`}
            >
              <span className="absolute inset-0 rounded-full ring-1 ring-white/20" style={{ background: fill }} />
              {on && <motion.span layoutId={`ring-${title}`} className="absolute -inset-[5px] rounded-full border border-gold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Configure({ lang, config, set }) {
  const t = ui[lang];
  return (
    // Phones: the watch stays at the top and a compact panel sits under it, so you see each change
    <Section id="configure" className="items-end md:items-center pb-6 md:pb-0">
      <Column>
        <Rise className="hidden md:block">
          <p className="label">{t.configureLabel}</p>
          <h2 className="font-display text-5xl md:text-6xl mt-4">{t.configureTitle}</h2>
        </Rise>
        <Rise delay={0.1} className="rounded-3xl bg-glass/80 backdrop-blur-xl border border-edge px-4 py-1 pb-4 md:p-6 md:mt-6 md:max-w-md">
          <Choice title={t.caseLabel} list={cases} value={config.case} onPick={(v) => set("case", v)} lang={lang} metal />
          <Choice title={t.dialLabel} list={dials} value={config.dial} onPick={(v) => set("dial", v)} lang={lang} />
          <Choice title={t.strapLabel} list={straps} value={config.strap} onPick={(v) => set("strap", v)} lang={lang} />
          <div className="flex items-end justify-between mt-4 pt-3 md:mt-7 md:pt-5 border-t border-edge">
            <span className="text-haze text-sm">{brand.model}</span>
            <motion.span key={totalPrice(config)} initial={{ opacity: 0.3, y: -6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl" dir="ltr">
              ${totalPrice(config).toLocaleString("en-US")}
            </motion.span>
          </div>
        </Rise>
      </Column>
    </Section>
  );
}

export function Specs({ lang }) {
  const t = ui[lang];
  return (
    <Section id="specs" className="items-end md:items-center pb-16 md:pb-0">
      <Column side="end">
        <Rise>
          <p className="label">{t.specsLabel}</p>
          <h2 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">{t.specsTitle}</h2>
        </Rise>
        <Rise delay={0.1}>
          <dl className="mt-8">
            {specs.map((s) => (
              <div key={s.en} className="flex justify-between gap-6 py-3 border-b border-edge">
                <dt className="text-haze">{s[lang]}</dt>
                <dd className="text-end">{s.value[lang]}</dd>
              </div>
            ))}
          </dl>
        </Rise>
      </Column>
    </Section>
  );
}

export function Order({ lang, config }) {
  const t = ui[lang];
  const price = totalPrice(config);
  const lines = [
    `• ${t.caseLabel}: ${find(cases, config.case)[lang]}`,
    `• ${t.dialLabel}: ${find(dials, config.dial)[lang]}`,
    `• ${t.strapLabel}: ${find(straps, config.strap)[lang]}`,
  ];
  const link = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(t.message(lines, price.toLocaleString("en-US")))}`;
  return (
    <Section id="order" className="flex-col items-center justify-end pb-20 text-center">
      <Rise>
        {/* The watch itself sits above, in its box. Here: the chosen setup + the button */}
        <p className="text-haze">{lines.map((l) => l.slice(2)).join(" · ")}</p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 mt-8 rounded-full bg-pearl text-void px-8 py-4 font-semibold hover:bg-white transition-colors"
        >
          {t.orderSend} · <span dir="ltr">${price.toLocaleString("en-US")}</span>
        </a>
      </Rise>
    </Section>
  );
}
