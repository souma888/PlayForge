"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { districts, type DistrictId } from "./districts";
import type { SceneHandle } from "./world-scene";

const WorldScene = dynamic(() => import("./world-scene"), { ssr: false });

export function WorldExplorer() {
  const [selected, setSelected] = useState<DistrictId | null>(null);
  const [panel, setPanel] = useState<"worlds" | "workshop" | null>(null);
  const [saved, setSaved] = useState<DistrictId[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [storageReady, setStorageReady] = useState(false);
  const reduced = useReducedMotion();
  const scene = useRef<SceneHandle | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const district = districts.find((item) => item.id === selected);
  const modalOpen = Boolean(selected || panel);

  useEffect(() => {
    try {
      const data: unknown = JSON.parse(
        localStorage.getItem("playforge:worlds:v1") || "[]",
      );
      if (Array.isArray(data))
        setSaved(
          data.filter((id): id is DistrictId =>
            districts.some((item) => item.id === id),
          ),
        );
    } catch {
      /* Storage is optional. */
    }
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (storageReady)
      try {
        localStorage.setItem("playforge:worlds:v1", JSON.stringify(saved));
      } catch {
        /* Storage is optional. */
      }
  }, [saved, storageReady]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (modalOpen && !element.open) {
      lastFocus.current = document.activeElement as HTMLElement;
      element.showModal();
    } else if (!modalOpen && element.open) {
      element.close();
      lastFocus.current?.focus();
    }
  }, [modalOpen]);
  function choose(id: DistrictId) {
    setPanel(null);
    setSelected(id);
    scene.current?.focus(id);
  }
  function close() {
    setSelected(null);
    setPanel(null);
    scene.current?.focus(null);
  }
  function toggleSaved(id: DistrictId) {
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  return (
    <main className="explorer">
      <a className="skip-link" href="#districts">
        Skip to world selection
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Playforge home">
          PLAYFORGE<span aria-hidden="true">✳</span>
        </a>
        <nav aria-label="Main navigation">
          <button className={!panel ? "nav-active" : ""} onClick={close}>
            Discover
          </button>
          <button
            onClick={() => {
              setSelected(null);
              setPanel("worlds");
            }}
          >
            Your worlds
            {saved.length > 0 && <span className="count">{saved.length}</span>}
          </button>
          <button
            onClick={() => {
              setSelected(null);
              setPanel("workshop");
            }}
          >
            Workshop <span className="soon">SOON</span>
          </button>
        </nav>
        <span className="header-note">A NEW WORLD OF PLAY</span>
      </header>
      <section
        className="world-stage"
        aria-label="Interactive Playforge world map"
      >
        <div className="stage-grain" aria-hidden="true" />
        <div className={`scene-wrap ${ready ? "is-ready" : ""}`}>
          {!failed && (
            <WorldScene
              apiRef={scene}
              onSelect={choose}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
              paused={paused || Boolean(reduced)}
              quality={quality}
              reducedMotion={Boolean(reduced)}
            />
          )}
        </div>
        {!ready && !failed && (
          <div className="loading-scene" role="status">
            <span className="loading-orbit" />
            Assembling your next world
          </div>
        )}
        {failed && (
          <div className="scene-fallback">
            <span>✳</span>
            <p>The worlds are still within reach.</p>
            <p>
              3D is unavailable on this device. Explore every district below.
            </p>
          </div>
        )}
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.8 }}
        >
          <div className="overline">
            <span>✳</span> MANY WORLDS. ONE PLAYFORGE.
          </div>
          <h1>
            PICK YOUR
            <br />
            NEXT WORLD<span className="period">.</span>
          </h1>
          <p>
            Somewhere between one more lap
            <br />
            and a whole new adventure.
          </p>
          <button className="primary-button" onClick={() => choose("wilds")}>
            Explore the worlds <span aria-hidden="true">✳</span>
          </button>
          <span className="hero-footnote">
            NO DOWNLOADS. JUST POSSIBILITIES.
          </span>
        </motion.div>
        <div className="world-callouts" aria-label="Choose a district">
          {districts.map((item) => (
            <button
              key={item.id}
              className={`world-callout callout-${item.id}`}
              onClick={() => choose(item.id)}
            >
              <span className="callout-index">{item.tag}</span>
              <strong>{item.name}</strong>
              <span className="callout-line" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="stage-bottom">
          <div className="drag-hint">
            <span aria-hidden="true">⤧</span>
            <div>
              Drag to explore<small>SCROLL TO ZOOM · CLICK A WORLD</small>
            </div>
          </div>
          <div className="scene-toolbar" aria-label="World map controls">
            <button
              onClick={() => scene.current?.focus(null)}
              aria-label="Reset camera"
            >
              ↺
            </button>
            <button
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
              aria-label={paused ? "Resume animations" : "Pause animations"}
            >
              {paused ? "▷" : "Ⅱ"}
            </button>
            <button
              onClick={() => setQuality(quality === "high" ? "low" : "high")}
              aria-label={`Graphics quality ${quality}; click to change`}
            >
              {quality === "high" ? "HQ" : "LQ"}
            </button>
          </div>
        </div>
        <div className="vertical-caption" aria-hidden="true">
          BUILT FOR THE CURIOUS
        </div>
      </section>
      <section
        className="district-strip"
        id="districts"
        aria-label="Explore the districts"
      >
        <div className="strip-intro">
          <span className="overline">THE WORLD IS YOURS</span>
          <p>Where to first?</p>
        </div>
        {districts.map((item) => (
          <button
            className={`district-card district-${item.id}`}
            key={item.id}
            onClick={() => choose(item.id)}
          >
            <span className="district-emblem" aria-hidden="true">
              {item.symbol}
            </span>
            <span>
              <small>{item.genre}</small>
              <strong>{item.name}</strong>
            </span>
            <span className="card-plus" aria-hidden="true">
              +
            </span>
          </button>
        ))}
      </section>
      <footer className="site-footer">
        <span>MADE FOR PLAY. BUILT FOR POSSIBILITY.</span>
        <span>
          Worlds in the making <b>✳</b> Playforge — early exploration
        </span>
      </footer>
      <dialog
        ref={dialog}
        className="world-dialog"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby="dialog-title"
      >
        {modalOpen && (
          <motion.div
            key={selected || panel}
            className="dialog-content"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="dialog-close"
              onClick={close}
              aria-label="Close panel"
              autoFocus
            >
              ×
            </button>
            {district ? (
              <>
                <span className="overline">{district.tag}</span>
                <div
                  className={`dialog-art art-${district.id}`}
                  aria-hidden="true"
                >
                  <span>{district.symbol}</span>
                  <i />
                  <i />
                  <i />
                </div>
                <span className="dialog-genre">{district.genre}</span>
                <h2 id="dialog-title">{district.name}</h2>
                <p className="dialog-description">{district.description}</p>
                <div className="experience-list">
                  {district.titles.map((title) => (
                    <span key={title}>{title}</span>
                  ))}
                </div>
                <button
                  className="primary-button"
                  onClick={() => toggleSaved(district.id)}
                >
                  {saved.includes(district.id)
                    ? "Saved to your worlds ✓"
                    : "Save this world +"}
                </button>
                <p className="honest-note">
                  A glimpse of what’s coming. Games in this district are in
                  development. Saved worlds stay in this browser.
                </p>
              </>
            ) : panel === "worlds" ? (
              <>
                <span className="overline">YOUR CORNER OF PLAYFORGE</span>
                <h2 id="dialog-title">Your worlds.</h2>
                <p className="dialog-description">
                  Keep the places you want to come back to.
                </p>
                {saved.length ? (
                  saved.map((id) => {
                    const item = districts.find((entry) => entry.id === id)!;
                    return (
                      <div className="saved-row" key={id}>
                        <button onClick={() => choose(id)}>
                          <span>{item.symbol}</span>
                          {item.name}
                        </button>
                        <button
                          onClick={() => toggleSaved(id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-worlds">
                    <span>✳</span>
                    <h3>A world of possibilities.</h3>
                    <p>
                      Explore a district and save it here. Your next adventure
                      deserves a place.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => choose("wilds")}
                    >
                      Discover The Wilds
                    </button>
                  </div>
                )}
                <p className="honest-note">
                  Saved locally on this device. No account required.
                </p>
              </>
            ) : (
              <>
                <span className="overline">FOR THE WORLD BUILDERS</span>
                <h2 id="dialog-title">
                  Make room
                  <br />
                  for imagination.
                </h2>
                <p className="dialog-description">
                  The Playforge Workshop will be a home for custom levels, bold
                  experiments and community-made adventures.
                </p>
                <div className="workshop-sculpture" aria-hidden="true">
                  ✳
                </div>
                <div className="workshop-status">WORKSHOP IN DEVELOPMENT</div>
                <p className="honest-note">
                  Creation tools and community publishing are not available yet.
                  For now, explore the worlds that started it all.
                </p>
                <button
                  className="primary-button"
                  onClick={() => choose("command")}
                >
                  Explore Command Sector
                </button>
              </>
            )}
          </motion.div>
        )}
      </dialog>
    </main>
  );
}
