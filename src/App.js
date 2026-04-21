import { useState } from 'react';
import './App.css';

const MAX_PLAYERS = 6;

function Setup({ onStart }) {
  const [names, setNames] = useState(['', '']);

  const setName = (i, val) => setNames(n => n.map((x, j) => j === i ? val : x));
  const addPlayer = () => setNames(n => [...n, '']);
  const removePlayer = (i) => setNames(n => n.filter((_, j) => j !== i));

  const valid = names.length >= 2 && names.every(n => n.trim());

  return (
    <div className="setup">
      <h1>Scrabble Score Keeper</h1>
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
              autoFocus={i === 0}
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
        Start Game
      </button>
    </div>
  );
}

function ScoreInput({ players, onSubmit, onCancel, editingRound }) {
  const [scores, setScores] = useState(() => players.map(() => ''));

  const setScore = (i, val) => {
    if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
      setScores(s => s.map((x, j) => j === i ? val : x));
    }
  };

  const allFilled = scores.every(s => s !== '' && s !== '-');

  const handleSubmit = () => {
    if (!allFilled) return;
    onSubmit(scores.map(Number));
  };

  return (
    <div className="score-input-overlay">
      <div className="score-input-card">
        <h2>{editingRound != null ? `Edit Round ${editingRound + 1}` : 'Enter Scores'}</h2>
        {players.map((p, i) => (
          <div key={i} className="score-row">
            <label>{p}</label>
            <input
              type="number"
              value={scores[i]}
              onChange={e => setScore(i, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && allFilled && handleSubmit()}
              autoFocus={i === 0}
            />
          </div>
        ))}
        <div className="score-input-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSubmit} disabled={!allFilled} className="submit-btn">
            {editingRound != null ? 'Save' : 'Add Round'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Game({ players, onNewGame }) {
  const [rounds, setRounds] = useState([]);
  const [entering, setEntering] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const totals = players.map((_, pi) => rounds.reduce((sum, r) => sum + r[pi], 0));
  const leader = totals.indexOf(Math.max(...totals));

  const addRound = (scores) => {
    setRounds(r => [...r, scores]);
    setEntering(false);
  };

  const editRound = (scores) => {
    setRounds(r => r.map((row, i) => i === editingIdx ? scores : row));
    setEditingIdx(null);
  };

  const deleteRound = (idx) => {
    setRounds(r => r.filter((_, i) => i !== idx));
  };

  return (
    <div className="game">
      <div className="game-header">
        <h1>Scrabble</h1>
        <button className="new-game-btn" onClick={() => setConfirmReset(true)}>New Game</button>
      </div>

      <div className="scoreboard">
        <table>
          <thead>
            <tr>
              <th className="round-col">Round</th>
              {players.map((p, i) => (
                <th key={i} className={i === leader && rounds.length > 0 ? 'leading' : ''}>
                  {p}
                  {i === leader && rounds.length > 0 ? ' 👑' : ''}
                </th>
              ))}
              <th className="action-col"></th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, ri) => (
              <tr key={ri} onClick={() => setEditingIdx(ri)} className="round-row">
                <td className="round-col">{ri + 1}</td>
                {round.map((score, pi) => (
                  <td key={pi} className={score < 0 ? 'negative' : ''}>{score}</td>
                ))}
                <td className="action-col">
                  <button className="delete-round-btn" onClick={e => { e.stopPropagation(); deleteRound(ri); }}>×</button>
                </td>
              </tr>
            ))}
            {rounds.length > 0 && (
              <tr className="totals-row">
                <td className="round-col">Total</td>
                {totals.map((t, i) => (
                  <td key={i} className={i === leader ? 'leading' : ''}>{t}</td>
                ))}
                <td className="action-col"></td>
              </tr>
            )}
          </tbody>
        </table>

        {rounds.length === 0 && (
          <p className="empty-hint">No rounds yet — add the first one!</p>
        )}
      </div>

      <button className="add-round-btn" onClick={() => setEntering(true)}>+ Add Round</button>

      {(entering || editingIdx != null) && (
        <ScoreInput
          players={players}
          onSubmit={editingIdx != null ? editRound : addRound}
          onCancel={() => { setEntering(false); setEditingIdx(null); }}
          editingRound={editingIdx}
        />
      )}

      {confirmReset && (
        <div className="score-input-overlay">
          <div className="score-input-card">
            <h2>Start a new game?</h2>
            <p>This will clear all scores.</p>
            <div className="score-input-actions">
              <button onClick={() => setConfirmReset(false)} className="cancel-btn">Cancel</button>
              <button onClick={onNewGame} className="submit-btn danger">New Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState(null);

  if (!players) return <Setup onStart={setPlayers} />;
  return <Game players={players} onNewGame={() => setPlayers(null)} />;
}
