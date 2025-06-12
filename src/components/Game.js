import React, { useState, useEffect, useRef, useCallback } from 'react';
import Brick from './Brick';
import Ball from './Ball';
import PowerUp from './PowerUp';
import GameOverScreen from './GameOverScreen';
import Leaderboard from './Leaderboard';
import StartScreen from './StartScreen';
import { generateBricks, generateTopRowBricks, moveBricksDown, checkGameOver, generateInitialPowerUps, generateTopRowPowerUps, movePowerUpsDown, calculateLaunchVelocity, createBall, areAllBallsLanded, getLastLandedBallX, cleanupDestroyedBricks, getBrickColorByHealth, generateSafetyNetPowerUps } from '../utils/gameLogic';
import { detectWallCollision, handleBallBounce, detectContinuousCollision, detectPowerUpCollision } from '../utils/collision';
import { GAME_CONFIG, GAME_STATES, COLLISION_TYPES, DIFFICULTIES, DIFFICULTY_SETTINGS } from '../utils/constants';
import { playSound, preloadSounds, enableAudio } from '../utils/audio';
import { getScores, addScore } from '../utils/leaderboard';
import { getClampedAimVector } from '../utils/aiming';
import '../styles/Game.css';

const { SPEED: speedConfig } = GAME_CONFIG;

GAME_STATES.PRE_GAME = 'preGame';

const Game = () => {
  const [world, setWorld] = useState({ bricks: [], powerUps: [] });
  const [balls, setBalls] = useState([]);
  const [round, setRound] = useState(1);
  const [ballCount, setBallCount] = useState(1);
  const [nextBallCount, setNextBallCount] = useState(1);
  const [gameState, setGameState] = useState(GAME_STATES.PRE_GAME);
  const [difficulty, setDifficulty] = useState(null);
  const [roundEndSignal, setRoundEndSignal] = useState(null);

  const [launchPosition, setLaunchPosition] = useState({ x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS });
  const [aimPosition, setAimPosition] = useState(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(speedConfig.DEFAULT);

  const [scores, setScores] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [roundsSinceLastPowerUp, setRoundsSinceLastPowerUp] = useState(0);

  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const isEndingRound = useRef(false);
  const audioInitialized = useRef(false);

  const initializeGame = useCallback(() => {
    if (!difficulty) return;

    const initialBricks = generateBricks();
    const initialPowerUps = generateInitialPowerUps(initialBricks, difficulty);

    setWorld({ bricks: initialBricks, powerUps: initialPowerUps });
    setBalls([]);
    setRound(1);
    const initialBallCount = 1; // 强制初始小球为1
    setBallCount(initialBallCount);
    setNextBallCount(initialBallCount);
    setLaunchPosition({ x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS - 5 });
    setGameState(GAME_STATES.READY);
    setRoundEndSignal(null);
    isEndingRound.current = false;
    audioInitialized.current = false;
    setScoreSubmitted(false);
    setRoundsSinceLastPowerUp(0);
    setScores(getScores());
  }, [difficulty]);
  
  const handleStartGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
  };
  
  useEffect(() => {
    if (difficulty) {
      initializeGame();
    }
  }, [difficulty, initializeGame]);

  const endRound = useCallback((finalBalls) => {
    console.log(`EndRound Triggered`);
    setRoundEndSignal({ finalBalls });
  }, []);

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
    if (!roundEndSignal) return;

    const { finalBalls } = roundEndSignal;

    // 1. 更新发射点位置
    const newLaunchX = getLastLandedBallX(finalBalls);
    setLaunchPosition({
      x: newLaunchX,
      y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS
    });

    // 2. 计算下一回合的砖块和道具
    const cleanedBricks = cleanupDestroyedBricks(world.bricks);
    const movedDownBricks = moveBricksDown(cleanedBricks);

    // 检查游戏是否结束
    if (checkGameOver(movedDownBricks)) {
      console.log("Effect: Game Over");
      playSound('game_over');
      setWorld({ 
        bricks: movedDownBricks, 
        powerUps: movePowerUpsDown(world.powerUps) 
      });
      setGameState(GAME_STATES.GAME_OVER);
      setRoundEndSignal(null); // 重置信号
      return;
    }
    
    // 如果游戏继续
    const movedPowerUps = movePowerUpsDown(world.powerUps);
    const newTopRowBricks = generateTopRowBricks(round + 1, difficulty);
    const { newPowerUps, powerUpWasGenerated } = generateTopRowPowerUps(newTopRowBricks, movedDownBricks, roundsSinceLastPowerUp, difficulty);

    let safetyNetPowerUps = [];
    const nextRoundNumber = round + 1;
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];

    // 3. 检查并应用兜底机制
    if (nextRoundNumber % difficultySettings.SAFETY_NET.GROWTH_INTERVAL === 0) {
      const { MIN_BALLS_BASE, GROWTH_INTERVAL } = difficultySettings.SAFETY_NET;
      const minimumBallCount = MIN_BALLS_BASE + Math.floor(nextRoundNumber / GROWTH_INTERVAL);
      
      if (nextBallCount < minimumBallCount) {
        const powerUpsToSpawn = minimumBallCount - nextBallCount;
        console.log(`[兜底机制触发] 回合 ${nextRoundNumber}: 生成 ${powerUpsToSpawn} 个追赶道具。`);
        const allCurrentBricks = [...newTopRowBricks, ...movedDownBricks];
        safetyNetPowerUps = generateSafetyNetPowerUps(powerUpsToSpawn, allCurrentBricks);
      }
    }

    // 4. 批量更新所有状态
    setWorld({
      bricks: [...newTopRowBricks, ...movedDownBricks],
      powerUps: [...movedPowerUps, ...newPowerUps, ...safetyNetPowerUps]
    });

    if (powerUpWasGenerated || safetyNetPowerUps.length > 0) {
      setRoundsSinceLastPowerUp(0);
    } else {
      setRoundsSinceLastPowerUp(prev => prev + 1);
    }

    setRound(nextRoundNumber);
    setNextBallCount(prev => {
      setBallCount(prev);
      return prev;
    });
    setBalls([]);
    
    // 5. 准备下一回合
    setTimeout(() => {
      setGameState(GAME_STATES.READY);
      isEndingRound.current = false;
    }, 100);

    // 6. 重置信号
    setRoundEndSignal(null);

  }, [roundEndSignal, round, roundsSinceLastPowerUp, world.bricks, world.powerUps, nextBallCount, difficulty]);

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

  const handleScoreSubmit = (name) => {
    addScore({ name, score: round, difficulty });
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

  const restartGame = () => {
    setDifficulty(null);
    setGameState(GAME_STATES.PRE_GAME);
  };

  const renderAimLine = () => {
    if (!aimPosition || gameState !== GAME_STATES.AIMING) return null;

    // 使用新的工具函数来获取被限制过的方向向量
    const clampedVector = getClampedAimVector(launchPosition, aimPosition);
    
    // 从修正后的向量计算角度
    const angle = Math.atan2(clampedVector.dy, clampedVector.dx) * 180 / Math.PI;
    
    const lineStyle = {
      position: 'absolute',
      left: launchPosition.x,
      top: launchPosition.y - 1, // 减去1/2的高度，使其居中
      width: GAME_CONFIG.AIMING.LINE_LENGTH,
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
      {gameState === GAME_STATES.PRE_GAME && <StartScreen onStartGame={handleStartGame} />}
      
      {gameState !== GAME_STATES.PRE_GAME && (
        <>
          <div className="game-header">
            <div className="game-stats">
              <span>回合: {round}</span>
              <span>小球数: {ballCount}</span>
              <span>下次小球数: {nextBallCount}</span>
              <span>难度: {difficulty}</span>
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
              cursor: gameState === GAME_STATES.AIMING ? 'none' : 'default'
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
                onClose={gameState === GAME_STATES.GAME_OVER ? restartGame : () => setShowLeaderboard(false)} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Game; 