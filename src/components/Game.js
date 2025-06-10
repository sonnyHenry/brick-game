import React, { useState, useEffect, useRef, useCallback } from 'react';
import Brick from './Brick';
import Ball from './Ball';
import PowerUp from './PowerUp';
import GameOverScreen from './GameOverScreen';
import Leaderboard from './Leaderboard';
import { generateBricks, generateTopRowBricks, moveBricksDown, checkGameOver, generateInitialPowerUps, generateTopRowPowerUps, movePowerUpsDown, calculateLaunchVelocity, createBall, areAllBallsLanded, getLastLandedBallX, cleanupDestroyedBricks, getBrickColorByHealth } from '../utils/gameLogic';
import { detectWallCollision, handleBallBounce, detectContinuousCollision, detectPowerUpCollision } from '../utils/collision';
import { GAME_CONFIG, GAME_STATES, COLLISION_TYPES } from '../utils/constants';
import { playSound, preloadSounds, enableAudio } from '../utils/audio';
import { getScores, addScore } from '../utils/leaderboard';
import { getClampedAimVector } from '../utils/aiming';
import '../styles/Game.css';

const { SPEED: speedConfig } = GAME_CONFIG;

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
  const [speedMultiplier, setSpeedMultiplier] = useState(speedConfig.MULTIPLIERS[0].value);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scores, setScores] = useState([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const isEndingRound = useRef(false);
  const audioInitialized = useRef(false);

  const initializeGame = useCallback((isRestart = false) => {
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
    audioInitialized.current = isRestart ? audioInitialized.current : false;
    setScoreSubmitted(false);
  }, []);

  useEffect(() => {
    preloadSounds(soundList);
    setScores(getScores());
    initializeGame();
  }, [initializeGame]);

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
      const newPowerUps = generateTopRowPowerUps(newTopRowBricks, movedDownBricks);
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
            
            // 增加一个微小的推回，防止小球嵌入方块
            const epsilon = 0.1;
            const norm = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
            if (norm > 0) {
              newBall.x += (newBall.vx / norm) * epsilon;
              newBall.y += (newBall.vy / norm) * epsilon;
            }
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

  const updateBallSpeeds = (newMultiplier) => {
    const newSpeed = speedConfig.BASE * newMultiplier;
    setBalls(prevBalls =>
      prevBalls.map(ball => {
        if (!ball.active) return ball;
        const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        if (currentSpeed === 0) return ball; // 避免除以零
        const speedRatio = newSpeed / currentSpeed;
        return {
          ...ball,
          vx: ball.vx * speedRatio,
          vy: ball.vy * speedRatio,
        };
      })
    );
  };

  const handleSpeedChange = (newMultiplier) => {
    setSpeedMultiplier(newMultiplier);
    if (gameState === GAME_STATES.SHOOTING) {
      updateBallSpeeds(newMultiplier);
    }
  };

  const handleScoreSubmit = (newScore) => {
    addScore(newScore);
    setScores(getScores());
    setScoreSubmitted(true);
    setShowLeaderboard(true);
  };

  const handleCloseLeaderboardAndRestart = () => {
    setShowLeaderboard(false);
    restartGame();
  };

  const handleClick = (e) => {
    if (gameState !== GAME_STATES.AIMING) return;

    // 在用户第一次点击时自动启用音效
    if (!audioInitialized.current) {
      enableAudio();
      audioInitialized.current = true;
    }

    const rect = gameAreaRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    playSound('launch');
    const launchSpeed = speedConfig.BASE * speedMultiplier;
    const velocity = calculateLaunchVelocity(launchPosition, {x: targetX, y: targetY}, launchSpeed);
    for (let i = 0; i < ballCount; i++) {
      setTimeout(() => {
        const newBall = createBall(launchPosition.x, launchPosition.y, velocity.vx, velocity.vy);
        setBalls(prev => [...prev, newBall]);
      }, i * 80);
    }
    setGameState(GAME_STATES.SHOOTING);
    setAimPosition(null);
  };

  const restartGame = () => initializeGame(true);

  const renderAimLine = () => {
    if (!aimPosition || gameState !== GAME_STATES.AIMING) return null;

    // 使用新的工具函数来获取被限制过的方向向量
    const clampedVector = getClampedAimVector(launchPosition, aimPosition, 10);
    
    // 从修正后的向量计算角度
    const angle = Math.atan2(clampedVector.dy, clampedVector.dx) * 180 / Math.PI;
    
    const fixedLength = 150;
    const lineStyle = {
      position: 'absolute',
      left: launchPosition.x,
      top: launchPosition.y - 1, // 减去1/2的高度，使其居中
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
          <div className="speed-controls">
            <span>速度:</span>
            {speedConfig.MULTIPLIERS.map(speed => (
              <button
                key={speed.value}
                className={`speed-button ${speedMultiplier === speed.value ? 'active' : ''}`}
                onClick={() => handleSpeedChange(speed.value)}
              >
                {speed.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLeaderboard(true)} className="leaderboard-button">
            排行榜
          </button>
        </div>
        {gameState === GAME_STATES.GAME_OVER && !scoreSubmitted && (
          <GameOverScreen 
            round={round}
            ballCount={ballCount}
            onSubmit={handleScoreSubmit}
            onRestart={restartGame}
          />
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
        {showLeaderboard && (
          <Leaderboard 
            scores={scores} 
            onClose={gameState === GAME_STATES.GAME_OVER ? handleCloseLeaderboardAndRestart : () => setShowLeaderboard(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default Game; 