import React from 'react';
import { DIFFICULTIES } from '../utils/constants';
import '../styles/StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  return (
    <div className="start-screen-overlay">
      <div className="start-screen-container">
        <h1>选择游戏难度</h1>
        <div className="difficulty-buttons">
          <button 
            className="difficulty-button medium"
            onClick={() => onStartGame(DIFFICULTIES.MEDIUM)}
          >
            {DIFFICULTIES.MEDIUM}
          </button>
          <button 
            className="difficulty-button hard"
            onClick={() => onStartGame(DIFFICULTIES.HARD)}
          >
            {DIFFICULTIES.HARD}
          </button>
        </div>
        <div className="instructions">
          <h2>游戏说明</h2>
          <p>移动鼠标进行瞄准，点击发射小球。</p>
          <p>收集黄色圆形道具可以增加下一回合的小球数量。</p>
          <p>当砖块触及底部时，游戏结束。</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen; 