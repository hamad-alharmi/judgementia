"use client";

// app/room/[roomId]/page.tsx
// Self-contained — no missing component imports.

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────
type RoomStatus =
  | "lobby"
  | "prosecutor_turn"
  | "defendant_turn"
  | "jury_voting"
  | "verdict";

type Vibe = "funny" | "serious";
type RoleType = "human" | "ai";

interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  vibe: Vibe;
  scenario: string;
  prosecutor_type: RoleType;
  defendant_type: RoleType;
  jury_type: RoleType;
  judge_type: RoleType;
}

interface GameState {
  room_id: string;
  prosecutor_text: string;
  defendant_text: string;
  guilty_votes: number;
  not_guilty_votes: number;
  verdict_json: Verdict | null;
}

interface Verdict {
  finalVerdict: "GUILTY" | "NOT_GUILTY";
  reasoning: string;
  punishment: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TURN_SECONDS = 60;

async function post<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Small UI atoms ────────────────────────────────────────────────────────────
function GavelIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 13l-8.5 8.5a2.12 2.12 0 01-3-3L11 10" />
      <path d="M21.5 8.5l-5-5" /><path d="M10 7l7 7" />
      <path d="M8 9l3-3 5 5-3 3z" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft((p) => {
        if (p <= 1) {
          clearInterval(id);
          if (!firedRef.current) { firedRef.current = true; onExpire(); }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const pct = (left / seconds) * 100;
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-400 text-right">{left}s remaining</p>
      <div className="w-full h-2 rounded-full bg-zinc-800">
        <div className={`h-2 rounded-full transition-all ${left > 20 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Phase: Lobby ──────────────────────────────────────────────────────────────
function LobbyPhase({ room }: { room: Room }) {
  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      <GavelIcon className="w-12 h-12 text-amber-500 mx-auto" />
      <h1 className="text-4xl font-black text-zinc-100">JUDGEMENTIA</h1>
      <Card>
        <SectionLabel>Room Code</SectionLabel>
        <p className="text-5xl font-black text-amber-500 tracking-widest">{room.code}</p>
        <p className="text-zinc-400 mt-3 text-sm">Share this code with players</p>
      </Card>
      <Card>
        <SectionLabel>Crime Scenario</SectionLabel>
        <p className="text-zinc-300 leading-relaxed">{room.scenario}</p>
      </Card>
      <Card>
        <SectionLabel>Roles</SectionLabel>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {(["prosecutor", "defendant", "jury", "judge"] as const).map((r) => (
            <div key={r} className="flex justify-between bg-zinc-800 rounded-xl px-4 py-2">
              <span className="capitalize text-zinc-400">{r}</span>
              <span className={room[`${r}_type` as keyof Room] === "ai"
                ? "text-amber-500" : "text-emerald-400"}>
                {String(room[`${r}_type` as keyof Room]).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-zinc-500 text-sm animate-pulse">Waiting for host to start…</p>
    </div>
  );
}

// ── Phase: Argument (Prosecutor / Defendant) ──────────────────────────────────
function ArgumentPhase({
  room, gs, isHuman, role, onSubmit,
}: {
  room: Room;
  gs: GameState;
  isHuman: boolean;
  role: "prosecutor" | "defendant";
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const didFire = useRef(false);

  const runAi = useCallback(async () => {
    if (didFire.current) return;
    didFire.current = true;
    setBusy(true);
    try {
      const r = await post<{ text?: string }>("/api/ai-turn", {
        role,
        vibe: room.vibe,
        scenario: room.scenario,
        prosecutorText: gs.prosecutor_text || undefined,
      });
      await onSubmit(r.text ?? "(AI had nothing to say)");
    } catch {
      await onSubmit("(AI failed to respond)");
    } finally {
      setBusy(false);
    }
  }, [role, room.vibe, room.scenario, gs.prosecutor_text, onSubmit]);

  useEffect(() => {
    if (!isHuman) runAi();
  }, [isHuman, runAi]);

  const label = role === "prosecutor" ? "⚔️ Prosecution" : "🛡️ Defense";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-zinc-100">{label}</h2>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          isHuman ? "border-amber-500 text-amber-500" : "border-zinc-600 text-zinc-400"
        }`}>
          {isHuman ? "Your Turn" : "AI is thinking…"}
        </span>
      </div>

      <Card className="border-amber-500/20">
        <SectionLabel>Crime Scenario</SectionLabel>
        <p className="text-zinc-300 leading-relaxed">{room.scenario}</p>
      </Card>

      {role === "defendant" && gs.prosecutor_text && (
        <Card>
          <SectionLabel>Prosecution Said</SectionLabel>
          <p className="text-zinc-300 italic">"{gs.prosecutor_text}"</p>
        </Card>
      )}

      {isHuman ? (
        <Card>
          <CountdownTimer seconds={TURN_SECONDS}
            onExpire={() => onSubmit(text || "(No argument submitted)")} />
          <textarea
            className="w-full mt-4 bg-zinc-800 border border-zinc-700 rounded-xl p-4
              text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none
              focus:border-amber-500 transition-colors"
            rows={5}
            placeholder={role === "prosecutor"
              ? "State your case against the defendant…"
              : "Counter the prosecution's argument…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={() => onSubmit(text || "(No argument submitted)")}
            disabled={busy}
            className="mt-3 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
              text-zinc-950 font-bold transition-all disabled:opacity-50"
          >
            Submit Argument
          </button>
        </Card>
      ) : (
        <Card className="text-center py-14 space-y-4">
          {busy && <><Spinner /><p className="text-zinc-400">AI is building its case…</p></>}
          {!busy && <p className="text-zinc-400">Argument submitted.</p>}
        </Card>
      )}
    </div>
  );
}

// ── Phase: Jury ───────────────────────────────────────────────────────────────
function JuryPhase({
  room, gs, onVoted,
}: {
  room: Room;
  gs: GameState;
  onVoted: (guilty: number, notGuilty: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(room.jury_type === "ai");
  const [voted, setVoted] = useState(false);
  const didFire = useRef(false);

  useEffect(() => {
    if (room.jury_type !== "ai" || didFire.current) return;
    didFire.current = true;
    post<{ guiltyVotes?: number; notGuiltyVotes?: number }>("/api/ai-turn", {
      role: "jury",
      vibe: room.vibe,
      scenario: room.scenario,
      prosecutorText: gs.prosecutor_text,
      defendantText: gs.defendant_text,
    })
      .then((r) => onVoted(r.guiltyVotes ?? 3, r.notGuiltyVotes ?? 2))
      .catch(() => onVoted(3, 2))
      .finally(() => setBusy(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-zinc-100 text-center">🗳️ Jury Deliberation</h2>
      <Card className="border-amber-500/20">
        <SectionLabel>Scenario</SectionLabel>
        <p className="text-zinc-300">{room.scenario}</p>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionLabel>Prosecution</SectionLabel>
          <p className="text-zinc-300 text-sm italic">"{gs.prosecutor_text}"</p>
        </Card>
        <Card>
          <SectionLabel>Defense</SectionLabel>
          <p className="text-zinc-300 text-sm italic">"{gs.defendant_text}"</p>
        </Card>
      </div>

      {room.jury_type === "ai" ? (
        <Card className="text-center py-10 space-y-3">
          {busy && <><Spinner /><p className="text-zinc-400">Jury is deliberating…</p></>}
        </Card>
      ) : voted ? (
        <Card className="text-center py-8">
          <p className="text-zinc-400">Vote submitted. Awaiting others…</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(["guilty", "not_guilty"] as const).map((v) => (
            <button key={v} onClick={() => { setVoted(true); onVoted(v === "guilty" ? 1 : 0, v === "not_guilty" ? 1 : 0); }}
              className={`py-6 rounded-2xl border-2 font-black text-xl transition-all ${
                v === "guilty"
                  ? "border-red-500 text-red-400 hover:bg-red-500/10"
                  : "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
              }`}>
              {v === "guilty" ? "✋ GUILTY" : "✌️ NOT GUILTY"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Phase: Verdict ────────────────────────────────────────────────────────────
function VerdictPhase({
  room, gs, onNewTrial,
}: {
  room: Room;
  gs: GameState;
  onNewTrial: () => void;
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(gs.verdict_json);
  const [busy, setBusy] = useState(!gs.verdict_json);
  const didFire = useRef(false);

  useEffect(() => {
    if (gs.verdict_json || didFire.current) return;
    didFire.current = true;
    post<Verdict>("/api/judge", {
      crimeScenario: room.scenario,
      prosecutorText: gs.prosecutor_text,
      defendantText: gs.defendant_text,
      guiltyVotes: gs.guilty_votes,
      notGuiltyVotes: gs.not_guilty_votes,
      vibe: room.vibe,
    })
      .then(async (v) => {
        setVerdict(v);
        await supabase
          .from("game_state")
          .update({ verdict_json: v })
          .eq("room_id", room.id);
        await supabase.from("rooms").update({ status: "verdict" }).eq("id", room.id);
      })
      .catch(() => setVerdict({
        finalVerdict: "NOT_GUILTY",
        reasoning: "The judge was unavailable.",
        punishment: "Case dismissed.",
      }))
      .finally(() => setBusy(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const judgeName = room.vibe === "funny" ? "Judge Malice" : "Chief Justice Vanguard";
  const isGuilty = verdict?.finalVerdict === "GUILTY";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <GavelIcon className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-3xl font-black text-zinc-100">VERDICT</h2>
        <p className="text-zinc-500 text-sm">As delivered by {judgeName}</p>
      </div>

      {busy ? (
        <Card className="text-center py-16 space-y-4">
          <Spinner />
          <p className="text-zinc-300 font-semibold">The Judge is deliberating…</p>
          <p className="text-zinc-500 text-sm">Order in the court</p>
        </Card>
      ) : verdict && (
        <>
          <div className={`text-center py-8 rounded-2xl border-2 ${
            isGuilty ? "border-red-500 bg-red-500/10" : "border-emerald-500 bg-emerald-500/10"
          }`}>
            <p className={`text-5xl font-black tracking-widest ${isGuilty ? "text-red-400" : "text-emerald-400"}`}>
              {isGuilty ? "GUILTY" : "NOT GUILTY"}
            </p>
            <p className="text-zinc-400 mt-2 text-sm">
              {gs.guilty_votes} Guilty · {gs.not_guilty_votes} Not Guilty
            </p>
          </div>
          <Card>
            <SectionLabel>Judicial Reasoning</SectionLabel>
            <p className="text-zinc-300 leading-relaxed">{verdict.reasoning}</p>
          </Card>
          <Card className={isGuilty ? "border-red-500/30" : "border-emerald-500/30"}>
            <SectionLabel>{isGuilty ? "Sentence" : "Ruling"}</SectionLabel>
            <p className="text-zinc-300 leading-relaxed">{verdict.punishment}</p>
          </Card>
        </>
      )}

      <button onClick={onNewTrial}
        className="w-full py-4 rounded-xl border border-zinc-700 text-zinc-300
          hover:border-amber-500 hover:text-amber-500 font-bold transition-all">
        ↩ New Trial
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const [room, setRoom] = useState<Room | null>(null);
  const [gs, setGs] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function load() {
      const { data: r, error: re } = await supabase
        .from("rooms").select("*").eq("id", roomId).single();
      if (re || !r) { setError("Room not found."); return; }
      setRoom(r as Room);

      const { data: g } = await supabase
        .from("game_state").select("*").eq("room_id", roomId).single();
      setGs(g as GameState ?? {
        room_id: roomId, prosecutor_text: "", defendant_text: "",
        guilty_votes: 0, not_guilty_votes: 0, verdict_json: null,
      });
    }
    load();
  }, [roomId]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as Room))
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state", filter: `room_id=eq.${roomId}` },
        (payload) => setGs(payload.new as GameState))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  // Handlers
  async function handleProsecutorSubmit(text: string) {
    await supabase.from("game_state")
      .upsert({ room_id: roomId, prosecutor_text: text }, { onConflict: "room_id" });
    await supabase.from("rooms").update({ status: "defendant_turn" }).eq("id", roomId);
  }

  async function handleDefendantSubmit(text: string) {
    await supabase.from("game_state")
      .update({ defendant_text: text }).eq("room_id", roomId);
    await supabase.from("rooms").update({ status: "jury_voting" }).eq("id", roomId);
  }

  async function handleVoted(guilty: number, notGuilty: number) {
    await supabase.from("game_state")
      .update({ guilty_votes: guilty, not_guilty_votes: notGuilty }).eq("room_id", roomId);
    await supabase.from("rooms").update({ status: "verdict" }).eq("id", roomId);
  }

  function handleNewTrial() {
    window.location.href = "/";
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (error) return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
      <Card className="text-center max-w-sm">
        <p className="text-red-400 font-bold text-lg">⚠️ {error}</p>
        <button onClick={() => window.location.href = "/"}
          className="mt-4 px-6 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold">
          Go Home
        </button>
      </Card>
    </main>
  );

  if (!room || !gs) return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner />
        <p className="text-zinc-400">Loading courtroom…</p>
      </div>
    </main>
  );

  const PHASES: RoomStatus[] = ["prosecutor_turn", "defendant_turn", "jury_voting", "verdict"];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-10 px-4">
      {/* Breadcrumb */}
      {room.status !== "lobby" && (
        <div className="max-w-2xl mx-auto mb-8 flex items-center gap-2 text-xs text-zinc-600">
          {PHASES.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={room.status === s ? "text-amber-500 font-semibold" : "text-zinc-700"}>
                {s.replace(/_/g, " ")}
              </span>
              {i < PHASES.length - 1 && <span>→</span>}
            </span>
          ))}
        </div>
      )}

      {room.status === "lobby" && <LobbyPhase room={room} />}

      {room.status === "prosecutor_turn" && (
        <ArgumentPhase room={room} gs={gs}
          isHuman={room.prosecutor_type === "human"}
          role="prosecutor" onSubmit={handleProsecutorSubmit} />
      )}

      {room.status === "defendant_turn" && (
        <ArgumentPhase room={room} gs={gs}
          isHuman={room.defendant_type === "human"}
          role="defendant" onSubmit={handleDefendantSubmit} />
      )}

      {room.status === "jury_voting" && (
        <JuryPhase room={room} gs={gs} onVoted={handleVoted} />
      )}

      {room.status === "verdict" && (
        <VerdictPhase room={room} gs={gs} onNewTrial={handleNewTrial} />
      )}
    </main>
  );
}
