import React, { useState } from 'react';
import '../styles/GameOverScreen.css';

const GameOverScreen = ({ round, ballCount, onSubmit, onRestart }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name, round, ballCount });
    }
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-message">
        <h2>游戏结束！</h2>
        <p>你坚持了 {round} 回合</p>
        <form onSubmit={handleSubmit} className="score-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入你的名字"
            maxLength="10"
            required
          />
          <button type="submit">记录分数</button>
        </form>
        <button onClick={onRestart} className="restart-button-gameover">
          重新开始
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen; 