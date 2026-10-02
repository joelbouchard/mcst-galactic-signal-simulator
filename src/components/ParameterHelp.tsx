import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X } from "lucide-react";
import type { HelpContent } from "../science/parameterHelp";

interface ActiveHelp {
  id: string;
  anchor: HTMLButtonElement;
  content: HelpContent;
  defaultValue?: string;
  pinned: boolean;
  keyboard: boolean;
}
interface HelpContextValue {
  activeId?: string;
  pinned: boolean;
  acceptFocus: (id: string) => boolean;
  show: (help: ActiveHelp) => void;
  close: () => void;
  scheduleClose: () => void;
  cancelClose: () => void;
}
const HelpContext = createContext<HelpContextValue | null>(null);

/** One shared, viewport-positioned card avoids clipping inside the scrolling settings panel. */
export function ParameterHelpProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveHelp | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const activeRef = useRef(active);
  const suppressedFocus = useRef<string | null>(null);
  activeRef.current = active;
  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = () => {
    cancelClose();
    setActive(null);
    setPosition(null);
  };
  const show = (help: ActiveHelp) => {
    cancelClose();
    // A pinned card is replaced only by an intentional click on another help button.
    if (activeRef.current?.pinned && !help.pinned) return;
    if (activeRef.current?.id !== help.id) setPosition(null);
    setActive(help);
  };
  const scheduleClose = () => {
    cancelClose();
    if (!activeRef.current?.pinned) closeTimer.current = setTimeout(close, 240);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useLayoutEffect(() => {
    if (!active || !panel.current) return;
    const place = () => {
      const anchor = active.anchor.getBoundingClientRect();
      const scrollArea = active.anchor
        .closest(".controls-body")
        ?.getBoundingClientRect();
      const margin = 12,
        gap = 10;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      if (
        !anchor.width ||
        anchor.bottom < margin ||
        anchor.top > height - margin ||
        (scrollArea &&
          (anchor.bottom < scrollArea.top || anchor.top > scrollArea.bottom))
      ) {
        setActive(null);
        setPosition(null);
        return;
      }
      const card = panel.current!.getBoundingClientRect();
      let left = anchor.right + gap;
      if (left + card.width > width - margin) {
        left = anchor.left - gap - card.width;
        if (left < margin)
          left = Math.max(
            margin,
            Math.min(anchor.left, width - card.width - margin),
          );
      }
      const beside = left >= anchor.right || left + card.width <= anchor.left;
      let top = beside ? anchor.top - 10 : anchor.bottom + gap;
      if (!beside && top + card.height > height - margin)
        top = anchor.top - card.height - gap;
      setPosition({
        left,
        top: Math.max(margin, Math.min(top, height - card.height - margin)),
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !active.anchor.contains(event.target)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const focusInside = panel.current?.contains(document.activeElement);
      close();
      if (focusInside) {
        suppressedFocus.current = active.id;
        active.anchor.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
    };
  }, [active]);

  useEffect(() => {
    if (active?.pinned && active.keyboard)
      closeButton.current?.focus({ preventScroll: true });
  }, [active]);

  const dismissFromPanel = () => {
    const anchor = active?.anchor;
    suppressedFocus.current = active?.id ?? null;
    close();
    anchor?.focus({ preventScroll: true });
  };
  const acceptFocus = (id: string) => {
    if (suppressedFocus.current === id) {
      suppressedFocus.current = null;
      return false;
    }
    return true;
  };
  return (
    <HelpContext.Provider
      value={{
        activeId: active?.id,
        pinned: active?.pinned ?? false,
        acceptFocus,
        show,
        close,
        scheduleClose,
        cancelClose,
      }}
    >
      {children}
      {active &&
        createPortal(
          <div
            ref={panel}
            id={active.id}
            className="parameter-help-card"
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${active.id}-title`}
            aria-describedby={`${active.id}-meaning`}
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
            onFocus={cancelClose}
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(e.relatedTarget) &&
                e.relatedTarget !== active.anchor
              )
                close();
            }}
          >
            <div className="help-card-heading">
              <div>
                <span className="help-eyebrow">
                  {active.content.kind === "result"
                    ? "RESULT GUIDE"
                    : active.content.kind === "section"
                      ? "SECTION GUIDE"
                      : "PARAMETER GUIDE"}
                </span>
                <h3 id={`${active.id}-title`}>{active.content.title}</h3>
              </div>
              <button
                type="button"
                ref={closeButton}
                className="help-close"
                aria-label="Close contextual help"
                onClick={dismissFromPanel}
              >
                <X size={17} />
              </button>
            </div>
            <div className="help-meta">
              <span>{active.content.unit}</span>
              {active.defaultValue && (
                <span>Default: {active.defaultValue}</span>
              )}
            </div>
            <p id={`${active.id}-meaning`}>{active.content.meaning}</p>
            <div className="help-effect">
              <h4>
                {active.content.kind ? "How to read it" : "What changes?"}
              </h4>
              <p>{active.content.effect}</p>
            </div>
            <div className="help-example">
              <h4>Example</h4>
              <p>{active.content.example}</p>
            </div>
            {active.content.note && (
              <p className="help-note">{active.content.note}</p>
            )}
            <div className="help-card-footer">
              {active.pinned
                ? "Click outside or press Esc to close"
                : "Click the ? button to keep this open"}
            </div>
          </div>,
          document.body,
        )}
    </HelpContext.Provider>
  );
}

export function ParameterHelp({
  content,
  defaultValue,
  descriptionId,
}: {
  content: HelpContent;
  defaultValue?: string;
  descriptionId?: string;
}) {
  const context = useContext(HelpContext);
  const id = useId();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  if (!context)
    throw new Error("ParameterHelp requires ParameterHelpProvider.");
  const opened = context.activeId === id;
  return (
    <>
      {descriptionId && (
        <span id={descriptionId} className="sr-only">
          {content.meaning} {content.unit}. {content.effect}
        </span>
      )}
      <button
        type="button"
        className={`parameter-help-button ${opened ? "is-open" : ""}`}
        aria-label={`Help: ${content.title}`}
        aria-haspopup="dialog"
        aria-expanded={opened}
        aria-controls={opened ? id : undefined}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          context.cancelClose();
          const anchor = e.currentTarget;
          hoverTimer.current = setTimeout(
            () =>
              context.show({
                id,
                anchor,
                content,
                defaultValue,
                pinned: false,
                keyboard: false,
              }),
            250,
          );
        }}
        onPointerLeave={() => {
          clearTimeout(hoverTimer.current);
          context.scheduleClose();
        }}
        onFocus={(e) => {
          if (
            context.acceptFocus(id) &&
            e.currentTarget.matches(":focus-visible")
          )
            context.show({
              id,
              anchor: e.currentTarget,
              content,
              defaultValue,
              pinned: false,
              keyboard: true,
            });
        }}
        onBlur={(e) => {
          if (
            !(
              e.relatedTarget instanceof Element &&
              e.relatedTarget.closest(".parameter-help-card")
            )
          )
            context.scheduleClose();
        }}
        onClick={(e) => {
          clearTimeout(hoverTimer.current);
          if (opened && context.pinned) {
            context.close();
            return;
          }
          context.show({
            id,
            anchor: e.currentTarget,
            content,
            defaultValue,
            pinned: true,
            keyboard: e.detail === 0,
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") context.close();
        }}
      >
        <CircleHelp size={15} aria-hidden="true" />
      </button>
    </>
  );
}
