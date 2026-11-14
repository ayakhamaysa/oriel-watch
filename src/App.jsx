import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { useLanguage } from "./useLanguage";
import Stage from "./components/Stage";
import { Configure, Hero, Inside, Live, Movement, Order, Specs } from "./components/Sections";
import { brand } from "./data/watch";
import { ui } from "./data/ui";

export default function App() {
  const { lang, toggle } = useLanguage();
  const t = ui[lang];
  const [config, setConfig] = useState({ case: "steel", dial: "blue", strap: "black" });
  const set = (key, value) => setConfig((c) => ({ ...c, [key]: value }));
  const stage = useRef(0); // which section is on screen (2.5 = halfway between sections 2 and 3)

  // Follow the scroll and work out the section number for the 3D watch
  useEffect(() => {
    const update = () => {
      const tops = [...document.querySelectorAll("[data-stage]")].map((s) => s.offsetTop);
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      const next = tops[i + 1] ?? tops[i] + window.innerHeight;
      stage.current = i + Math.min(1, Math.max(0, (y - tops[i]) / (next - tops[i])));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-5 md:px-[4vw] bg-void/40 backdrop-blur-xl border-b border-white/5">
        <a href="#top" className="font-display text-2xl tracking-[0.35em]" dir="ltr">
          {brand.name}
        </a>
        <nav className="hidden md:flex gap-8 text-sm text-haze">
          {Object.entries(t.nav).map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hover:text-pearl transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="text-sm text-haze hover:text-pearl px-3 py-1.5">
            {t.switchLang}
          </button>
          <a href="#order" className="text-sm rounded-full border border-gold/60 text-gold px-4 py-1.5 hover:bg-gold hover:text-void transition-colors">
            {t.order}
          </a>
        </div>
      </header>

      <Stage stage={stage} config={config} rtl={lang === "ar"} lang={lang} />

      {/* The page text sits above the 3D. The mouse passes through it (to drag the watch);
          only links and buttons catch it */}
      <main className="relative z-20 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <Hero lang={lang} />
        <Live lang={lang} />
        <Inside lang={lang} />
        <Movement lang={lang} />
        <Configure lang={lang} config={config} set={set} />
        <Specs lang={lang} />
        <Order lang={lang} config={config} />
      </main>

      <footer className="relative z-20 border-t border-edge bg-void">
        <div className="px-5 md:px-[4vw] py-7 flex flex-wrap gap-3 justify-between text-sm text-haze">
          <span>
            <span dir="ltr" className="font-display text-pearl tracking-[0.3em]">
              {brand.name}
            </span>{" "}
            · {t.concept}
          </span>
          <span>
            {t.madeBy}{" "}
            <a href="https://www.instagram.com/oneclick.ps" target="_blank" rel="noreferrer" className="font-semibold text-pearl">
              One Click
            </a>
          </span>
        </div>
      </footer>
    </MotionConfig>
  );
}
