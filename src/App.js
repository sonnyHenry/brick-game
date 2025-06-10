import React from 'react';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React 打砖块游戏</h1>
        <p>使用鼠标瞄准并点击发射小球，消除所有砖块！</p>
      </header>
      <main>
        <Game />
      </main>
      <footer className="App-footer">
        <p>游戏说明：每回合结束后砖块下移一行，收集道具可增加小球数量</p>
        <p>砖块到达底部时游戏结束，坚持更多回合获得高分！</p>
      </footer>
    </div>
  );
}

export default App; 