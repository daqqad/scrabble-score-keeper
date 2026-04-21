import { useState, useEffect } from 'react';
import './App.css';

const MAX_PLAYERS = 6;
const SAVE_KEY = 'scrabble-game';

const LETTER_VALUES = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,
};

function nextMult(m) { return m === 1 ? 2 : m === 2 ? 3 : m === 3 ? 0 : 1; }

function letterScore(ch, mult) {
  if (mult === 0) return 0;
  return (LETTER_VALUES[ch.toUpperCase()] ?? 0) * mult;
}

function calcScore(word, mults, wordMult, bingo) {
  const letters = word.toUpperCase().split('');
  const base = letters.reduce((sum, ch, i) => sum + letterScore(ch, mults[i] ?? 1), 0);
  return base * wordMult + (bingo ? 50 : 0);
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// ── Loading screen ─────────────────────────────────────────────────────────

function LoadingScreen({ error }) {
  return (
    <div className="setup">
      <h1>Scrabble Score Keeper</h1>
      {error
        ? <p className="load-error">{error}</p>
        : <p className="dict-loading-hint">Loading game…</p>}
    </div>
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────

function Setup({ onStart, onResume, savedGame, wordSetReady }) {
  const [names, setNames] = useState(['', '']);

  const setName = (i, val) => setNames(n => n.map((x, j) => j === i ? val : x));
  const addPlayer = () => setNames(n => [...n, '']);
  const removePlayer = (i) => setNames(n => n.filter((_, j) => j !== i));

  const valid = names.length >= 2 && names.every(n => n.trim());

  return (
    <div className="setup">
      <h1>Scrabble Score Keeper</h1>

      {savedGame && (
        <div className="resume-card">
          <div className="resume-info">
            <span className="resume-label">Saved game</span>
            <span className="resume-players">{savedGame.players.join(', ')}</span>
            <span className="resume-meta">
              {savedGame.turns?.length ?? 0} turns
              {savedGame.savedAt ? ` · ${formatDate(savedGame.savedAt)}` : ''}
            </span>
          </div>
          <button className="resume-btn" onClick={onResume}>Resume</button>
        </div>
      )}

      <p className="setup-section-label">{savedGame ? 'Or start a new game:' : 'Enter player names:'}</p>

      <div className="player-inputs">
        {names.map((name, i) => (
          <div key={i} className="player-row">
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={e => setName(i, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && valid && onStart(names.map(n => n.trim()))}
              maxLength={20}
              autoFocus={i === 0 && !savedGame}
            />
            {names.length > 2 && (
              <button className="remove-btn" onClick={() => removePlayer(i)}>×</button>
            )}
          </div>
        ))}
      </div>
      {names.length < MAX_PLAYERS && (
        <button className="add-player-btn" onClick={addPlayer}>+ Add Player</button>
      )}
      <button className="start-btn" disabled={!valid} onClick={() => onStart(names.map(n => n.trim()))}>
        {wordSetReady ? 'Start Game' : 'Loading dictionary…'}
      </button>
      {!wordSetReady && <p className="dict-loading-hint">Loading word list in the background…</p>}
    </div>
  );
}

// ── Tile ───────────────────────────────────────────────────────────────────

function Tile({ letter, mult, onClick }) {
  const raw = LETTER_VALUES[letter.toUpperCase()] ?? 0;
  const multClass = mult === 0 ? 'tile-blank' : mult === 2 ? 'tile-dl' : mult === 3 ? 'tile-tl' : 'tile-normal';
  const badge = mult === 0 ? 'BL' : mult === 2 ? 'DL' : mult === 3 ? 'TL' : null;
  return (
    <button className={`tile ${multClass}`} onClick={onClick} title="Tap to cycle: ×1 → DL → TL → Blank">
      {badge && <span className="tile-badge">{badge}</span>}
      <span className="tile-letter">{letter.toUpperCase()}</span>
      <span className="tile-value">{raw}</span>
    </button>
  );
}

// ── TurnEntry modal ────────────────────────────────────────────────────────

function TurnEntry({ playerName, wordSet, onAdd, onCancel }) {
  const [word, setWord] = useState('');
  const [mults, setMults] = useState([]);
  const [wordMult, setWordMult] = useState(1);
  const [bingo, setBingo] = useState(false);

  const letters = word.toUpperCase().replace(/[^A-Z]/g, '').split('').filter(Boolean);

  useEffect(() => {
    setMults(prev => {
      const next = prev.slice(0, letters.length);
      while (next.length < letters.length) next.push(1);
      return next;
    });
  }, [letters.length]);

  const cycleMult = (i) => setMults(prev => prev.map((m, j) => j === i ? nextMult(m) : m));

  const useBingo = bingo && letters.length >= 7;
  const score = letters.length > 0 ? calcScore(letters.join(''), mults, wordMult, useBingo) : 0;
  const inDict = wordSet ? wordSet.has(letters.join('').toLowerCase()) : null;

  const submit = (force = false) => {
    if (letters.length === 0) return;
    onAdd({ word: letters.join(''), mults: [...mults], wordMult, bingo: useBingo, score, dictValid: inDict === true || force });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2 className="modal-title">{playerName}'s turn</h2>
        <input
          className="word-input"
          type="text"
          placeholder="Type word played…"
          value={word}
          onChange={e => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
          autoFocus spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="characters"
        />
        {letters.length > 0 && (
          <div className="tiles-row">
            {letters.map((ch, i) => (
              <Tile key={i} letter={ch} mult={mults[i] ?? 1} onClick={() => cycleMult(i)} />
            ))}
          </div>
        )}
        {letters.length > 0 && (
          <div className="mult-controls">
            <div className="mult-group">
              <span className="mult-label">Word:</span>
              {[1, 2, 3].map(m => (
                <button key={m} className={`word-mult-btn ${wordMult === m ? 'active' : ''}`} onClick={() => setWordMult(m)}>
                  {m === 1 ? '×1' : m === 2 ? 'DW' : 'TW'}
                </button>
              ))}
            </div>
            {letters.length >= 7 && (
              <label className="bingo-label">
                <input type="checkbox" checked={bingo} onChange={e => setBingo(e.target.checked)} />
                Bingo +50
              </label>
            )}
          </div>
        )}
        {letters.length > 0 && <div className="score-preview">{score} pts</div>}
        {letters.length >= 2 && (
          <div className="dict-status">
            {inDict === null && <span className="dict-idle">Dictionary loading…</span>}
            {inDict === true && <span className="dict-valid">✓ Valid word</span>}
            {inDict === false && <span className="dict-invalid">✗ Not in dictionary</span>}
          </div>
        )}
        {letters.length > 0 && <p className="tile-hint">Tap a tile to cycle: ×1 → DL → TL → Blank</p>}
        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          {inDict === false
            ? <button onClick={() => submit(true)} className="submit-btn add-anyway">Add Anyway</button>
            : <button onClick={() => submit()} disabled={letters.length === 0} className="submit-btn">Add Turn</button>}
        </div>
      </div>
    </div>
  );
}

// ── Share modal ────────────────────────────────────────────────────────────

function ShareModal({ url, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Share Game</h2>
        <p className="modal-body">Anyone with this link can open and continue the game on any device.</p>
        <div className="share-url-box">{url}</div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">Done</button>
          <button onClick={copy} className="submit-btn">
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Game ───────────────────────────────────────────────────────────────────

function Game({ players, turns, setTurns, gameId, onShare, wordSet, onNewGame }) {
  const [entering, setEntering] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const currentIdx = turns.length % players.length;
  const totals = players.map((_, pi) =>
    turns.filter(t => t.playerIdx === pi).reduce((sum, t) => sum + t.score, 0)
  );
  const leader = totals.indexOf(Math.max(...totals));

  const addTurn = (turn) => {
    setTurns(t => [...t, { ...turn, playerIdx: currentIdx }]);
    setEntering(false);
  };
  const passTurn = () => setTurns(t => [...t, { word: null, score: 0, playerIdx: currentIdx, pass: true }]);
  const deleteTurn = (idx) => setTurns(t => t.filter((_, i) => i !== idx));

  const handleShare = async () => {
    if (gameId) {
      setShareUrl(`${window.location.origin}/?game=${gameId}`);
      return;
    }
    setSharing(true);
    try {
      const url = await onShare();
      setShareUrl(url);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="game">
      <div className="player-cards-row">
        {players.map((p, i) => (
          <div key={i} className={`player-card ${i === currentIdx ? 'current' : ''} ${i === leader && turns.length > 0 ? 'leading' : ''}`}>
            <div className="pc-name">{p}{i === leader && turns.length > 0 ? ' 👑' : ''}</div>
            <div className="pc-score">{totals[i]}</div>
          </div>
        ))}
      </div>

      <div className="turn-label">
        {players[currentIdx]}'s turn
        {gameId && <span className="synced-badge" title="Auto-saving to cloud">☁</span>}
      </div>

      <div className="turn-history">
        {turns.length === 0 && <p className="empty-hint">No plays yet — press Play Word to start!</p>}
        {[...turns].reverse().map((turn, ri) => {
          const idx = turns.length - 1 - ri;
          return (
            <div key={idx} className="turn-item">
              <span className="turn-player-tag">{players[turn.playerIdx]}</span>
              {turn.pass
                ? <span className="turn-word muted">passed</span>
                : <>
                    <span className="turn-word">{turn.word}</span>
                    {!turn.dictValid && <span className="dict-warn" title="Not in dictionary">⚠</span>}
                    {turn.bingo && <span className="bingo-tag">BINGO</span>}
                  </>}
              <span className="turn-score">+{turn.score}</span>
              <button className="delete-turn-btn" onClick={() => deleteTurn(idx)}>×</button>
            </div>
          );
        })}
      </div>

      <div className="game-footer">
        <button className="new-game-btn" onClick={() => setConfirmReset(true)}>New Game</button>
        <button className="pass-btn" onClick={passTurn}>Pass</button>
        <button className="share-btn" onClick={handleShare} disabled={sharing}>
          {sharing ? '…' : '🔗 Share'}
        </button>
        <button className="play-btn" onClick={() => setEntering(true)}>Play Word</button>
      </div>

      {entering && (
        <TurnEntry playerName={players[currentIdx]} wordSet={wordSet} onAdd={addTurn} onCancel={() => setEntering(false)} />
      )}

      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />}

      {confirmReset && (
        <div className="overlay">
          <div className="modal">
            <h2 className="modal-title">Start a new game?</h2>
            <p className="modal-body">This will clear all scores.</p>
            <div className="modal-actions">
              <button onClick={() => setConfirmReset(false)} className="cancel-btn">Cancel</button>
              <button onClick={onNewGame} className="submit-btn danger">New Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('init'); // init | setup | playing
  const [loadError, setLoadError] = useState(null);
  const [players, setPlayers] = useState(null);
  const [turns, setTurns] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [wordSet, setWordSet] = useState(null);
  const [savedGame, setSavedGame] = useState(() => loadSave());

  // On mount: check for ?game= param and load from KV if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('game');
    if (!id) { setScreen('setup'); return; }

    fetch(`/api/game/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        setPlayers(data.players);
        setTurns(data.turns ?? []);
        setGameId(id);
        setScreen('playing');
      })
      .catch(() => {
        setLoadError('Game link not found or expired. Start a new game below.');
        window.history.replaceState(null, '', window.location.pathname);
        setScreen('setup');
      });
  }, []);

  // Auto-save to localStorage whenever game state changes
  useEffect(() => {
    if (!players) return;
    const save = { players, turns, savedAt: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    setSavedGame(save);
  }, [players, turns]);

  // Auto-sync to KV on every turn when a game link exists
  useEffect(() => {
    if (!players || !gameId) return;
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gameId, players, turns }),
    }).catch(() => {});
  }, [turns, gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load word list once
  useEffect(() => {
    fetch('/words.txt')
      .then(r => r.text())
      .then(text => setWordSet(new Set(text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean))))
      .catch(() => setWordSet(new Set()));
  }, []);

  const startGame = (playerNames) => {
    setPlayers(playerNames);
    setTurns([]);
    setGameId(null);
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('playing');
  };

  const resumeLocal = () => {
    const save = loadSave();
    if (!save) return;
    setPlayers(save.players);
    setTurns(save.turns ?? []);
    setGameId(null);
    setScreen('playing');
  };

  // Called by Game when Share is tapped for the first time (no gameId yet)
  const createShare = async () => {
    const id = generateId();
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, players, turns }),
    });
    setGameId(id);
    const url = `${window.location.origin}/?game=${id}`;
    window.history.replaceState(null, '', `?game=${id}`);
    return url;
  };

  const endGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setSavedGame(null);
    setPlayers(null);
    setTurns([]);
    setGameId(null);
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('setup');
  };

  if (screen === 'init') return <LoadingScreen />;
  if (screen === 'setup') {
    return (
      <Setup
        onStart={startGame}
        onResume={resumeLocal}
        savedGame={savedGame}
        wordSetReady={wordSet !== null}
        loadError={loadError}
      />
    );
  }
  return (
    <Game
      players={players}
      turns={turns}
      setTurns={setTurns}
      gameId={gameId}
      onShare={createShare}
      wordSet={wordSet}
      onNewGame={endGame}
    />
  );
}
