import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Minus, Plus, Maximize2 } from "lucide-react";
import type { Civilization, SimulationResult } from "../science/types";
import { LIGHT_YEARS_PER_KPC } from "../science/physics";
import { random } from "../science/random";
import { GuideHelp } from "./GuideHelp";
export const number = (n: number, digits = 0) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        notation: Math.abs(n) >= 1e7 ? "scientific" : "standard",
      }).format(n)
    : "Unreachable";
export function status(c: Civilization, time = 0) {
  return c.birth > time
    ? "Not yet born"
    : c.death <= time
      ? "Extinct"
      : c.emissionEnd <= time
        ? "Post-emission"
        : "Emitting";
}
const colors: Record<string, string> = {
  "Not yet born": "#526779",
  Extinct: "#78818f",
  "Post-emission": "#edbd79",
  Emitting: "#8e9fff",
};
export default function Galaxy({
  result,
  selected,
  onSelect,
}: {
  result: SimulationResult;
  selected: Civilization | null;
  onSelect: (c: Civilization | null) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 550 }),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [time, setTime] = useState(0),
    [range, setRange] = useState(true),
    [waves, setWaves] = useState(true),
    [hover, setHover] = useState<{
      c: Civilization;
      x: number;
      y: number;
    } | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    moved: boolean;
  } | null>(null);
  const { parameters: p, civilizations: civs } = result;
  const scale = (Math.min(size.w, size.h) / (p.radius * 2 + 6)) * zoom,
    cx = size.w / 2 + pan.x,
    cy = size.h / 2 + pan.y;
  const stars = useMemo(() => {
    const rng = random(1927);
    return Array.from({ length: 3600 }, () => {
      const r = p.radius * Math.sqrt(rng()),
        arm = Math.floor(rng() * 4),
        angle =
          (arm * Math.PI) / 2 + Math.log(1 + r) * 2.9 + (rng() - 0.5) * 0.5;
      return {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
        a: rng() * 0.36 + 0.06,
        s: rng() * 0.9 + 0.3,
      };
    });
  }, [p.radius]);
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setTime(0), [result]);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.w, size.h);
    const point = (x: number, y: number) => [cx + x * scale, cy - y * scale];
    const circle = (
      x: number,
      y: number,
      r: number,
      color: string,
      fill = false,
    ) => {
      const [px, py] = point(x, y);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0, r * scale), 0, Math.PI * 2);
      ctx[fill ? "fillStyle" : "strokeStyle"] = color;
      fill ? ctx.fill() : ctx.stroke();
    };
    ctx.save();
    ctx.strokeStyle = "#ffffff06";
    ctx.lineWidth = 1;
    const spacing = 5 * scale;
    for (
      let x = ((cx % spacing) + spacing) % spacing;
      x < size.w;
      x += spacing
    ) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.h);
      ctx.stroke();
    }
    for (
      let y = ((cy % spacing) + spacing) % spacing;
      y < size.h;
      y += spacing
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size.w, y);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.radius * scale);
    glow.addColorStop(0, "#b5a1e026");
    glow.addColorStop(0.18, "#8177b313");
    glow.addColorStop(0.8, "#41638c0b");
    glow.addColorStop(1, "#41638c00");
    circle(0, 0, p.radius, "#0000", true);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.setLineDash([3, 6]);
    [5, 10, p.radius].forEach((r) => circle(0, 0, r, "#a1b5c51c"));
    ctx.setLineDash([]);
    for (const s of stars) {
      const [x, y] = point(s.x, s.y);
      ctx.fillStyle = `rgba(167,177,201,${s.a})`;
      ctx.beginPath();
      ctx.arc(x, y, s.s * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
    if (range && result.horizon > 0) {
      circle(p.sun, 0, result.horizon, "#73e4c009", true);
      ctx.setLineDash([5, 6]);
      circle(p.sun, 0, result.horizon, "#73e4c077");
      ctx.setLineDash([]);
    }
    if (selected && waves) {
      const outer = Math.max(0, time - selected.birth) / LIGHT_YEARS_PER_KPC,
        inner = Math.max(0, time - selected.emissionEnd) / LIGHT_YEARS_PER_KPC;
      const ro = Math.sqrt(Math.max(0, outer * outer - selected.z ** 2)),
        ri = Math.sqrt(Math.max(0, inner * inner - selected.z ** 2));
      if (outer > Math.abs(selected.z)) {
        const [x, y] = point(selected.x, selected.y);
        ctx.beginPath();
        ctx.arc(x, y, ro * scale, 0, 2 * Math.PI);
        if (ri > 0) ctx.arc(x, y, ri * scale, 0, 2 * Math.PI, true);
        ctx.fillStyle = "#73e4c00b";
        ctx.fill("evenodd");
        circle(selected.x, selected.y, ro, "#73e4c08c");
        if (ri > 0) circle(selected.x, selected.y, ri, "#73e4c04c");
      }
      const [x, y] = point(selected.x, selected.y),
        [sx, sy] = point(p.sun, 0);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(sx, sy);
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = "#73e4c077";
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const c of civs) {
      const [x, y] = point(c.x, c.y),
        crossing = c.arrivalStart <= time && c.arrivalEnd >= time && c.beamHits;
      ctx.fillStyle = c.detected
        ? "#73e4c0"
        : crossing
          ? "#efbd78"
          : colors[status(c, time)];
      ctx.globalAlpha = c.birth > time ? 0.4 : 1;
      ctx.beginPath();
      ctx.arc(x, y, c.detected ? 3.1 : 1.7, 0, 2 * Math.PI);
      ctx.fill();
      if (c.detected) {
        ctx.strokeStyle = "#73e4c044";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (selected) circle(selected.x, selected.y, 8 / scale, "#effff9");
    const [sx, sy] = point(p.sun, 0);
    ctx.shadowColor = "#73e4c0";
    ctx.shadowBlur = 16;
    circle(p.sun, 0, 4 / scale, "#9ff5d9", true);
    ctx.shadowBlur = 0;
    circle(p.sun, 0, 10 / scale, "#73e4c08c");
    ctx.fillStyle = "#bef8e6";
    ctx.font = "600 11px system-ui";
    ctx.fillText("SUN / EARTH", sx + 15, sy + 4);
    ctx.fillStyle = "#e3d4b3";
    circle(0, 0, 3 / scale, "#e3d4b3", true);
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#a4afbd";
    ctx.fillText("GALACTIC CENTER", cx - 47, cy - 14);
    ctx.fillStyle = "#647587";
    ctx.font = "10px monospace";
    [5, 10, 15]
      .filter((r) => r <= p.radius)
      .forEach((r) => ctx.fillText(`${r} kpc`, cx + 5, cy + r * scale - 5));
    ctx.restore();
  }, [
    size,
    zoom,
    pan,
    selected,
    time,
    range,
    waves,
    result,
    stars,
    scale,
    cx,
    cy,
    p,
    civs,
  ]);
  const locate = (clientX: number, clientY: number) => {
    const rect = canvas.current!.getBoundingClientRect(),
      x = clientX - rect.left,
      y = clientY - rect.top;
    let best: Civilization | null = null,
      d = 10;
    for (const c of civs) {
      const distance = Math.hypot(cx + c.x * scale - x, cy - c.y * scale - y);
      if (distance < d) {
        best = c;
        d = distance;
      }
    }
    return { best, x, y };
  };
  return (
    <div className="galaxy-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">GALACTIC FIELD</span>
          <h2 className="with-help">
            The Milky Way <span>Face-on projection</span>{" "}
            <GuideHelp topic="galaxy" />
          </h2>
        </div>
        <div className="map-toggles">
          <div className="with-help">
            <label>
              <input
                type="checkbox"
                checked={range}
                onChange={(e) => setRange(e.target.checked)}
              />{" "}
              Detection range
            </label>
            <GuideHelp topic="rangeOverlay" />
          </div>
          <div className="with-help">
            <label>
              <input
                type="checkbox"
                checked={waves}
                onChange={(e) => setWaves(e.target.checked)}
              />{" "}
              Wavefronts
            </label>
            <GuideHelp topic="wavefronts" />
          </div>
        </div>
      </div>
      <div className="galaxy-canvas" ref={box}>
        <canvas
          ref={canvas}
          role="img"
          aria-label="Interactive galactic map. Select a civilization on the map or use the source selector below."
          onWheel={(e) => {
            setZoom((z) =>
              Math.max(0.5, Math.min(8, z * Math.exp(-e.deltaY * 0.001))),
            );
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              px: pan.x,
              py: pan.y,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) {
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4)
                d.moved = true;
              if (d.moved)
                setPan({
                  x: d.px + e.clientX - d.x,
                  y: d.py + e.clientY - d.y,
                });
            } else {
              const hit = locate(e.clientX, e.clientY);
              setHover(hit.best ? { c: hit.best, x: hit.x, y: hit.y } : null);
            }
          }}
          onPointerUp={(e) => {
            if (!drag.current?.moved)
              onSelect(locate(e.clientX, e.clientY).best);
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onPointerLeave={() => setHover(null)}
        />
        <div className="map-caption">
          <span className="live-dot" /> {number(civs.length)} displayed sources
          <span>Illustrative spiral arms · physical source coordinates</span>
        </div>
        <div className="map-tools">
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(8, z * 1.3))}
          >
            <Plus size={17} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z / 1.3))}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="Reset map view"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <Maximize2 size={16} />
          </button>
          <button
            aria-label="Center on Earth"
            onClick={() => setPan({ x: -p.sun * scale, y: 0 })}
          >
            <Crosshair size={17} />
          </button>
        </div>
        <div className="map-scale">
          <span style={{ width: 5 * scale }} />
          {number(5 * scale > 150 ? 150 / scale : 5, 1)} kpc
        </div>
        {hover && (
          <div
            className="map-tooltip"
            style={{
              left: Math.min(hover.x + 12, size.w - 205),
              top: Math.max(12, Math.min(hover.y - 65, size.h - 80)),
            }}
          >
            <strong>MCST-{String(hover.c.id).padStart(4, "0")}</strong>
            <span>
              {number(hover.c.distance, 2)} kpc · {status(hover.c, time)}
            </span>
            <small>Click to inspect signal</small>
          </div>
        )}
      </div>
      <div className="map-legend">
        <GuideHelp topic="mapLegend" />
        <span>
          <i style={{ background: "#8e9fff" }} />
          Emitting
        </span>
        <span>
          <i style={{ background: "#78818f" }} />
          Extinct
        </span>
        <span>
          <i style={{ background: "#efbd78" }} />
          Signal at Earth / post-emission
        </span>
        <span>
          <i style={{ background: "#73e4c0" }} />
          Detected in window
        </span>
      </div>
      <div className="time-control">
        <div className="with-help">
          <label htmlFor="map-time">Map epoch</label>
          <GuideHelp topic="epoch" />
        </div>
        <input
          id="map-time"
          type="range"
          min={0}
          max={p.window}
          step={p.window / 100}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
        />
        <span>Now {time > 0 ? `+ ${number(time, 1)} yr` : ""}</span>
      </div>
      <div className="sample-note">
        {result.catalogPopulation > 1200
          ? `Map subsample: 1,200 of ≈${number(result.catalogPopulation)} sources. `
          : "One random population realization. "}
        Sources sampled over signal-relevant birth history; the map is separate
        from the probability estimate. Wavefronts are spherical envelopes
        intersecting z = 0; beam alignment is assessed separately.
      </div>
    </div>
  );
}
