import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Search, X, Circle } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { useGameStore } from "./store/gameStore";
import { useThemeStore } from "./store/themeStore";
import type { PublicMatchState } from "./lib/sharedTypes";

type AppView = "home" | "leaderboard" | "create-room" | "join-room";

const NAV_ZOOM_MS = 1260;

const CENTER_ANGLE = -90;
const RIGHT_HIDDEN_ANGLE = 0;
const LEFT_HIDDEN_ANGLE = -180;

const ORBIT_STARS = Array.from({ length: 12 }).map((_, index) => ({
  radius: 130 + (index % 4) * 34 + Math.floor(index / 4) * 10,
  duration: 8 + index * 1.25,
  opacity: 0.42 + (index % 5) * 0.08,
  size: 2 + (index % 3),
  delay: index * 0.21,
}));

const BACKGROUND_STARS = Array.from({ length: 42 }).map((_, index) => ({
  top: (index * 37) % 100,
  left: (index * 53) % 100,
  size: 1.5 + (index % 4),
  opacity: 0.2 + (index % 7) * 0.08,
  duration: 20 + (index % 6) * 5,
  delay: index * 0.3,
}));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const toRadians = (angle: number) => (angle * Math.PI) / 180;
const ORBIT_DEBUG = false;

function PlanetBody({ kind, starKeyPrefix }: { kind: "sun" | "planet"; starKeyPrefix: string }) {
  return (
    <div className={["planet-body", kind === "sun" ? "planet-body-sun" : "planet-body-planet"].join(" ")}>
      <div className="planet-core" />
      <div className="planet-ring">
        {Array.from({ length: 16 }).map((_, index) => (
          <span key={`${starKeyPrefix}-particle-${index}`} className="planet-particle" style={{ ["--i" as string]: index } as CSSProperties} />
        ))}
      </div>
      <div className="planet-orbits">
        {ORBIT_STARS.map((star, index) => (
          <span
            key={`${starKeyPrefix}-orbit-${index}`}
            className="orbit-star"
            style={
              {
                ["--orbit-radius" as string]: `${star.radius}px`,
                ["--orbit-duration" as string]: `${star.duration}s`,
                ["--orbit-opacity" as string]: star.opacity,
                ["--orbit-size" as string]: `${star.size}px`,
                ["--orbit-delay" as string]: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function OrbitalBackground({ mode, spaceTransitioning, idPrefix }: { mode: "light" | "dark"; spaceTransitioning: boolean; idPrefix: string }) {
  const [radius, setRadius] = useState(() => clamp(Math.max(window.innerWidth, window.innerHeight) * 0.58, 420, 920));
  const sunAngle = useMotionValue(mode === "light" ? CENTER_ANGLE : RIGHT_HIDDEN_ANGLE);
  const planetAngle = useMotionValue(mode === "light" ? LEFT_HIDDEN_ANGLE : CENTER_ANGLE);

  useEffect(() => {
    const updateRadius = () => {
      setRadius(clamp(Math.max(window.innerWidth, window.innerHeight) * 0.58, 420, 920));
    };

    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const sunX = useTransform(sunAngle, (angle) => radius * Math.cos(toRadians(angle)));
  const sunY = useTransform(sunAngle, (angle) => radius + radius * Math.sin(toRadians(angle)));
  const planetX = useTransform(planetAngle, (angle) => radius * Math.cos(toRadians(angle)));
  const planetY = useTransform(planetAngle, (angle) => radius + radius * Math.sin(toRadians(angle)));

  useEffect(() => {
    const transition = {
      duration: 2.2,
      ease: [0.42, 0, 0.2, 1] as const,
    };

    const controls =
      mode === "dark"
        ? [
            animate(sunAngle, [CENTER_ANGLE, RIGHT_HIDDEN_ANGLE], transition),
            animate(planetAngle, [LEFT_HIDDEN_ANGLE, CENTER_ANGLE], transition),
          ]
        : [
            animate(sunAngle, [RIGHT_HIDDEN_ANGLE, CENTER_ANGLE], transition),
            animate(planetAngle, [CENTER_ANGLE, LEFT_HIDDEN_ANGLE], transition),
          ];

    return () => {
      controls.forEach((control) => control.stop());
    };
  }, [mode, planetAngle, sunAngle]);

  return (
    <div className={["planet-system", spaceTransitioning ? "planet-system-zoom" : ""].join(" ")} aria-hidden="true">
      <div className={["planet-orbit-stage", ORBIT_DEBUG ? "orbit-debug" : ""].join(" ")}>
        <motion.div className="orbit-item sun-wrapper" style={{ x: sunX, y: sunY }}>
          <PlanetBody kind="sun" starKeyPrefix={`${idPrefix}-sun`} />
        </motion.div>
        <motion.div className="orbit-item planet-wrapper" style={{ x: planetX, y: planetY }}>
          <PlanetBody kind="planet" starKeyPrefix={`${idPrefix}-planet`} />
        </motion.div>
      </div>
    </div>
  );
}

function getWinLineStyle(line: number[]) {
  const key = line.join("-");
  if (key === "0-1-2") {
    return { left: "9%", top: "17%", width: "82%", height: "4px", rotate: "0deg" };
  }
  if (key === "3-4-5") {
    return { left: "9%", top: "50%", width: "82%", height: "4px", rotate: "0deg" };
  }
  if (key === "6-7-8") {
    return { left: "9%", top: "83%", width: "82%", height: "4px", rotate: "0deg" };
  }
  if (key === "0-3-6") {
    return { left: "17%", top: "9%", width: "4px", height: "82%", rotate: "0deg" };
  }
  if (key === "1-4-7") {
    return { left: "50%", top: "9%", width: "4px", height: "82%", rotate: "0deg" };
  }
  if (key === "2-5-8") {
    return { left: "83%", top: "9%", width: "4px", height: "82%", rotate: "0deg" };
  }
  if (key === "0-4-8") {
    return { left: "11%", top: "11%", width: "110%", height: "4px", rotate: "45deg" };
  }
  if (key === "2-4-6") {
    return { left: "11%", top: "89%", width: "110%", height: "4px", rotate: "-45deg" };
  }
  return null;
}

function GameBoard({
  state,
  userId,
  onMove,
}: {
  state: PublicMatchState;
  userId: string | null;
  onMove: (index: number) => void;
}) {
  const me = state.players.find((p) => p.userId === userId);
  const canPlay = state.phase === "playing" && me?.mark === state.turn;
  const winLineStyle = state.phase === "finished" ? getWinLineStyle(state.winLine) : null;

  const handleCellActivate = (index: number, disabled: boolean) => {
    if (disabled) {
      return;
    }
    onMove(index);
  };

  return (
    <div id="3dcss" className="mx-auto w-full max-w-[450px]">
      <div className="board-tilt relative mx-auto grid w-full grid-cols-3 gap-3 rounded-[28px] p-4 sm:gap-4 sm:p-5">
        <div className="board-light-sweep" />
        {Array.from({ length: 3 }).map((_, row) =>
          Array.from({ length: 3 }).map((__, col) => {
            const index = row * 3 + col;
            const cell = state.board[index];
            const isWinCell = state.winLine.includes(index);
            const disabled = !canPlay || !!cell || state.phase !== "playing";

            return (
              <motion.button
                key={index}
                type="button"
                data-cell-index={index}
                whileHover={!disabled ? { scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                onClick={() => handleCellActivate(index, disabled)}
                onTouchEnd={() => handleCellActivate(index, disabled)}
                className={[
                  "cell-clay relative z-10 w-full aspect-square rounded-2xl flex items-center justify-center transition-colors duration-300",
                  "bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 shadow-inner overflow-hidden pointer-events-auto",
                  isWinCell ? "tile-win" : "",
                  disabled ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
              >
                {cell ? (
                  <motion.span
                    initial={cell === "X" ? { scale: 0, rotate: -45, opacity: 0 } : { scale: 0, opacity: 0 }}
                    animate={cell === "X" ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                    className={cell === "X" ? "glyph-x" : "glyph-o"}
                  >
                    {cell === "X" ? <X className="h-16 w-16 sm:h-24 sm:w-24" strokeWidth={2.5} /> : <Circle className="h-14 w-14 sm:h-20 sm:w-20" strokeWidth={3} />}
                  </motion.span>
                ) : null}
              </motion.button>
            );
          }),
        )}

        {winLineStyle ? (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.35 }}
            className="win-line"
            style={{
              left: winLineStyle.left,
              top: winLineStyle.top,
              width: winLineStyle.width,
              height: winLineStyle.height,
              transform: `translate(-50%, -50%) rotate(${winLineStyle.rotate})`,
              transformOrigin: "left center",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function PlayerCard({
  title,
  mark,
  active,
  connected,
}: {
  title: string;
  mark: "X" | "O";
  active: boolean;
  connected: boolean;
}) {
  return (
    <div
      className={[
        "player-card",
        active ? "player-card-active" : "",
        connected ? "player-card-connected" : "",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-white/80">{title}</p>
      <p className="text-xl font-black tracking-wider text-white">{mark}</p>
      <p className="text-xs text-white/60">{connected ? "Connected" : "Disconnected"}</p>
    </div>
  );
}

function BrandLogo({ mode }: { mode: "light" | "dark" }) {
  const stroke = mode === "light" ? "#acd0fc" : "#7448fe";

  return (
    <div className="brand-logo flex items-center gap-3">
      <svg aria-hidden="true" viewBox="0 0 56 56" className="h-9 w-9" fill="none">
        <circle cx="28" cy="28" r="22" stroke={stroke} strokeWidth="2.6" opacity="0.25" />
        <path d="M28 10v36M10 28h36" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M16 16l24 24M40 16L16 40" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span className="text-2xl font-black tracking-[0.08em] text-white">TIC-TAC-TOE</span>
    </div>
  );
}

export default function App() {
  const {
    init,
    setUsername,
    connectionState,
    queueState,
    matchState,
    userId,
    username,
    errorMessage,
    clearError,
    createRoom,
    findMatch,
    joinRoomById,
    placeMove,
    rematch,
    leaveMatch,
    fetchLeaderboard,
    fetchMatchHistory,
  } = useGameStore();

  const mode = useThemeStore((state) => state.mode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [usernameInput, setUsernameInput] = useState<string>(username ?? "");
  const [joinCode, setJoinCode] = useState("");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("home");
  const [homeTransitioning, setHomeTransitioning] = useState(false);
  const [spaceTransitioning, setSpaceTransitioning] = useState(false);
  const previousScreenKeyRef = useRef<string | null>(null);

  const submitUsername = async () => {
    const next = usernameInput.trim();
    if (!next || spaceTransitioning) {
      return;
    }

    setSpaceTransitioning(true);
    window.setTimeout(() => {
      void setUsername(next).finally(() => {
        window.setTimeout(() => setSpaceTransitioning(false), 420);
      });
    }, 920);
  };

  const handleUsernameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitUsername();
  };

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    setUsernameInput(username ?? "");
  }, [username]);

  useEffect(() => {
    if (!matchState?.moveRemainingMs) {
      setRemainingMs(0);
      return;
    }
    setRemainingMs(matchState.moveRemainingMs);
  }, [matchState?.moveRemainingMs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs((prev) => (prev > 250 ? prev - 250 : 0));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (matchState?.phase === "waiting") {
      setCreatedRoomId(matchState.matchId);
    }
  }, [matchState?.matchId, matchState?.phase]);

  useEffect(() => {
    if (!copyToast) {
      return;
    }

    const t = window.setTimeout(() => setCopyToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  useEffect(() => {
    const root = document.documentElement;

    const onMouseMove = (event: MouseEvent) => {
      const rotateX = Math.max(-7, Math.min(7, (window.innerHeight / 2 - event.clientY) / 34));
      const rotateY = Math.max(-7, Math.min(7, (event.clientX - window.innerWidth / 2) / 34));

      root.style.setProperty("--ui-tilt-x", `${rotateX}deg`);
      root.style.setProperty("--ui-tilt-y", `${rotateY}deg`);
      root.style.setProperty("--ui-tilt-scale", "1.03");
    };

    const resetTilt = () => {
      root.style.setProperty("--ui-tilt-x", "0deg");
      root.style.setProperty("--ui-tilt-y", "0deg");
      root.style.setProperty("--ui-tilt-scale", "1");
    };

    resetTilt();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", resetTilt);
    window.addEventListener("blur", resetTilt);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", resetTilt);
      window.removeEventListener("blur", resetTilt);
      resetTilt();
    };
  }, []);

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", connectionState],
    queryFn: fetchLeaderboard,
    refetchInterval: 7000,
    enabled: connectionState === "connected",
  });

  const historyQuery = useQuery({
    queryKey: ["history", connectionState],
    queryFn: fetchMatchHistory,
    refetchInterval: 7000,
    enabled: connectionState === "connected",
  });

  const me = useMemo(() => {
    if (!matchState || !userId) {
      return null;
    }
    return matchState.players.find((player) => player.userId === userId) ?? null;
  }, [matchState, userId]);

  const turnLabel = matchState
    ? matchState.phase === "waiting"
      ? "Waiting for second player"
      : matchState.phase === "finished"
        ? matchState.winner === "draw"
          ? "Draw"
          : `${matchState.winner} wins`
        : me?.mark === matchState.turn
          ? "Your turn"
          : "Opponent turn"
    : "No active match";

  const myPlayer = useMemo(() => {
    if (!matchState || !userId) {
      return null;
    }
    return matchState.players.find((p) => p.userId === userId) ?? null;
  }, [matchState, userId]);

  const oppPlayer = useMemo(() => {
    if (!matchState || !myPlayer) {
      return null;
    }
    return matchState.players.find((p) => p.userId !== myPlayer.userId) ?? null;
  }, [matchState, myPlayer]);

  const isSearching = queueState === "searching" && !matchState;
  const isWaiting = !!matchState && matchState.phase === "waiting";
  const isGame = !!matchState && (matchState.phase === "playing" || matchState.phase === "finished");
  const screenKey = useMemo(() => {
    if (!username) {
      return "username";
    }
    if (isSearching) {
      return "matchmaking";
    }
    if (isWaiting) {
      return "waiting";
    }
    if (isGame && matchState?.phase === "finished") {
      return "result";
    }
    if (isGame) {
      return "game";
    }
    return view;
  }, [isGame, isSearching, isWaiting, matchState?.phase, username, view]);

  useEffect(() => {
    const previous = previousScreenKeyRef.current;
    previousScreenKeyRef.current = screenKey;

    if (!previous || previous === screenKey) {
      return;
    }

    setSpaceTransitioning(true);
    const timer = window.setTimeout(() => setSpaceTransitioning(false), NAV_ZOOM_MS);
    return () => window.clearTimeout(timer);
  }, [screenKey]);

  const handleThemeToggle = () => {
    toggleTheme();
  };
  const winnerName =
    matchState?.winner === "draw"
      ? "Draw"
      : matchState?.winner === myPlayer?.mark
        ? myPlayer?.username || "You"
        : oppPlayer?.username || "Opponent";
  const myResult =
    matchState?.phase === "finished"
      ? matchState.winner === "draw"
        ? "draw"
        : matchState.winner === myPlayer?.mark
          ? "win"
          : "loss"
      : null;

  const runHomeTransition = (action: () => void) => {
    if (homeTransitioning) {
      return;
    }
    setHomeTransitioning(true);
    window.setTimeout(() => {
      action();
      setHomeTransitioning(false);
    }, 520);
  };

  if (!username) {
    return (
      <main
        className={[
          "neon-bg min-h-screen px-4 py-8 sm:px-8",
        ].join(" ")}
      >
        <div className="space-particles" aria-hidden="true" />
        <OrbitalBackground mode={mode} spaceTransitioning={spaceTransitioning} idPrefix="user" />
        <div className="deep-starfield" aria-hidden="true">
          {BACKGROUND_STARS.map((star, index) => (
            <span
              key={`bg-user-${index}`}
              className="deep-star"
              style={
                {
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  ["--star-duration" as string]: `${star.duration}s`,
                  ["--star-delay" as string]: `${star.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto flex min-h-[90vh] w-full max-w-2xl items-center justify-center">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <BrandLogo mode={mode} />
              <ThemeToggle theme={mode} onToggle={handleThemeToggle} />
            </div>
            <div
              id="glasscss"
              className="interactive-tilt clay-modal w-full space-y-6 p-8 sm:p-10"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Username Screen</p>
              <h1 id="glowcss" className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Enter Arena Identity
              </h1>
              <p className="text-sm text-white/70">
                Your name is persisted to server profile and rendered in match, waiting room, result modal, and leaderboard.
              </p>

              <form
                className="space-y-4"
                onSubmit={handleUsernameSubmit}
              >
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === "Go" || event.key === "Done") && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void submitUsername();
                    }
                  }}
                  autoComplete="nickname"
                  enterKeyHint="done"
                  placeholder="Enter username"
                  maxLength={24}
                  className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/70"
                />
                {errorMessage ? <p className="text-xs text-pink-200">{errorMessage}</p> : null}
                <button
                  type="submit"
                  disabled={!usernameInput.trim() || spaceTransitioning}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-sm font-black text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
                >
                  Continue To Home
                </button>
              </form>
            </div>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main
      className={[
        "neon-bg min-h-screen px-4 py-5 sm:px-8",
      ].join(" ")}
    >
      <div className="space-particles" aria-hidden="true" />
      <OrbitalBackground mode={mode} spaceTransitioning={spaceTransitioning} idPrefix="home" />
      <div className="deep-starfield" aria-hidden="true">
        {BACKGROUND_STARS.map((star, index) => (
          <span
            key={`bg-home-${index}`}
            className="deep-star"
            style={
              {
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                ["--star-duration" as string]: `${star.duration}s`,
                ["--star-delay" as string]: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-4">
        <header className="relative z-30 flex items-center justify-between px-1">
          <BrandLogo mode={mode} />
          <ThemeToggle theme={mode} onToggle={handleThemeToggle} />
        </header>

        {copyToast ? <p className="text-right text-xs font-semibold text-cyan-200">{copyToast}</p> : null}

        {errorMessage ? (
          <div id="glasscss" className="flex items-center justify-between gap-4 p-3 text-sm text-pink-200">
            <p>{errorMessage}</p>
            <button className="rounded-xl border border-white/15 px-3 py-1 text-xs text-white/80" onClick={clearError}>
              Dismiss
            </button>
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, y: 14, scale: 0.99, filter: "blur(7px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, scale: 1.01, filter: "blur(8px)" }}
            transition={{ duration: 1.02, ease: [0.25, 0.1, 0.25, 1] }}
            className="screen-transition-layer relative z-10"
          >
        {view === "leaderboard" && !isSearching && !isWaiting && !isGame ? (
          <section id="glasscss" className="flow-enter space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 id="glowcss" className="text-2xl font-black text-white">
                Leaderboard
              </h2>
              <button
                onClick={() => setView("home")}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80"
              >
                Back Home
              </button>
            </div>
            <div className="space-y-2">
              {(leaderboardQuery.data ?? []).map((row) => (
                <motion.div
                  key={`${row.username}-${row.rank}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={[
                    "flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.08]",
                    row.rank === 1 ? "border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-transparent" : "",
                    row.rank === 2 ? "border-slate-300/40 bg-gradient-to-r from-slate-300/10 to-transparent" : "",
                    row.rank === 3 ? "border-amber-600/40 bg-gradient-to-r from-amber-600/10 to-transparent" : "",
                  ].join(" ")}
                >
                  <p className="w-12 text-xs font-black text-cyan-200">{row.rank <= 3 ? ["1ST", "2ND", "3RD"][row.rank - 1] : `#${row.rank}`}</p>
                  <p className="flex-1 truncate text-sm font-bold text-white">{row.username}</p>
                  <p className="text-xs text-white/70">W {row.wins}</p>
                  <p className="text-xs text-white/70">L {row.losses}</p>
                  <p className="text-xs text-white/70">D {row.draws}</p>
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}

        {view === "home" && !isSearching && !isWaiting && !isGame ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={
              homeTransitioning
                ? { opacity: 0, scale: 1.032, filter: "blur(3px)", y: -10 }
                : { opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }
            }
              transition={{ duration: homeTransitioning ? 0.84 : 0.96, ease: [0.25, 0.1, 0.25, 1] }}
            className={[
              "home-focus-stage relative mx-auto flex min-h-[78vh] w-full max-w-[560px] flex-col items-center justify-center overflow-hidden rounded-[2rem] p-4 sm:p-6",
              homeTransitioning ? "home-focus-stage-transition" : "",
            ].join(" ")}
          >
            <motion.div
              className="absolute bottom-20 left-20 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-20 top-40 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <motion.div
              id="glasscss"
              className="interactive-tilt home-hub-card home-card-3d relative z-10 w-full max-w-[410px] p-6 text-center sm:p-8"
            >
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
                <div className="flex flex-col items-center">
                  <h2 className="mb-0 text-[3.5rem] font-black tracking-tighter text-white sm:text-[4.6rem]" style={{ letterSpacing: "-0.03em", lineHeight: "0.94" }}>
                    TIC-TAC-TOE
                  </h2>
                </div>

                <div className="mt-8 flex flex-col gap-3.5">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.985, y: 0, scaleY: 0.92 }}
                    onClick={() => runHomeTransition(() => void findMatch())}
                    className="home-action-btn home-action-primary"
                  >
                    Play Online
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.985, y: 0, scaleY: 0.92 }}
                    onClick={() => runHomeTransition(() => setView("create-room"))}
                    className="home-action-btn home-action-secondary"
                  >
                    Create Room
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.985, y: 0, scaleY: 0.92 }}
                    onClick={() => runHomeTransition(() => setView("join-room"))}
                    className="home-action-btn home-action-tertiary"
                  >
                    Join Room
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.985, y: 0, scaleY: 0.92 }}
                    onClick={() => runHomeTransition(() => setView("leaderboard"))}
                    className="home-action-btn home-action-outline"
                  >
                    Leaderboard
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {homeTransitioning ? <div className="home-transition-flash" /> : null}
          </motion.section>
        ) : null}

        {view === "create-room" && !isSearching && !isWaiting && !isGame ? (
          <section id="glasscss" className="flow-enter mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 id="glowcss" className="text-3xl font-black text-white">
                Create Room
              </h2>
              <button className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => setView("home")}>
                Back
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Room Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-lg font-black tracking-[0.24em] text-cyan-200">
                  {(createdRoomId ?? "------").slice(0, 6).toUpperCase()}
                </div>
                <button
                  className="action-btn neon-neutral h-auto px-4"
                  onClick={async () => {
                    if (!createdRoomId) {
                      return;
                    }
                    await navigator.clipboard.writeText(createdRoomId);
                    setCopyToast("Room ID copied");
                  }}
                  disabled={!createdRoomId}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-white/60">Short code is visual. Full room id is copied for exact join.</p>
            </div>

            <button
              className="action-btn neon-purple w-full"
              onClick={async () => {
                await createRoom();
              }}
            >
              Create Private Room
            </button>
          </section>
        ) : null}

        {view === "join-room" && !isSearching && !isWaiting && !isGame ? (
          <section id="glasscss" className="flow-enter mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 id="glowcss" className="text-3xl font-black text-white">
                Join Room
              </h2>
              <button className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80" onClick={() => setView("home")}>
                Back
              </button>
            </div>

            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Paste full room id"
              className="h-14 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              className="action-btn neon-pink w-full"
              onClick={() => {
                const code = joinCode.trim();
                if (!code) {
                  return;
                }
                void joinRoomById(code);
                setJoinCode("");
              }}
            >
              Join Private Room
            </button>
          </section>
        ) : null}

        {isSearching ? (
          <motion.section
            key="matchmaking"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            className="z-10 mx-auto w-full max-w-md text-center"
          >
            <div id="glasscss" className="flex flex-col items-center gap-8 p-10">
              <div className="relative">
                <Search className="h-12 w-12 text-primary animate-pulse" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              </div>

              <div>
                <h2 className="mb-2 text-2xl font-bold">Finding Opponent</h2>
                <p className="text-muted-foreground">Searching global matchmaking pool...</p>
              </div>

              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98, y: 0 }} className="action-btn neon-neutral w-full">
                Cancel
              </motion.button>
            </div>
          </motion.section>
        ) : null}

        {isWaiting && matchState ? (
          <section id="glasscss" className="flow-enter mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Waiting Room</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="glowcss" className="text-3xl font-black text-white">
                Waiting For Player
              </h2>
              <p className="rounded-xl border border-white/15 px-3 py-2 text-xs text-cyan-200">
                Room {matchState.matchId.split(".")[0]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-base font-black tracking-[0.2em] text-cyan-200">
                {matchState.matchId.slice(0, 6).toUpperCase()}
              </div>
              <button
                className="action-btn neon-neutral h-auto px-4"
                onClick={async () => {
                  await navigator.clipboard.writeText(matchState.matchId);
                  setCopyToast("Room ID copied");
                }}
              >
                Copy Room ID
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlayerCard
                title={myPlayer?.username ?? "You"}
                mark={myPlayer?.mark ?? "X"}
                active
                connected={!!myPlayer?.connected}
              />
              <PlayerCard
                title={oppPlayer?.username ?? "Waiting..."}
                mark={oppPlayer?.mark ?? (myPlayer?.mark === "X" ? "O" : "X")}
                active={!!oppPlayer}
                connected={!!oppPlayer?.connected}
              />
            </div>
            <motion.p
              animate={{ opacity: [0.45, 1, 0.45], x: [0, 3, 0] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              className="flex items-center gap-2 text-sm text-white/70"
            >
              <span className="status-dot" />
              Waiting for second player to connect...
            </motion.p>
          </section>
        ) : null}

        {isGame && matchState ? (
          <section className="flow-enter mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_330px]">
            <div id="glasscss" className="space-y-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white/85">{turnLabel}</p>
                <p className="text-sm text-cyan-200">{Math.ceil(remainingMs / 1000)}s</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  animate={{ width: `${Math.max(0, Math.min(100, (remainingMs / 30000) * 100))}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              <GameBoard state={matchState} userId={userId} onMove={(index) => void placeMove(index)} />
            </div>

            <div id="glasscss" className="space-y-4 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Players</h3>
              <PlayerCard
                title={myPlayer?.username ?? "You"}
                mark={myPlayer?.mark ?? "X"}
                active={myPlayer?.mark === matchState.turn}
                connected={!!myPlayer?.connected}
              />
              <PlayerCard
                title={oppPlayer?.username ?? "Opponent"}
                mark={oppPlayer?.mark ?? "O"}
                active={oppPlayer?.mark === matchState.turn}
                connected={!!oppPlayer?.connected}
              />

              <button
                onClick={() => void leaveMatch()}
                className="w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-white/80"
              >
                Leave Match
              </button>
            </div>

            <AnimatePresence>
              {matchState.phase === "finished" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
                >
                  <motion.div
                    id="glasscss"
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.95 }}
                    className="relative w-full max-w-md space-y-5 p-7 text-center"
                  >
                    {myResult === "win" ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.06, 1], opacity: [0.65, 1, 0.65] }}
                          transition={{ duration: 1.3, repeat: Infinity }}
                          className="confetti-wrap"
                        >
                          <span className="confetti c1" />
                          <span className="confetti c2" />
                          <span className="confetti c3" />
                        </motion.div>
                        <h3 id="glowcss" className="text-4xl font-black text-cyan-100">
                          Victory
                        </h3>
                      </>
                    ) : null}
                    {myResult === "loss" ? <h3 className="text-4xl font-black text-white/90">Defeat</h3> : null}
                    {myResult === "draw" ? <h3 className="text-4xl font-black text-white/85">Draw</h3> : null}
                    <p className="text-sm text-white/70">Winner: {winnerName}</p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-white/70">
                      <p>Moves: {matchState.moves.length}</p>
                      <p>You: {myPlayer?.username ?? "You"}</p>
                      <p>Opponent: {oppPlayer?.username ?? "Opponent"}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="action-btn neon-cyan" onClick={() => void rematch()}>
                        Play Again
                      </button>
                      <button
                        className="action-btn neon-neutral"
                        onClick={() => {
                          setView("home");
                          void leaveMatch();
                        }}
                      >
                        Return Home
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        ) : null}

        {view !== "home" || isSearching || isWaiting || isGame ? (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setView("home");
                setCreatedRoomId(null);
                void leaveMatch();
              }}
              className="action-btn neon-neutral h-auto px-4"
            >
              Go to Home Screen
            </button>
          </div>
        ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
