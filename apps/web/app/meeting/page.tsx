"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import {

  ArrowLeft, CalendarDays, Calendar, Camera, CameraOff, Check, Clock3, ChevronLeft, ChevronRight, ChevronDown, Keyboard, Phone, HelpCircle,

  Copy, Download, ExternalLink, Hand, Info, Link2,

  MessageCircle, Mic, MicOff, MonitorUp,

  PhoneOff, Plus, Search, Send, Settings2, ShieldCheck, Smile,

  StopCircle, Users, Video, VideoOff, X, Trash2, Volume2, Sparkles, MoreVertical, ChevronUp,

} from "lucide-react";

import "./meet.css";



type Screen = "home" | "prejoin" | "room" | "ended";

type SidePanel = "chat" | "people" | "details" | "settings" | null;

type Meeting = { id: string; title: string; start: string; end: string; description: string; guests: string; createdAt: number };

type ChatMessage = { id: string; text: string; author: string; at: string };

type RecordingState = "idle" | "recording";

const STORAGE = "lms-neumorphic-meetings-v1";

const digits = (n: number) => String(n).padStart(2, "0");

const meetingId = () => `${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;

const isoLocal = (date: Date) => `${date.getFullYear()}-${digits(date.getMonth() + 1)}-${digits(date.getDate())}T${digits(date.getHours())}:${digits(date.getMinutes())}`;

const displayTime = (date: string) => new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const calUTC = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const escapeICS = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const downloadText = (text: string, filename: string, mime: string) => {

  const url = URL.createObjectURL(new Blob([text], { type: mime }));

  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

};



type CalendarMode = "days" | "months" | "years";



function NeumoDatePicker({ value, onChange, onClose }: {

  value: Date;

  onChange: (date: Date) => void;

  onClose: () => void;

}) {

  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const [mode, setMode] = useState<CalendarMode>("days");

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const outside = (event: PointerEvent) => {

      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) onClose();

    };

    document.addEventListener("pointerdown", outside);

    return () => document.removeEventListener("pointerdown", outside);

  }, [onClose]);

  const [yearPage, setYearPage] = useState(() => Math.floor(value.getFullYear() / 12) * 12);

  const now = new Date();

  const months = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1).toLocaleDateString(undefined, { month: "long" }));

  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const days = Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i - firstDay + 1));

  const shift = (delta: number) => {

    if (mode === "years") {

      setYearPage(y => y + delta * 12);

    } else if (mode === "months") {

      setView(d => new Date(d.getFullYear() + delta, d.getMonth(), 1));

    } else {

      setView(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));

    }

  };

  const pick = (date: Date) => {

    const next = new Date(date);

    next.setHours(value.getHours(), value.getMinutes(), 0, 0);

    onChange(next);

    onClose();

  };

  return (

    <div ref={pickerRef} className="meet-neumo-calendar" role="dialog" aria-label="Choose meeting date" onClick={e => e.stopPropagation()}>

      <div className="meet-neumo-calendar-header">

        <button type="button" aria-label="Previous" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>

        <button type="button" className="meet-neumo-calendar-month" onClick={() => setMode(mode === "months" ? "days" : "months")}>{months[view.getMonth()]} <ChevronDown size={14} /></button>

        <button type="button" className="meet-neumo-calendar-year" onClick={() => { setYearPage(Math.floor(view.getFullYear() / 12) * 12); setMode(mode === "years" ? "days" : "years"); }}>{view.getFullYear()} <ChevronDown size={14} /></button>

        <button type="button" aria-label="Next" onClick={() => shift(1)}><ChevronRight size={17} /></button>

      </div>

      {mode === "days" && (

        <>

          <div className="meet-neumo-calendar-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}</div>

          <div className="meet-neumo-calendar-days">{days.map((day, i) => (

            <button type="button" key={i} className={`${day.getMonth() !== view.getMonth() ? "outside" : ""} ${day.toDateString() === value.toDateString() ? "chosen" : ""} ${day.toDateString() === now.toDateString() ? "today-date" : ""}`} onClick={() => pick(day)}>{day.getDate()}</button>

          ))}</div>

        </>

      )}

      {mode === "months" && <div className="meet-neumo-calendar-months">{months.map((month, i) => <button key={month} type="button" className={i === view.getMonth() ? "chosen" : ""} onClick={() => { setView(new Date(view.getFullYear(), i, 1)); setMode("days"); }}>{month}</button>)}</div>}

      {mode === "years" && <>

        <div className="meet-neumo-calendar-year-range"><button type="button" aria-label="Previous years" onClick={() => setYearPage(y => y - 12)}><ChevronLeft size={17} /></button><strong>{yearPage} – {yearPage + 11}</strong><button type="button" aria-label="Next years" onClick={() => setYearPage(y => y + 12)}><ChevronRight size={17} /></button></div>

        <div className="meet-neumo-calendar-years">{Array.from({ length: 12 }, (_, i) => yearPage + i).map(year => <button type="button" key={year} className={year === view.getFullYear() ? "chosen" : ""} onClick={() => { setView(new Date(year, view.getMonth(), 1)); setMode("months"); }}>{year}</button>)}</div>

      </>}

    </div>

  );

}



function NeumoDateTime({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void; }) {

  const [open, setOpen] = useState(false);

  const [timeOpen, setTimeOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const outside = (event: PointerEvent) => {

      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) { setOpen(false); setTimeOpen(false); }

    };

    document.addEventListener("pointerdown", outside);

    return () => document.removeEventListener("pointerdown", outside);

  }, []);

  const date = new Date(value || Date.now());

  const hhmm = `${digits(date.getHours())}:${digits(date.getMinutes())}`;

  return (

    <div className="meet-input-label meet-datetime-label">

      <div className="meet-field-heading">{label}<span className="meet-required">*</span></div>

      <div className="meet-datetime-field" ref={wrapperRef}>

        <button type="button" className="meet-datetime-date" onClick={() => { setTimeOpen(false); setOpen(!open); }}><CalendarDays size={17} />{date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</button>

        <div className="meet-time-anchor">

          <button type="button" className="meet-neumo-time-trigger" aria-label={`${label} time`} aria-expanded={timeOpen} onClick={() => { setOpen(false); setTimeOpen(v => !v); }}><Clock3 size={16} />{hhmm}<ChevronDown size={14} /></button>

          {timeOpen && <div className="meet-neumo-time-picker" role="group" aria-label={`${label} time picker`}>

            <div className="meet-neumo-time-column"><strong>Hour</strong><div className="meet-neumo-time-scroll" ref={el => { if (el && !el.dataset.positioned) { el.scrollTop = Math.max(0, (date.getHours() - 2) * 30); el.dataset.positioned = "true"; } }}>{Array.from({length:24},(_,i)=>i).map(h => <button type="button" key={h} className={h === date.getHours() ? "selected" : ""} onClick={() => {const next = new Date(date); next.setHours(h); onChange(isoLocal(next));}}>{digits(h)}</button>)}</div></div>

            <div className="meet-neumo-time-column"><strong>Minute</strong><div className="meet-neumo-time-scroll" ref={el => { if (el && !el.dataset.positioned) { el.scrollTop = Math.max(0, (date.getMinutes() - 2) * 30); el.dataset.positioned = "true"; } }}>{Array.from({length:60},(_,i)=>i).map(m => <button type="button" key={m} className={m === date.getMinutes() ? "selected" : ""} onClick={() => {const next = new Date(date); next.setMinutes(m); onChange(isoLocal(next)); setTimeOpen(false);}}>{digits(m)}</button>)}</div></div>

          </div>}

        </div>

        {open && <NeumoDatePicker value={date} onChange={d => onChange(isoLocal(d))} onClose={() => setOpen(false)} />}

      </div>

    </div>

  );

}



export default function MeetPage() {

  const [screen, setScreen] = useState<Screen>("home");

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [callHistory, setCallHistory] = useState<{ id: string; title: string; started: string; ended?: string; meetingId: string }[]>([]);
  const [deviceMenu, setDeviceMenu] = useState<"microphone" | "speaker" | "camera" | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [testingMic, setTestingMic] = useState(false);
  const [testRecording, setTestRecording] = useState(false);
  const [testClip, setTestClip] = useState<string | null>(null);
  const activeCallId = useRef<string | null>(null);
  const deviceMenuRef = useRef<HTMLDivElement>(null);
  const testRecorder = useRef<MediaRecorder | null>(null);
  const testChunks = useRef<Blob[]>([]);
  const micTestStream = useRef<MediaStream | null>(null);

  const [active, setActive] = useState<Meeting | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [homeCalendarOpen, setHomeCalendarOpen] = useState(false);

  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const [homeTab, setHomeTab] = useState<"meetings" | "calls">("meetings");

  const [selectedDate, setSelectedDate] = useState(() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; });

  const [showHelp, setShowHelp] = useState(false);

  const [showHomeSettings, setShowHomeSettings] = useState(false);

  const [name, setName] = useState("You");

  const [joinCode, setJoinCode] = useState("");

  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [guests, setGuests] = useState("");

  const [start, setStart] = useState(() => isoLocal(new Date(Date.now() + 3_600_000)));

  const [end, setEnd] = useState(() => isoLocal(new Date(Date.now() + 7_200_000)));

  const [formError, setFormError] = useState("");

  const [notice, setNotice] = useState("");

  const [mic, setMic] = useState(true);

  const [cam, setCam] = useState(true);

  const [stream, setStream] = useState<MediaStream | null>(null);

  const [sharing, setSharing] = useState(false);

  const [panel, setPanel] = useState<SidePanel>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [draft, setDraft] = useState("");

  const [hand, setHand] = useState(false);

  const [reaction, setReaction] = useState("");

  const [elapsed, setElapsed] = useState(0);

  const [recordState, setRecordState] = useState<RecordingState>("idle");

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const [audioDevice, setAudioDevice] = useState("");

  const [videoDevice, setVideoDevice] = useState("");

  const [hostOnly, setHostOnly] = useState(false);
  const [speakerDevice, setSpeakerDevice] = useState("");
  const [speakerVolume, setSpeakerVolume] = useState(60);
  const [micSensitivity, setMicSensitivity] = useState(100);
  const mediaRef = useRef<MediaStream | null>(null);
  const mediaOp = useRef(0);
  const [previewEffect, setPreviewEffect] = useState(false);
  const [showPreviewOptions, setShowPreviewOptions] = useState(true);
  const [prejoinMenu, setPrejoinMenu] = useState(false);

  const videoEl = useRef<HTMLVideoElement>(null);

  const screenEl = useRef<HTMLVideoElement>(null);

  const shareStream = useRef<MediaStream | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);

  const chunks = useRef<Blob[]>([]);

  const joinedAt = useRef<number>(0);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



  const toast = useCallback((message: string) => {

    setNotice(message);

    if (noticeTimer.current) clearTimeout(noticeTimer.current);

    noticeTimer.current = setTimeout(() => setNotice(""), 4200);

  }, []);

  const linkFor = useCallback((m: Meeting) => typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(m.id)}`, []);



  useEffect(() => {

    try {

      const saved = JSON.parse(localStorage.getItem(STORAGE) || "[]");

      if (Array.isArray(saved)) setMeetings(saved);
      const history = JSON.parse(localStorage.getItem("lms-meet-call-history-v1") || "[]");
      if (Array.isArray(history)) setCallHistory(history);

    } catch { /* clean state */ }

    const room = new URLSearchParams(window.location.search).get("room");

    if (room) {

      setActive({ id: room, title: "Meeting " + room, start: isoLocal(new Date()), end: isoLocal(new Date(Date.now() + 3_600_000)), description: "", guests: "", createdAt: Date.now() });

      setScreen("prejoin");

    }

  }, []);

  useEffect(() => { if (meetings.length || localStorage.getItem(STORAGE)) localStorage.setItem(STORAGE, JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem("lms-meet-call-history-v1", JSON.stringify(callHistory)); }, [callHistory]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !deviceMenuRef.current?.contains(event.target)) setDeviceMenu(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (!testingMic) { setMicLevel(0); return; }
    let cancelled = false;
    let raf = 0;
    let audioContext: AudioContext | null = null;
    let temporary: MediaStream | null = null;
    const begin = async () => {
      try {
        const current = mediaRef.current?.getAudioTracks()[0];
        let source: MediaStream;
        if (current?.readyState === "live") {
          current.enabled = true;
          setMic(true);
          source = new MediaStream([current]);
        } else {
          temporary = await navigator.mediaDevices.getUserMedia({ audio: audioDevice ? {deviceId: {ideal: audioDevice}} : true });
          source = temporary;
        }
        if (cancelled) { temporary?.getTracks().forEach(t => t.stop()); return; }
        audioContext = new AudioContext();
        await audioContext.resume();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        audioContext.createMediaStreamSource(source).connect(analyser);
        const bytes = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(bytes);
          let energy = 0;
          for (const b of bytes) energy += Math.pow((b - 128) / 128, 2);
          const rms = Math.sqrt(energy / bytes.length);
          setMicLevel(Math.min(100, Math.round(rms * 650 * micSensitivity / 100)));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) { setTestingMic(false); toast("Allow microphone access in your browser to test its level."); }
      }
    };
    void begin();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      temporary?.getTracks().forEach(t => t.stop());
      void audioContext?.close();
    };
  }, [testingMic, audioDevice, micSensitivity, toast]);

  useEffect(() => {
    if (screen !== "prejoin" || !navigator.mediaDevices?.enumerateDevices) return;
    void navigator.mediaDevices.enumerateDevices().then(setDevices).catch(() => {});
  }, [screen]);
  useEffect(() => {
    if (screen !== "prejoin") return;
    if (!mediaRef.current && (mic || cam)) void getMedia(mic, cam);
    // This deliberately runs only when entering the preview, not after every toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
  useEffect(() => { mediaRef.current = stream; }, [stream]);
  useEffect(() => { if (videoEl.current) { videoEl.current.srcObject = stream; if (stream?.getVideoTracks().length) videoEl.current.play().catch(() => {}); } }, [stream, screen, panel]);

  useEffect(() => { if (screenEl.current) { screenEl.current.srcObject = sharing ? shareStream.current : null; screenEl.current.play().catch(() => {}); } }, [sharing, screen, panel]);

  useEffect(() => {

    if (screen !== "room") return;

    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - joinedAt.current) / 1000)), 1000);

    return () => window.clearInterval(timer);

  }, [screen]);

  useEffect(() => {

    const handle = (e: KeyboardEvent) => {

      if (screen !== "room" || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); setMic(v => !v); }

      if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); setCam(v => !v); }

      if (e.key === "Escape") setPanel(null);

    };

    window.addEventListener("keydown", handle);

    return () => window.removeEventListener("keydown", handle);

  }, [screen]);

  useEffect(() => {

    if (!stream) return;

    stream.getAudioTracks().forEach(t => { t.enabled = mic; });

    stream.getVideoTracks().forEach(t => { t.enabled = cam; });

  }, [mic, cam, stream]);

  useEffect(() => () => {

    if (noticeTimer.current) clearTimeout(noticeTimer.current);

    stream?.getTracks().forEach(t => t.stop());

    shareStream.current?.getTracks().forEach(t => t.stop());

  }, [stream]);



  async function getMedia(requestAudio = mic, requestVideo = cam, selectedAudio = audioDevice, selectedVideo = videoDevice) {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Camera and microphone require HTTPS or localhost and browser permissions.");
      return false;
    }
    const op = ++mediaOp.current;
    const previous = mediaRef.current;
    if (!requestAudio && !requestVideo) {
      previous?.getTracks().forEach(track => track.stop());
      mediaRef.current = null;
      setStream(null);
      return true;
    }
    // Request devices separately, allowing one to work if permission for the other fails.
    const tracks: MediaStreamTrack[] = [];
    let audioOk = false;
    let videoOk = false;
    if (requestAudio) {
      try {
        const audio = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudio ? { deviceId: { ideal: selectedAudio } } : true,
          video: false,
        });
        tracks.push(...audio.getAudioTracks());
        audioOk = audio.getAudioTracks().length > 0;
      } catch { toast("Microphone access blocked. Check browser permissions or select another microphone."); }
    }
    if (requestVideo) {
      try {
        const video = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: selectedVideo ? { deviceId: { ideal: selectedVideo } } : true,
        });
        tracks.push(...video.getVideoTracks());
        videoOk = video.getVideoTracks().length > 0;
      } catch { toast("Camera access blocked. Check browser permissions or select another camera."); }
    }
    if (op !== mediaOp.current) {
      tracks.forEach(track => track.stop());
      return false;
    }
    previous?.getTracks().forEach(track => track.stop());
    const next = tracks.length ? new MediaStream(tracks) : null;
    mediaRef.current = next;
    setStream(next);
    if (requestAudio) setMic(audioOk);
    if (requestVideo) setCam(videoOk);
    try { setDevices(await navigator.mediaDevices.enumerateDevices()); } catch { /* unsupported */ }
    return audioOk || videoOk;
  }
  function openMeeting(m: Meeting) { setDeviceMenu(null); setActive(m); setScreen("prejoin"); setPanel(null); setMessages([]); setHand(false); setElapsed(0); }

  function deleteMeeting(id: string) {
    if (!window.confirm("Remove this meeting from your list?")) return;
    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
    toast("Meeting removed from your list.");
  }
  async function changePrejoinMedia(kind: "mic" | "cam") {
    if (kind === "mic") {
      if (mic) {
        setMic(false);
        mediaRef.current?.getAudioTracks().forEach(track => { track.enabled = false; });
        return;
      }
      const track = mediaRef.current?.getAudioTracks()[0];
      if (track && track.readyState === "live") {
        track.enabled = true;
        setMic(true);
      } else {
        await getMedia(true, cam);
      }
      return;
    }
    if (cam) {
      setCam(false);
      mediaRef.current?.getVideoTracks().forEach(track => { track.enabled = false; });
      return;
    }
    const track = mediaRef.current?.getVideoTracks()[0];
    if (track && track.readyState === "live") {
      track.enabled = true;
      setCam(true);
    } else {
      await getMedia(mic, true);
    }
  }
  async function setPrejoinDevice(kind: "microphone" | "camera", id: string) {
    const nextAudio = kind === "microphone" ? id : audioDevice;
    const nextVideo = kind === "camera" ? id : videoDevice;
    if (kind === "microphone") setAudioDevice(id);
    else setVideoDevice(id);
    await getMedia(kind === "microphone" ? true : mic, kind === "camera" ? true : cam, nextAudio, nextVideo);
  }
  function createInstant() {

    const now = new Date(); const m = { id: meetingId(), title: "Instant meeting", start: isoLocal(now), end: isoLocal(new Date(now.getTime() + 3_600_000)), description: "", guests: "", createdAt: Date.now() };

    openMeeting(m);

  }

  function makeScheduled() {

    if (!title.trim()) { setFormError("Meeting title is required."); return; }

    if (!start || !end || new Date(end) <= new Date(start)) { setFormError("End time must be later than start time."); return; }

    const m = { id: meetingId(), title: title.trim(), start, end, description: description.trim(), guests: guests.trim(), createdAt: Date.now() };

    setMeetings(prev => [m, ...prev]); setShowCreate(false); setFormError(""); setTitle(""); setDescription(""); setGuests(""); toast("Scheduled locally. Add it to Google Calendar or export an invitation.");

    return m;

  }

  function calendarUrl(m: Meeting) {

    const details = [m.description, `Meeting link: ${linkFor(m)}`, "Note: This prototype link does not connect remote participants until a video backend is integrated."].filter(Boolean).join("\n\n");

    const params = new URLSearchParams({ action: "TEMPLATE", text: m.title, dates: `${calUTC(m.start)}/${calUTC(m.end)}`, details, location: linkFor(m) });

    return `https\://calendar.google.com/calendar/render?${params.toString()}`;

  }

  function exportICS(m: Meeting) {

    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LMS Meetings//EN", "BEGIN:VEVENT", `UID:${m.id}@lms-meeting`, `DTSTAMP:${calUTC(new Date().toISOString())}`, `DTSTART:${calUTC(m.start)}`, `DTEND:${calUTC(m.end)}`, `SUMMARY:${escapeICS(m.title)}`, `DESCRIPTION:${escapeICS([m.description, linkFor(m)].filter(Boolean).join("\n"))}`, `URL:${linkFor(m)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");

    downloadText(ics, `${m.id}.ics`, "text/calendar;charset=utf-8");

  }

  async function copyLink(m: Meeting) { try { await navigator.clipboard.writeText(linkFor(m)); toast("Meeting link copied"); } catch { toast(`Copy this link: ${linkFor(m)}`); } }

  function joinByCode() {

    const raw = joinCode.trim(); if (!raw) return toast("Enter a meeting code or link.");

    let id = raw;

    try { const parsed = new URL(raw); id = parsed.searchParams.get("room") || ""; } catch { /* plain code */ }

    id = id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40);

    if (!id) return toast("Invalid meeting link. Use a link with ?room= or enter a meeting code.");

    openMeeting(meetings.find(m => m.id === id) || { id, title: `Meeting ${id}`, start: isoLocal(new Date()), end: isoLocal(new Date(Date.now() + 3_600_000)), description: "", guests: "", createdAt: Date.now() });

  }

  async function joinRoom() {

    if (!active) return;

    if ((cam || mic) && !stream) await getMedia();

    joinedAt.current = Date.now();
    const id = crypto.randomUUID();
    activeCallId.current = id;
    setCallHistory(prev => [{ id, title: active.title, started: new Date().toISOString(), meetingId: active.id }, ...prev]);
    setDeviceMenu(null);
    setScreen("room");

    window.history.replaceState(null, "", `${window.location.pathname}?room=${encodeURIComponent(active.id)}`);

  }

  function stopSharing() { shareStream.current?.getTracks().forEach(t => t.stop()); shareStream.current = null; setSharing(false); }

  async function toggleShare() {

    if (sharing) return stopSharing();

    try {

      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

      shareStream.current = s; setSharing(true); s.getVideoTracks()[0].addEventListener("ended", stopSharing, { once: true });

    } catch { toast("Screen sharing cancelled or not supported."); }

  }

  function stopRecording() { if (recorder.current?.state === "recording") recorder.current.stop(); setRecordState("idle"); }

  function toggleRecord() {

    if (recordState === "recording") return stopRecording();

    if (!stream?.getTracks().length) return toast("Enable a camera or microphone to record your local media.");

    if (typeof MediaRecorder === "undefined") return toast("Recording is not supported in this browser.");

    try {

      const r = new MediaRecorder(stream); chunks.current = []; recorder.current = r;

      r.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };

      r.onstop = () => {

        if (!chunks.current.length) return;

        const blob = new Blob(chunks.current, { type: r.mimeType || "video/webm" });

        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `local-recording-${active?.id || "meeting"}.webm`; a.click();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000); toast("Local recording downloaded. Other participants were not recorded.");

      };

      r.start(1000); setRecordState("recording"); toast("Recording only your local camera/microphone.");

    } catch { toast("Could not start a local recording."); }

  }

  function leave() {
    const callId = activeCallId.current;
    if (callId) setCallHistory(prev => prev.map(item => item.id === callId ? { ...item, ended: new Date().toISOString() } : item));
    activeCallId.current = null;
    stopRecording(); stopSharing(); stream?.getTracks().forEach(t => t.stop()); setStream(null); setPanel(null); setScreen("ended");

    window.history.replaceState(null, "", window.location.pathname);

  }

  function sendMessage() {

    if (!draft.trim()) return;

    setMessages(prev => [...prev, { id: crypto.randomUUID(), text: draft.trim(), author: name.trim() || "You", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);

    setDraft("");

  }

  const togglePanel = (p: SidePanel) => setPanel(prev => prev === p ? null : p);

  const sameDay = (date: Date, other: Date) => date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth() && date.getDate() === other.getDate();

  const weekStart = new Date(selectedDate);

  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => { const day = new Date(weekStart); day.setDate(weekStart.getDate() + i); return day; });

  const currentMeetings = meetings.filter(m => m.title !== "Instant meeting" && m.title !== "Meeting for later" && sameDay(new Date(m.start), selectedDate) && `${m.title} ${m.id}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const dateHeading = selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  function changeWeek(weeks: number) { setSelectedDate(prev => { const next = new Date(prev); next.setDate(next.getDate() + weeks * 7); return next; }); }

  function createLinkForLater() {

    const now = new Date();

    const m = { id: meetingId(), title: "Meeting for later", start: isoLocal(now), end: isoLocal(new Date(now.getTime() + 3_600_000)), description: "", guests: "", createdAt: Date.now() };

    setMeetings(prev => [m, ...prev]);

    setNewMenuOpen(false);

    void copyLink(m);

  }

  async function testSpeakers() {
    try {
      const audio = new Audio();
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 540;
      gain.gain.value = (speakerVolume / 100) * 0.2;
      const destination = ctx.createMediaStreamDestination();
      oscillator.connect(gain).connect(destination);
      audio.srcObject = destination.stream;
      if (speakerDevice && "setSinkId" in audio) await (audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(speakerDevice);
      await audio.play();
      oscillator.start();
      window.setTimeout(() => { oscillator.stop(); audio.pause(); void ctx.close(); }, 500);
      toast("Speaker test played. Adjust test volume if needed.");
    } catch { toast("Unable to test the selected speakers. Check browser permissions."); }
  }
  async function makeTestRecording() {
    if (testRecording) {
      if (testRecorder.current?.state === "recording") testRecorder.current.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined") { toast("Camera recording is not supported in this browser."); return; }
    try {
      let video = mediaRef.current?.getVideoTracks()[0];
      if (!video || video.readyState !== "live") {
        const enabled = await getMedia(mic, true);
        if (!enabled) return;
        video = mediaRef.current?.getVideoTracks()[0];
      }
      if (!video || video.readyState !== "live") { toast("Allow camera permission before testing."); return; }
      video.enabled = true;
      setCam(true);
      const recordingStream = new MediaStream([video]);
      const rec = new MediaRecorder(recordingStream);
      testRecorder.current = rec;
      testChunks.current = [];
      if (testClip) { URL.revokeObjectURL(testClip); setTestClip(null); }
      rec.ondataavailable = e => { if (e.data.size) testChunks.current.push(e.data); };
      rec.onstop = () => {
        setTestRecording(false);
        if (testChunks.current.length) {
          setTestClip(URL.createObjectURL(new Blob(testChunks.current, { type: rec.mimeType || "video/webm" })));
          toast("Camera test complete. Play or download it below.");
        }
      };
      rec.start();
      setTestRecording(true);
      window.setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 4000);
    } catch { setTestRecording(false); toast("Camera test could not start. Check camera permissions."); }
  }
  function toggleDeviceMenu(which: "microphone" | "speaker" | "camera") {
    setDeviceMenu(open => open === which ? null : which);
  }

  const availableDeviceOptions = (kind: MediaDeviceKind) => {
    const seen = new Set<string>();
    return devices.filter(d => {
      if (d.kind !== kind || !d.deviceId || d.deviceId === "default" || d.deviceId === "communications" || seen.has(d.deviceId)) return false;
      seen.add(d.deviceId);
      return true;
    });
  };

  const duration = `${digits(Math.floor(elapsed / 3600))}:${digits(Math.floor((elapsed % 3600) / 60))}:${digits(elapsed % 60)}`;



  return (

    <main className={`meet-root ${screen === "room" ? "in-call" : ""}`}>

      {notice && <div className="meet-toast" role="status"><Info size={17}/>{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={15}/></button></div>}

      {screen === "ended" && <header className="meet-topbar"><div className="meet-logo"><span className="meet-logo-icon"><Video size={21}/></span><span>Meet<span className="meet-logo-dot">.</span></span></div></header>}



      {screen === "home" && (

        <div className="meet-home-shell">

          <header className="meet-home-header">

            <div className="meet-home-brand">

              <span className="meet-home-brand-icon"><Video size={26} strokeWidth={2.3} /></span>

              <strong>Meet</strong>

            </div>

            <div className="meet-home-actions">

              <div className="meet-home-code">

                <Keyboard size={22} />

                <input

                  aria-label="Enter a meeting code or link"

                  placeholder="Enter a code or link"

                  value={joinCode}

                  onChange={e => setJoinCode(e.target.value)}

                  onKeyDown={e => { if (e.key === "Enter") joinByCode(); }}

                />

                <button type="button" onClick={joinByCode} disabled={!joinCode.trim()}>Join</button>

              </div>

              <div className="meet-home-new-wrap">

                <button

                  type="button"

                  className="meet-home-new"

                  aria-expanded={newMenuOpen}

                  onClick={() => setNewMenuOpen(open => !open)}

                >

                  <Plus size={22} /> New

                </button>

                {newMenuOpen && (

                  <div className="meet-home-new-menu">

                    <button type="button" onClick={() => { setNewMenuOpen(false); createInstant(); }}><Video size={19} /> Start an instant meeting</button>

                    <button type="button" onClick={createLinkForLater}><Link2 size={19} /> Create a meeting for later</button>

                    <button type="button" onClick={() => { setNewMenuOpen(false); setShowCreate(true); }}><CalendarDays size={19} /> Schedule a meeting</button>

                  </div>

                )}

              </div>

            </div>

            <div className="meet-home-tools">

              <button type="button" aria-label="Help" title="Help" onClick={() => setShowHelp(true)}><HelpCircle size={22} /></button>

              <button type="button" aria-label="Settings" title="Settings" onClick={() => setShowHomeSettings(true)}><Settings2 size={23} /></button>

            </div>

          </header>

          <div className="meet-home-body">

            <nav className="meet-home-nav" aria-label="Meet navigation">

              <button type="button" className={homeTab === "meetings" ? "selected" : ""} onClick={() => setHomeTab("meetings")}>

                <span><CalendarDays size={23} /></span><small>Meetings</small>

              </button>

              <button type="button" className={homeTab === "calls" ? "selected" : ""} onClick={() => setHomeTab("calls")}>

                <span><Phone size={23} /></span><small>Calls</small>

              </button>

            </nav>

            <section className="meet-home-main">

              {homeTab === "meetings" ? (

                <>

                  <div className="meet-home-week-header">

                    <div className="meet-home-date-title">

                      <h1>{dateHeading}</h1>

                      <div className="meet-home-date-control">

                        <button className="meet-home-date-trigger" type="button" title="Choose date" aria-label="Choose meeting date" onClick={() => setHomeCalendarOpen(open => !open)}><CalendarDays size={23} /></button>

                        {!sameDay(selectedDate, new Date()) && <button type="button" className="meet-home-today-button" onClick={() => { const d = new Date(); d.setHours(12,0,0,0); setSelectedDate(d); setHomeCalendarOpen(false); }}>Today</button>}

                        {homeCalendarOpen && <NeumoDatePicker value={selectedDate} onChange={setSelectedDate} onClose={() => setHomeCalendarOpen(false)} />}

                      </div>

                    </div>

                    <div className="meet-home-week-controls">

                      <button className="meet-home-week-arrow" type="button" onClick={() => changeWeek(-1)} aria-label="Previous week"><ChevronLeft size={21}/></button>

                      <div className="meet-home-week-days">

                        {weekDays.map(day => (

                          <button

                            type="button"

                            key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}

                            className={sameDay(day, selectedDate) ? "active" : ""}

                            onClick={() => setSelectedDate(day)}

                            aria-pressed={sameDay(day, selectedDate)}

                          >

                            <span>{day.toLocaleDateString(undefined, { weekday: "short" })}</span>

                            <strong>{day.getDate()}</strong>

                          </button>

                        ))}

                      </div>

                      <button className="meet-home-week-arrow" type="button" onClick={() => changeWeek(1)} aria-label="Next week"><ChevronRight size={21}/></button>

                    </div>

                  </div>

                  {currentMeetings.length ? (

                    <div className="meet-home-agenda">

                      <h2>Meetings on {dateHeading}</h2>

                      <div className="meet-home-search"><Search size={18}/><input placeholder="Search meetings" value={search} onChange={e => setSearch(e.target.value)}/></div>

                      {currentMeetings.map(m => (

                        <article className="meet-home-meeting" key={m.id}>

                          <div className="meet-home-meeting-icon"><Video size={22}/></div>

                          <div className="meet-home-meeting-details"><strong>{m.title}</strong><span>{displayTime(m.start)} – {new Date(m.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><small>{m.id}</small></div>

                          <div className="meet-home-meeting-actions">

                            <button type="button" onClick={() => openMeeting(m)}>Join</button>

                            <button type="button" title="Copy link" aria-label="Copy meeting link" onClick={() => copyLink(m)}><Copy size={18}/></button>

                            <a title="Add to Google Calendar" aria-label="Add to Google Calendar" target="_blank" rel="noopener noreferrer" href={calendarUrl(m)}><CalendarDays size={18}/></a>

                            <button type="button" title="Download calendar invitation" aria-label="Download calendar invitation" onClick={() => exportICS(m)}><Download size={18}/></button>
                            <button type="button" className="meet-delete-meeting" title="Delete meeting" aria-label={`Delete ${m.title}`} onClick={() => deleteMeeting(m.id)}><Trash2 size={18}/></button>

                          </div>

                        </article>

                      ))}

                    </div>

                  ) : (

                    <div className="meet-home-empty">

                      <svg className="meet-home-empty-art" viewBox="0 0 440 250" role="img" aria-label="Illustration of a desk with a video meeting screen, pencil and mug">

                        <path d="M82 94 C65 76 48 67 73 49 C92 36 137 49 135 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>

                        <path d="M205 53 C239 9 261 18 248 62 C272 38 298 27 326 39" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>

                        <circle cx="351" cy="39" r="17" fill="#F6CB27"/>

                        <path d="M43 215 L135 215 Q130 156 64 140 Q45 134 43 153Z" fill="#F2BBDF" stroke="currentColor" strokeWidth="2" />

                        <path d="M154 163 H241 V190 C241 224 155 230 154 190Z" fill="#FFD549" stroke="currentColor" strokeWidth="2"/>

                        <path d="M241 173 H260 C278 173 279 202 246 202" fill="none" stroke="currentColor" strokeWidth="2"/>

                        <path d="M239 68 L252 72 L276 215 L263 215Z" fill="#FBE865" stroke="currentColor" strokeWidth="2"/>

                        <path d="M239 68 L244 49 L252 72Z" fill="#FFFFFF" stroke="currentColor" strokeWidth="2"/>

                        <path d="M244 49 L246 42 L249 51Z" fill="#333333"/>

                        <path d="M290 106 L408 106 L381 215 L263 215Z" fill="#DFE6E9" stroke="currentColor" strokeWidth="2"/>

                        <path d="M397 106 L408 106 L381 215 L371 215Z" fill="#F2BBDF" stroke="currentColor" strokeWidth="2"/>

                        <path d="M315 140 Q320 128 331 128 H360 Q368 128 364 141 L356 179 Q355 186 345 186 H306 Q300 186 303 174Z" fill="none" stroke="currentColor" strokeWidth="2"/>

                        <path d="M356 148 L390 133 L379 169 L354 157" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>

                        <circle cx="314" cy="175" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>

                        <path d="M32 216 H420" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>

                      </svg>

                      <h2>No meetings scheduled for {sameDay(selectedDate, new Date()) ? "today" : dateHeading}</h2>

                      <p>Schedule a meeting or enjoy the free time</p>

                      <button className="meet-home-empty-new" type="button" onClick={() => setShowCreate(true)}><Plus size={22}/> New</button>

                    </div>

                  )}

                </>

              ) : (

                <div className="meet-calls-history">
                  <h2>Call history</h2>
                  {callHistory.length ? <div className="meet-calls-list">
                    {callHistory.map(call => <article className="meet-call-history-item" key={call.id}>
                      <span className="meet-history-icon"><Phone size={18}/></span>
                      <div className="meet-history-info"><strong>{call.title}</strong><span>{new Date(call.started).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}{call.ended ? ` · ${Math.max(0, Math.round((new Date(call.ended).getTime() - new Date(call.started).getTime()) / 60000))} min` : " · Joined"}</span></div>
                      <button type="button" title="Rejoin call" onClick={() => openMeeting({ id: call.meetingId, title: call.title, start: isoLocal(new Date()), end: isoLocal(new Date(Date.now() + 3600000)), description: "", guests: "", createdAt: Date.now() })}><Video size={17}/> Rejoin</button>
                      <button type="button" className="meet-history-delete" title="Remove from call history" aria-label="Remove call history" onClick={() => setCallHistory(prev => prev.filter(item => item.id !== call.id))}><Trash2 size={17}/></button>
                    </article>)}
                  </div> : <div className="meet-calls-empty-text"><Phone size={38}/><h3>No call history yet</h3><p>Calls you join will appear here after you enter a meeting.</p></div>}
                </div>

              )}

            </section>

          </div>

          {showHelp && <div className="meet-home-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowHelp(false); }}><div className="meet-home-dialog" role="dialog" aria-modal="true" aria-label="Help"><button className="meet-home-close" type="button" aria-label="Close" onClick={() => setShowHelp(false)}><X size={20}/></button><h2>Meeting help</h2><p>Use <strong>New</strong> to start, create a link for later, or schedule a meeting. Use the code field to join. Pick a date in the calendar to see scheduled meetings. Media permissions are requested when entering a meeting.</p><p>Live conversations with other participants require a video backend; this version is a browser prototype.</p></div></div>}

          {showHomeSettings && <div className="meet-home-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowHomeSettings(false); }}><div className="meet-home-dialog" role="dialog" aria-modal="true" aria-label="Default device settings"><button className="meet-home-close" type="button" aria-label="Close" onClick={() => setShowHomeSettings(false)}><X size={20}/></button><h2>Meeting preferences</h2><label><input type="checkbox" checked={mic} onChange={e => setMic(e.target.checked)}/> Microphone on when joining</label><label><input type="checkbox" checked={cam} onChange={e => setCam(e.target.checked)}/> Camera on when joining</label><p>You can also adjust devices from the meeting settings panel.</p></div></div>}

        </div>

      )}



            {screen === "prejoin" && active && (
        <div className="meet-prejoin-page">
          <header className="meet-prejoin-topbar">
            <button type="button" className="meet-prejoin-brand" onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setScreen("home"); window.history.replaceState(null, "", window.location.pathname); }}>
              <Video size={28} />
              <strong>Meet</strong>
            </button>
            <button type="button" className="meet-prejoin-back" onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setScreen("home"); window.history.replaceState(null, "", window.location.pathname); }}><ArrowLeft size={17} /> Back to meetings</button>
          </header>
          <div className="meet-prejoin-layout meet-prejoin-google-layout">
            <section className="meet-prejoin-left">
              <div className="meet-preview-video meet-prejoin-camera-stage">
                <video ref={videoEl} autoPlay muted playsInline className={`${cam && stream?.getVideoTracks().length ? "" : "is-hidden"} ${previewEffect ? "meet-preview-effect" : ""}`} />
                {(!cam || !stream?.getVideoTracks().length) && <div className="meet-no-video"><span><CameraOff size={32}/></span><p>{cam ? "Allow camera access to see your preview" : "Your camera is off"}</p></div>}
                <span className="meet-preview-name">{name.trim() || "You"}</span>
                <div className="meet-prejoin-stage-menu">
                  <button type="button" aria-label="More preview options" title="Preview options" onClick={() => setPrejoinMenu(v => !v)}><MoreVertical size={19}/></button>
                  {prejoinMenu && <div className="meet-prejoin-menu"><button type="button" onClick={() => { setPrejoinMenu(false); void getMedia(); }}>Refresh preview</button><button type="button" onClick={() => { setPrejoinMenu(false); setPreviewEffect(v => !v); }}>{previewEffect ? "Remove" : "Apply"} background blur</button></div>}
                </div>
                <div className="meet-prejoin-overlay-controls">
                  <button type="button" className={`meet-round-button ${!mic ? "off" : ""}`} aria-label={mic ? "Mute microphone" : "Unmute microphone"} title="Microphone" onClick={() => void changePrejoinMedia("mic")}>{mic ? <Mic size={21}/> : <MicOff size={21}/>}</button>
                  <button type="button" className={`meet-round-button ${!cam ? "off" : ""}`} aria-label={cam ? "Turn off camera" : "Turn on camera"} title="Camera" onClick={() => void changePrejoinMedia("cam")}>{cam ? <Video size={21}/> : <VideoOff size={21}/>}</button>
                </div>
                <button type="button" className="meet-prejoin-effects-button" title="Toggle preview background effect" aria-label="Toggle preview background effect" onClick={() => setPreviewEffect(v => !v)}><Sparkles size={20}/></button>
              </div>
              <div className="meet-prejoin-device-row" ref={deviceMenuRef}>
                <div className="meet-device-wrap">
                  <button type="button" className="meet-device-button" aria-expanded={deviceMenu === "microphone"} onClick={() => toggleDeviceMenu("microphone")}><Mic size={17}/><span>{devices.find(d => audioDevice && d.deviceId === audioDevice)?.label || "Microphone · System default"}</span><ChevronDown size={15}/></button>
                  {deviceMenu === "microphone" && <div className="meet-device-popup"><div className="meet-device-options">{[{ deviceId: "", label: "System default" }, ...availableDeviceOptions("audioinput")].map((d, index) => <button key={`${d.deviceId || "default"}-${index}`} type="button" className={audioDevice === d.deviceId ? "selected" : ""} onClick={() => { void setPrejoinDevice("microphone", d.deviceId); setDeviceMenu(null); }}>{audioDevice === d.deviceId && <Check size={16}/>}<span>{d.label || "Microphone"}</span></button>)}</div><div className="meet-device-test"><button type="button" onClick={() => setTestingMic(v => !v)}><Mic size={17}/>{testingMic ? "Stop microphone test" : "Test microphone"}</button><div className="meet-mic-meter" role="meter" aria-label="Microphone input level" aria-valuenow={micLevel} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${micLevel}%` }}/></div><p className="meet-test-status">{testingMic ? `Input level ${micLevel}% · Speak to test` : "Select Test microphone to view input volume"}</p><label className="meet-mic-sensitivity">Microphone test sensitivity <input type="range" min="25" max="200" step="5" value={micSensitivity} onChange={e => setMicSensitivity(Number(e.target.value))} aria-label="Microphone test sensitivity"/><span>{micSensitivity}%</span></label></div></div>}
                </div>
                <div className="meet-device-wrap">
                  <button type="button" className="meet-device-button" aria-expanded={deviceMenu === "speaker"} onClick={() => toggleDeviceMenu("speaker")}><Volume2 size={17}/><span>{devices.find(d => speakerDevice && d.deviceId === speakerDevice)?.label || "Speakers · System default"}</span><ChevronDown size={15}/></button>
                  {deviceMenu === "speaker" && <div className="meet-device-popup"><div className="meet-device-options">{[{ deviceId: "", label: "System default" }, ...availableDeviceOptions("audiooutput")].map((d, index) => <button key={`${d.deviceId || "default"}-${index}`} type="button" className={speakerDevice === d.deviceId ? "selected" : ""} onClick={() => { setSpeakerDevice(d.deviceId); setDeviceMenu(null); }}>{speakerDevice === d.deviceId && <Check size={16}/>}<span>{d.label || "Speakers"}</span></button>)}</div><div className="meet-device-test"><button type="button" onClick={() => void testSpeakers()}><Volume2 size={17}/> Test speakers</button><label className="meet-speaker-volume">Test volume <input type="range" min="0" max="100" step="5" value={speakerVolume} onChange={e => setSpeakerVolume(Number(e.target.value))} aria-label="Speaker test volume" /><span>{speakerVolume}%</span></label></div></div>}
                </div>
                <div className="meet-device-wrap">
                  <button type="button" className="meet-device-button" aria-expanded={deviceMenu === "camera"} onClick={() => toggleDeviceMenu("camera")}><Video size={17}/><span>{devices.find(d => videoDevice && d.deviceId === videoDevice)?.label || "Camera · System default"}</span><ChevronDown size={15}/></button>
                  {deviceMenu === "camera" && <div className="meet-device-popup"><div className="meet-device-options">{[{ deviceId: "", label: "System default" }, ...availableDeviceOptions("videoinput")].map((d, index) => <button key={`${d.deviceId || "default"}-${index}`} type="button" className={videoDevice === d.deviceId ? "selected" : ""} onClick={() => { void setPrejoinDevice("camera", d.deviceId); setDeviceMenu(null); }}>{videoDevice === d.deviceId && <Check size={16}/>}<span>{d.label || "Camera"}</span></button>)}</div><div className="meet-device-test"><button type="button" onClick={() => void makeTestRecording()}><Video size={17}/>{testRecording ? "Stop test recording" : "Make a 4-second test recording"}</button>{testClip && <div className="meet-test-result"><video src={testClip} controls playsInline /><a href={testClip} download="camera-test.webm">Download test recording</a></div>}</div></div>}
                </div>
              </div>
            </section>
            <section className="meet-prejoin-ready-panel">
              <h1>Ready to join?</h1>
              <p className="meet-prejoin-alone">No one else is here in this local preview</p>
              <p className="meet-prejoin-note">Meeting code: {active.id}</p>
              <label className="meet-prejoin-name-label">Display name<input value={name} onChange={e => setName(e.target.value)} maxLength={40}/></label>
              <button type="button" className="meet-prejoin-join" onClick={joinRoom}>Join now</button>


              <button type="button" className="meet-prejoin-secondary meet-other-ways" onClick={() => setShowPreviewOptions(v => !v)}>Other ways to join <ChevronDown size={17} className={showPreviewOptions ? "meet-chevron-up" : ""}/></button>
              {showPreviewOptions && <div className="meet-prejoin-extras">
                <button type="button" onClick={() => { setMic(false); setCam(false); void joinRoom(); }}><MonitorUp size={17}/> Use companion mode</button>
                <button type="button" onClick={async () => { await joinRoom(); await toggleShare(); }}><MonitorUp size={17}/> Present</button>
                <button type="button" onClick={() => copyLink(active)}><Copy size={16}/> Copy meeting link</button>
                </div>}
            </section>
          </div>
        </div>
      )}{screen === "room" && active && <div className="meet-call-shell"><header className="meet-call-header"><div className="meet-call-identity"><span className="meet-live-dot"/><div><strong>{active.title}</strong><span>{active.id}</span></div></div><div className="meet-call-status"><span className="meet-live-label">LIVE SESSION</span><span className="meet-duration"><Clock3 size={14}/>{duration}</span><button className="meet-header-icon" onClick={() => copyLink(active)} title="Copy invite link"><Copy size={17}/></button></div></header>

        <div className={`meet-call-main ${panel ? "meet-call-with-panel" : ""}`}><div className="meet-stage"><div className="meet-video-tile">{sharing && <video ref={screenEl} autoPlay muted playsInline className="meet-shared-video"/>}<video ref={videoEl} autoPlay muted playsInline className={`${cam && !!stream?.getVideoTracks().length ? "" : "is-hidden"} ${sharing ? "meet-pip-video" : ""}`}/>{(!cam || !stream?.getVideoTracks().length) && !sharing && <div className="meet-stage-placeholder"><div className="meet-avatar">{(name.trim() || "Y").slice(0, 1).toUpperCase()}</div><strong>{name.trim() || "You"}</strong><span>Camera is turned off</span></div>}<div className="meet-tile-name"><span className="meet-online-dot"/>{name.trim() || "You"} (You){!mic && <MicOff size={14}/>}</div>{recordState === "recording" && <span className="meet-recording"><span/> Recording local media</span>}{sharing && <span className="meet-sharing-label">You are presenting</span>}{reaction && <div className="meet-reaction" onAnimationEnd={() => setReaction("")}>{reaction}</div>}</div><p className="meet-local-disclaimer">Local meeting prototype · no remote connection or synchronized chat</p></div>

          {panel && <aside className="meet-sidepanel"><div className="meet-side-head"><div><span className="meet-eyebrow">MEETING SPACE</span><h3>{panel === "chat" ? "In-call messages" : panel === "people" ? "People" : panel === "details" ? "Meeting details" : "Settings"}</h3></div><button className="meet-header-icon" onClick={() => setPanel(null)} aria-label="Close panel"><X size={19}/></button></div>

            {panel === "chat" && <><div className="meet-chat-messages"><div className="meet-system-message">Messages here stay in this browser. They are not delivered to anyone else.</div>{messages.map(m => <div className="meet-message" key={m.id}><div className="meet-message-avatar">{m.author.charAt(0).toUpperCase()}</div><div><div className="meet-message-meta"><strong>{m.author}</strong><time>{m.at}</time></div><p>{m.text}</p></div></div>)}</div><form className="meet-chat-form" onSubmit={e => { e.preventDefault(); sendMessage(); }}><input value={draft} placeholder="Send a message..." onChange={e => setDraft(e.target.value)}/><button disabled={!draft.trim()} aria-label="Send message"><Send size={18}/></button></form></>}

            {panel === "people" && <div className="meet-panel-content"><div className="meet-panel-stat"><Users size={18}/> In this browser <strong>1</strong></div><div className="meet-person-row"><span className="meet-small-avatar">{(name || "Y").charAt(0).toUpperCase()}</span><div><strong>{name || "You"} (host)</strong><small>Present in local preview</small></div><span className="meet-online-dot"/></div><button className="nm-btn nm-soft meet-panel-wide" onClick={() => copyLink(active)}><Copy size={16}/> Copy invitation</button><p className="meet-small-note">Admitting guests, removing participants and host controls need a real meeting service and authentication.</p></div>}

            {panel === "details" && <div className="meet-panel-content"><div className="meet-detail-row"><small>Meeting name</small><strong>{active.title}</strong></div><div className="meet-detail-row"><small>Meeting code</small><strong>{active.id}</strong></div><div className="meet-detail-row"><small>Meeting URL</small><span className="meet-break-url">{linkFor(active)}</span></div><button className="nm-btn nm-soft meet-panel-wide" onClick={() => copyLink(active)}><Copy size={16}/> Copy meeting link</button><a className="nm-btn nm-soft meet-panel-wide" href={calendarUrl(active)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Add to Google Calendar</a><button className="nm-btn nm-soft meet-panel-wide" onClick={() => exportICS(active)}><Download size={16}/> Export .ics file</button></div>}

            {panel === "settings" && <div className="meet-panel-content"><p className="meet-muted">Choose devices and apply to your local preview.</p><label className="meet-input-label">Microphone<select value={audioDevice} onChange={e => setAudioDevice(e.target.value)}><option value="">System default</option>{devices.filter(d => d.kind === "audioinput").map(d => <option key={`${d.kind}-${d.deviceId || "default"}-${devices.indexOf(d)}`} value={d.deviceId}>{d.label || "Microphone"}</option>)}</select></label><label className="meet-input-label">Camera<select value={videoDevice} onChange={e => setVideoDevice(e.target.value)}><option value="">System default</option>{devices.filter(d => d.kind === "videoinput").map(d => <option key={`${d.kind}-${d.deviceId || "default"}-${devices.indexOf(d)}`} value={d.deviceId}>{d.label || "Camera"}</option>)}</select></label><button className="nm-btn nm-primary meet-panel-wide" onClick={() => getMedia()}><Check size={16}/> Apply devices</button><div className="meet-settings-hint"><ShieldCheck size={18}/> Host permissions and meeting admission rules need a backend. <span className="meet-visually-hidden">{hostOnly ? "host only" : "open"}</span></div><label className="meet-setting-switch"><span>Show host-only option (UI preview)</span><input type="checkbox" checked={hostOnly} onChange={e => setHostOnly(e.target.checked)}/></label></div>}

          </aside>}

        </div>

        <footer className="meet-controls"><div className="meet-control-left"><span className="meet-bottom-time">{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span className="meet-bottom-divider"/><strong>{active.title}</strong></div><div className="meet-controls-center"><button className={`meet-control-btn ${!mic ? "meet-control-off" : ""}`} title={mic ? "Mute microphone" : "Unmute microphone"} onClick={async () => { if (!mic && !stream) await getMedia(true,cam); setMic(v=>!v); }}>{mic ? <Mic size={20}/> : <MicOff size={20}/>}</button><button className={`meet-control-btn ${!cam ? "meet-control-off" : ""}`} title={cam ? "Turn off camera" : "Turn on camera"} onClick={async () => { if (!cam && !stream) await getMedia(mic,true); setCam(v=>!v); }}>{cam ? <Video size={20}/> : <VideoOff size={20}/>}</button><button className={`meet-control-btn ${sharing ? "meet-control-active" : ""}`} title={sharing ? "Stop presenting" : "Present your screen"} onClick={toggleShare}><MonitorUp size={21}/></button><button className={`meet-control-btn ${hand ? "meet-control-active" : ""}`} title="Raise or lower hand" onClick={() => setHand(v=>!v)}><Hand size={20}/></button><div className="meet-reaction-wrap"><button className="meet-control-btn" title="Send reaction" onClick={() => setReaction(v => v ? "" : "👏")}><Smile size={20}/></button><div className="meet-reaction-options"><button title="Clap" onClick={()=>setReaction("👏")}>👏</button><button title="Heart" onClick={()=>setReaction("❤️")}>❤️</button><button title="Celebrate" onClick={()=>setReaction("🎉")}>🎉</button><button title="Thumbs up" onClick={()=>setReaction("👍")}>👍</button></div></div><button className={`meet-control-btn ${recordState === "recording" ? "meet-control-off" : ""}`} title={recordState === "recording" ? "Stop local recording" : "Record local camera and mic"} onClick={toggleRecord}>{recordState === "recording" ? <StopCircle size={20}/> : <span className="meet-record-icon"><span/></span>}</button><button className="meet-control-btn meet-hangup" title="Leave meeting" onClick={leave}><PhoneOff size={23}/></button></div><div className="meet-control-right"><button className={`meet-control-btn ${panel === "details" ? "meet-control-active" : ""}`} title="Meeting details" onClick={() => togglePanel("details")}><Info size={20}/></button><button className={`meet-control-btn ${panel === "people" ? "meet-control-active" : ""}`} title="People" onClick={() => togglePanel("people")}><Users size={20}/><span className="meet-count">1</span></button><button className={`meet-control-btn ${panel === "chat" ? "meet-control-active" : ""}`} title="Chat" onClick={() => togglePanel("chat")}><MessageCircle size={20}/>{messages.length > 0 && <span className="meet-unread">{messages.length}</span>}</button><button className={`meet-control-btn ${panel === "settings" ? "meet-control-active" : ""}`} title="Settings" onClick={() => togglePanel("settings")}><Settings2 size={20}/></button></div></footer>

      </div>}



      {screen === "ended" && <section className="meet-ended"><div className="meet-ended-symbol"><PhoneOff size={39}/></div><span className="meet-eyebrow">MEETING ENDED</span><h1>You left the meeting</h1><p>Thanks for connecting. You can rejoin with the same code or return to your workspace.</p><div className="meet-ended-actions"><button className="nm-btn nm-primary" onClick={() => active && openMeeting(active)}><Video size={18}/> Rejoin</button><button className="nm-btn nm-soft" onClick={() => setScreen("home")}><ArrowLeft size={17}/> Back to home</button></div></section>}



      {showCreate && (

        <div className="meet-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>

          <div className="meet-modal" role="dialog" aria-modal="true" aria-labelledby="meet-modal-title">

            <div className="meet-modal-head">

              <div><span className="meet-eyebrow">CREATE EVENT</span><h2 id="meet-modal-title">Schedule a meeting</h2></div>

              <button className="meet-header-icon" title="Close" onClick={() => setShowCreate(false)}><X size={20}/></button>

            </div>

            <form onSubmit={e => { e.preventDefault(); makeScheduled(); }}>

              <label className="meet-input-label"><span className="meet-field-heading">Meeting title <span className="meet-required">*</span></span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Weekly team sync" required /></label>

              <div className="meet-form-grid">

                <NeumoDateTime label="Start" value={start} onChange={setStart} />

                <NeumoDateTime label="End" value={end} onChange={setEnd} />

              </div>

              <label className="meet-input-label"><span className="meet-field-heading">Invitees' email addresses (optional)</span><input value={guests} onChange={e => setGuests(e.target.value)} placeholder="name\@example.com, teammate\@example.com" /></label>

              <label className="meet-input-label"><span className="meet-field-heading">Description</span><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Agenda, notes, topics..." /></label>

              {formError && <p className="meet-form-error">{formError}</p>}

              <div className="meet-modal-actions">

                <button type="button" className="nm-btn nm-soft" onClick={() => setShowCreate(false)}>Cancel</button>

                <button type="submit" className="nm-btn nm-soft meet-create-button"><CalendarDays size={18}/> Create meeting</button>

              </div>

            </form>

          </div>

        </div>

      )}



    </main>

  );

}
