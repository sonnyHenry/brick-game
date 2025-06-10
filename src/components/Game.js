import React, { useState, useEffect, useRef, useCallback } from 'react';
import Brick from './Brick';
import Ball from './Ball';
import PowerUp from './PowerUp';
import { generateBricks, generateTopRowBricks, moveBricksDown, checkGameOver, generateInitialPowerUps, generateTopRowPowerUps, movePowerUpsDown, calculateLaunchVelocity, createBall, areAllBallsLanded, getLastLandedBallX, cleanupDestroyedBricks, getBrickColorByHealth } from '../utils/gameLogic';
import { detectWallCollision, handleBallBounce, detectContinuousCollision, detectPowerUpCollision } from '../utils/collision';
import { GAME_CONFIG, GAME_STATES, COLLISION_TYPES } from '../utils/constants';
import { playSound, preloadSounds, enableAudio } from '../utils/audio';
import '../styles/Game.css';

const soundList = [
  { name: 'hit_low', src: '/sounds/hit_low.wav' },
  { name: 'hit_medium', src: '/sounds/hit_medium.wav' },
  { name: 'hit_high', src: '/sounds/hit_high.wav' },
  { name: 'bounce', src: '/sounds/bounce.wav' },
  { name: 'powerup', src: '/sounds/powerup.wav' },
  { name: 'game_over', src: '/sounds/game_over.wav' },
  { name: 'launch', src: '/sounds/launch.wav' },
];

const Game = () => {
  const [world, setWorld] = useState({ bricks: [], powerUps: [] });
  const [balls, setBalls] = useState([]);
  const [round, setRound] = useState(1);
  const [ballCount, setBallCount] = useState(1);
  const [nextBallCount, setNextBallCount] = useState(1);
  const [gameState, setGameState] = useState(GAME_STATES.READY);
  const [roundEndState, setRoundEndState] = useState(null);
  const [launchPosition, setLaunchPosition] = useState({ x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS });
  const [aimPosition, setAimPosition] = useState(null);
  const [ballSpeed, setBallSpeed] = useState(500);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const isEndingRound = useRef(false);

  const initializeGame = useCallback(() => {
    const initialBricks = generateBricks();
    const initialPowerUps = generateInitialPowerUps(initialBricks);
    setWorld({ bricks: initialBricks, powerUps: initialPowerUps });
    setBalls([]);
    setRound(1);
    setBallCount(1);
    setNextBallCount(1);
    setLaunchPosition({ x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS - 5 });
    setGameState(GAME_STATES.READY);
    setRoundEndState(null);
    isEndingRound.current = false;
  }, []);

  useEffect(() => {
    preloadSounds(soundList);
    initializeGame();
  }, [initializeGame]);

  const handleEnableAudio = () => {
    enableAudio();
    setAudioEnabled(true);
  };

  const endRound = useCallback((finalBalls) => {
    console.log(`EndRound Triggered`);
    const newLaunchX = getLastLandedBallX(finalBalls);
    setLaunchPosition({
      x: newLaunchX,
      y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS
    });

    setWorld(prevWorld => {
      const cleanedBricks = cleanupDestroyedBricks(prevWorld.bricks);
      const movedDownBricks = moveBricksDown(cleanedBricks);

      if (checkGameOver(movedDownBricks)) {
        console.log('EndRound: Game Over detected, setting signal.');
        setRoundEndState('GAME_OVER');
        const movedPowerUps = movePowerUpsDown(prevWorld.powerUps);
        return { bricks: movedDownBricks, powerUps: movedPowerUps };
      }

      console.log('EndRound: Continuing, setting signal.');
      const movedPowerUps = movePowerUpsDown(prevWorld.powerUps);
      const newTopRowBricks = generateTopRowBricks(round + 1);
      const newPowerUps = generateTopRowPowerUps(newTopRowBricks);
      const finalBricks = [...newTopRowBricks, ...movedDownBricks];
      const finalPowerUps = [...movedPowerUps, ...newPowerUps];
      setRoundEndState('CONTINUE');
      return { bricks: finalBricks, powerUps: finalPowerUps };
    });
  }, [round]);

  const gameLoop = useCallback((currentTime) => {
    if (gameState !== GAME_STATES.SHOOTING) {
      return;
    }
    
    const deltaTime = (currentTime - lastFrameTime.current) / 1000;
    lastFrameTime.current = currentTime;

    setBalls(prevBalls => {
      const updatedBalls = prevBalls.map(ball => {
        if (!ball.active) return ball;
        const newBall = { ...ball, x: ball.x + ball.vx * deltaTime, y: ball.y + ball.vy * deltaTime };
        
        const wallCollision = detectWallCollision(newBall);
        if (wallCollision !== COLLISION_TYPES.NONE) {
          if (wallCollision === COLLISION_TYPES.BOTTOM) {
            if (newBall.active) {
              newBall.landingTime = performance.now();
            }
            newBall.active = false;
            newBall.y = GAME_CONFIG.CANVAS_HEIGHT - newBall.radius;
          } else {
            playSound('bounce');
            handleBallBounce(newBall, wallCollision);
            const epsilon = 1;
            if (wallCollision === COLLISION_TYPES.LEFT) newBall.x = newBall.radius + epsilon;
            if (wallCollision === COLLISION_TYPES.RIGHT) newBall.x = GAME_CONFIG.CANVAS_WIDTH - newBall.radius - epsilon;
            if (wallCollision === COLLISION_TYPES.TOP) newBall.y = newBall.radius + epsilon;
          }
        }

        setWorld(prevWorld => {
          let firstCollision = null;

          const updatedBricks = prevWorld.bricks.map(brick => {
            if (brick.destroyed) return brick;
            
            const collision = detectContinuousCollision(ball, newBall, brick);
            
            if (collision) {
              // 播放音效并更新砖块状态
              if (brick.health <= 10) {
                playSound('hit_low');
              } else if (brick.health <= 20) {
                playSound('hit_medium');
              } else {
                playSound('hit_high');
              }

              const updatedBrick = { ...brick, health: brick.health - 1 };
              if (updatedBrick.health <= 0) {
                updatedBrick.destroyed = true;
              } else {
                updatedBrick.color = getBrickColorByHealth(updatedBrick.health);
              }

              // 记录下时间最早（t最小）的碰撞用于物理反弹
              if (!firstCollision || collision.t < firstCollision.t) {
                firstCollision = collision;
              }
              
              return updatedBrick;
            }
            return brick;
          });
          
          // 如果发生了至少一次碰撞，只处理第一次碰撞的物理反弹
          if (firstCollision) {
            handleBallBounce(newBall, firstCollision.type);
            newBall.x = firstCollision.x;
            newBall.y = firstCollision.y;
          }

          const updatedPowerUps = prevWorld.powerUps.map(powerUp => {
            if (powerUp.collected) return powerUp;
            if (detectPowerUpCollision(ball, newBall, powerUp)) {
              playSound('powerup');
              setNextBallCount(prev => prev + 1);
              return { ...powerUp, collected: true };
            }
            return powerUp;
          });
          return { bricks: updatedBricks, powerUps: updatedPowerUps };
        });
        return newBall;
      });

      if (areAllBallsLanded(updatedBalls) && !isEndingRound.current) {
        isEndingRound.current = true;
        setTimeout(() => endRound(updatedBalls), 500);
      }
      return updatedBalls;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, endRound]);

  useEffect(() => {
    if (gameState === GAME_STATES.SHOOTING) {
      lastFrameTime.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
  }, [gameState, gameLoop]);
  
  useEffect(() => {
    if (!roundEndState) return;

    if (roundEndState === 'GAME_OVER') {
      console.log("Effect: Game Over");
      playSound('game_over');
      setGameState(GAME_STATES.GAME_OVER);
    } else if (roundEndState === 'CONTINUE') {
      console.log("Effect: Continue to next round");
      setRound(prev => prev + 1);
      setNextBallCount(prev => {
        setBallCount(prev);
        return prev;
      });
      setBalls([]);
      setTimeout(() => {
        setGameState(GAME_STATES.READY);
        isEndingRound.current = false;
      }, 100);
    }
    setRoundEndState(null);
  }, [roundEndState]);

  const handleMouseMove = (e) => {
    if (gameState !== GAME_STATES.READY && gameState !== GAME_STATES.AIMING) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setAimPosition({ x: mouseX, y: mouseY });
    if (gameState === GAME_STATES.READY) {
      setGameState(GAME_STATES.AIMING);
    }
  };

  const handleClick = (e) => {
    if (gameState !== GAME_STATES.AIMING) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    playSound('launch');
    const velocity = calculateLaunchVelocity(launchPosition, {x: targetX, y: targetY}, ballSpeed);
    for (let i = 0; i < ballCount; i++) {
      setTimeout(() => {
        const newBall = createBall(launchPosition.x, launchPosition.y, velocity.vx, velocity.vy);
        setBalls(prev => [...prev, newBall]);
      }, i * 80);
    }
    setGameState(GAME_STATES.SHOOTING);
    setAimPosition(null);
  };

  const restartGame = () => initializeGame();

  const renderAimLine = () => {
    if (!aimPosition || gameState !== GAME_STATES.AIMING) return null;
    const dx = aimPosition.x - launchPosition.x;
    const dy = aimPosition.y - launchPosition.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const fixedLength = 150;
    const lineStyle = {
      position: 'absolute',
      left: launchPosition.x,
      top: launchPosition.y - 1,
      width: fixedLength,
      height: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      pointerEvents: 'none',
      zIndex: 1,
      borderRadius: '1px'
    };
    return <div style={lineStyle} />;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-stats">
          <span>回合: {round}</span>
          <span>小球数: {ballCount}</span>
          <span>下次小球数: {nextBallCount}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>速度:</span>
            <select 
              value={ballSpeed}
              onChange={(e) => setBallSpeed(parseInt(e.target.value) || 500)}
              style={{
                width: '70px',
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                color: '#00ff00',
                fontSize: '14px',
                textAlign: 'center'
              }}
              disabled={gameState === GAME_STATES.SHOOTING}
            >
              <option value="500">500</option>
              <option value="900">900</option>
              <option value="1300">1300</option>
            </select>
          </div>
          {!audioEnabled && (
            <button 
              onClick={handleEnableAudio}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 165, 0, 0.8)',
                border: '1px solid #ffa500',
                borderRadius: '4px',
                color: '#000',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              启用音效
            </button>
          )}
        </div>
        {gameState === GAME_STATES.GAME_OVER && (
          <button className="restart-button" onClick={restartGame}>
            重新开始
          </button>
        )}
      </div>
      
      <div 
        ref={gameAreaRef}
        className="game-area"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          width: GAME_CONFIG.CANVAS_WIDTH,
          height: GAME_CONFIG.CANVAS_HEIGHT,
          position: 'relative',
          backgroundColor: '#000',
          border: '2px solid #333',
          cursor: gameState === GAME_STATES.AIMING ? 'crosshair' : 'default'
        }}
      >
        {world.bricks.map(brick => <Brick key={brick.id} brick={brick} />)}
        {balls.map(ball => <Ball key={ball.id} ball={ball} />)}
        {world.powerUps.map(powerUp => <PowerUp key={powerUp.id} powerUp={powerUp} />)}
        {renderAimLine()}
        <div
          style={{
            position: 'absolute',
            left: launchPosition.x - 5,
            top: launchPosition.y - 5,
            width: 10,
            height: 10,
            backgroundColor: 'white',
            borderRadius: '50%',
            zIndex: 15
          }}
        />
        {gameState === GAME_STATES.GAME_OVER && (
          <div className="game-over-overlay">
            <div className="game-over-message">
              <h2>游戏结束！</h2>
              <p>坚持了 {round} 回合</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game; 