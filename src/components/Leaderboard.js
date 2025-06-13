import React from 'react';
import '../styles/Leaderboard.css';

const Leaderboard = ({ scores, onClose }) => {

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-container">
        <h2>排行榜</h2>
        <button onClick={onClose} className="close-button">×</button>
        {scores.length > 0 ? (
          <ul>
            {scores.map((score, index) => (
              <li key={score.id || index} className="leaderboard-item">
                <span className="rank">{index + 1}.</span>
                <span className="name">{String(score.name)}</span>
                <span className="difficulty">{String(score.difficulty)}</span>
                <span className="score">{String(score.score)} 回合</span>
                <span className="date">{formatDate(score.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>还没有记录，快来创造第一个吧！</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 