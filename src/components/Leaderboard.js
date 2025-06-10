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
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>姓名</th>
                <th>回合</th>
                <th>小球数</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id}>
                  <td>{index + 1}</td>
                  <td>{score.name}</td>
                  <td>{score.round}</td>
                  <td>{score.ballCount}</td>
                  <td>{formatDate(score.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>还没有记录，快来创造第一个吧！</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 