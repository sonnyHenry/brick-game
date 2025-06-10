import React, { useState, useEffect, useCallback, useRef } from 'react';
import Ball from './Ball';
import Brick from './Brick';
import PowerUp from './PowerUp';
import { GAME_CONFIG, GAME_STATES, COLLISION_TYPES, POWERUP_TYPES } from '../utils/constants';
import { 
  detectBallRectCollision, 
  handleBallBounce, 
  detectWallCollision,
  detectContinuousCollision,
  detectPowerUpCollision,
  isPointInRect 
} from '../utils/collision';
import {
  generateBricks,
  generateTopRowBricks,
  moveBricksDown,
  checkGameOver,
  generateInitialPowerUps,
  movePowerUpsDown,
  generateTopRowPowerUps,
  getOccupiedCells,
  calculateLaunchVelocity,
  createBall,
  areAllBallsLanded,
  getLeftmostLandedBallX,
  getLastLandedBallX,
  cleanupDestroyedBricks,
  getBrickColorByHealth
} from '../utils/gameLogic';
import '../styles/Game.css';

const Game = () => {
  // 游戏状态
  const [gameState, setGameState] = useState(GAME_STATES.READY);
  const [round, setRound] = useState(1);
  const [ballCount, setBallCount] = useState(1);
  const [nextBallCount, setNextBallCount] = useState(1);
  const [ballSpeed, setBallSpeed] = useState(500); // 速度选择：500, 900, 1300像素/秒
  const [launchPosition, setLaunchPosition] = useState({ 
    x: GAME_CONFIG.CANVAS_WIDTH / 2, 
    y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS
  });
  const [aimPosition, setAimPosition] = useState(null);
  const isEndingRound = useRef(false); // 防止重复结束回合的状态锁
  
  // 游戏对象 (合并状态)
  const [world, setWorld] = useState({ bricks: [], powerUps: [] });
  const { bricks, powerUps } = world;
  const [balls, setBalls] = useState([]);
  
  // Refs
  const gameLoopRef = useRef();
  const gameAreaRef = useRef();
  const lastFrameTime = useRef(performance.now()); // 用于计算帧时间差

  // 初始化游戏
  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  const initializeGame = () => {
    const initialBricks = generateBricks(1);
    setWorld({ bricks: initialBricks, powerUps: generateInitialPowerUps(initialBricks) });
    setBalls([]);
    setRound(1);
    setBallCount(1);
    setNextBallCount(1);
    setGameState(GAME_STATES.READY);
    setLaunchPosition({ 
      x: GAME_CONFIG.CANVAS_WIDTH / 2, 
      y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS
    });
    isEndingRound.current = false; // 重置回合结束锁
  };

  // 游戏循环
  const gameLoop = useCallback(() => {
    // 如果游戏结束，停止循环
    if (gameState === GAME_STATES.GAME_OVER) {
      return;
    }
    
    if (gameState === GAME_STATES.SHOOTING) {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastFrameTime.current) / 1000; // 转换为秒
      lastFrameTime.current = currentTime;
      
      setBalls(prevBalls => {
        const updatedBalls = prevBalls.map(ball => {
          if (!ball.active) return ball;

          // 基于时间的位置更新：距离 = 速度 × 时间
          const newBall = { 
            ...ball, 
            x: ball.x + ball.vx * deltaTime, 
            y: ball.y + ball.vy * deltaTime 
          };

          // 检测墙壁碰撞
          const wallCollision = detectWallCollision(newBall);
          if (wallCollision !== COLLISION_TYPES.NONE) {
            // 如果碰到底部，小球失效
            if (wallCollision === COLLISION_TYPES.BOTTOM) {
              newBall.active = false;
              newBall.y = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS; // 确保位置正确
            } else {
              // 其他边界正常反弹并弹出
              handleBallBounce(newBall, wallCollision);
              const epsilon = 1; // 弹出距离
              if (wallCollision === COLLISION_TYPES.LEFT) {
                newBall.x = newBall.radius + epsilon;
              } else if (wallCollision === COLLISION_TYPES.RIGHT) {
                newBall.x = GAME_CONFIG.CANVAS_WIDTH - newBall.radius - epsilon;
              } else if (wallCollision === COLLISION_TYPES.TOP) {
                newBall.y = newBall.radius + epsilon;
              }
            }
          }

          // 统一处理游戏世界状态的更新 - 使用连续碰撞检测
          setWorld(prevWorld => {
            let collisionDetected = false;
            const updatedBricks = prevWorld.bricks.map(brick => {
              if (brick.destroyed || collisionDetected) return brick;
              
              // 使用连续碰撞检测防止穿透
              const collision = detectContinuousCollision(ball, newBall, brick);
              if (collision) {
                handleBallBounce(newBall, collision.type);
                collisionDetected = true; // 防止一个球同时碰撞多个砖块

                // 将小球位置更新到碰撞点，防止穿透
                newBall.x = collision.x;
                newBall.y = collision.y;
                
                // 减少砖块血量并更新颜色
                const updatedBrick = { ...brick, health: brick.health - 1 };
                if (updatedBrick.health <= 0) {
                  updatedBrick.destroyed = true;
                } else {
                  // 如果砖块没有被摧毁，更新颜色以反映新的生命值
                  updatedBrick.color = getBrickColorByHealth(updatedBrick.health);
                }
                return updatedBrick;
              }
              return brick;
            });

            const updatedPowerUps = prevWorld.powerUps.map(powerUp => {
              if (powerUp.collected) return powerUp;
              // 使用改进的连续碰撞检测，包含更大的容错范围
              if (detectPowerUpCollision(ball, newBall, powerUp)) {
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
          setTimeout(() => {
            endRound(updatedBalls);
          }, 500);
        }

        return updatedBalls;
      });
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  // 启动游戏循环
  useEffect(() => {
    if (gameState === GAME_STATES.SHOOTING) {
      lastFrameTime.current = performance.now(); // 重置时间戳
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      // 停止游戏循环（包括游戏结束时）
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
  }, [gameState, gameLoop]);

  // 结束回合
  const endRound = (finalBalls) => {
    const newLaunchX = getLastLandedBallX(finalBalls);
    setLaunchPosition({ 
      x: newLaunchX, 
      y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS
    });

    let gameIsOver = false; // 跟踪游戏是否结束

    setWorld(prevWorld => {
      // 1. 清理并移动现有砖块
      const cleanedBricks = cleanupDestroyedBricks(prevWorld.bricks);
      const movedDownBricks = moveBricksDown(cleanedBricks);

      // 2. 立即检查砖块下移后是否游戏结束
      if (checkGameOver(movedDownBricks)) {
        gameIsOver = true;
        setGameState(GAME_STATES.GAME_OVER);
        return { bricks: movedDownBricks, powerUps: prevWorld.powerUps };
      }

      // 3. 移动现有道具
      const movedPowerUps = movePowerUpsDown(prevWorld.powerUps);
      
      // 4. 生成新的顶行砖块，避开移动后的道具位置
      const newTopRowBricks = generateTopRowBricks(round + 1, movedDownBricks, movedPowerUps);
      
      // 5. 在新砖块的空隙中生成新道具
      const newPowerUps = generateTopRowPowerUps(newTopRowBricks);

      // 6. 合成最终的游戏世界
      const finalBricks = [...newTopRowBricks, ...movedDownBricks];
      const finalPowerUps = [...movedPowerUps, ...newPowerUps];
      
      return { bricks: finalBricks, powerUps: finalPowerUps };
    });

    // 如果游戏结束，不执行后续的回合准备操作
    if (gameIsOver) {
      return;
    }

    // 更新回合数和球数
    setRound(prev => prev + 1);
    setNextBallCount(currentNextBallCount => {
      setBallCount(currentNextBallCount);
      return currentNextBallCount;
    });
    setBalls([]);
    setTimeout(() => {
      setGameState(GAME_STATES.READY);
      isEndingRound.current = false;
    }, 100);
  };

  // 处理鼠标移动（瞄准）
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

  // 处理鼠标点击（发射）
  const handleClick = (e) => {
    if (gameState !== GAME_STATES.AIMING) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    // 计算发射方向
    const dx = targetX - launchPosition.x;
    const dy = targetY - launchPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 直接使用选定的速度
    const actualSpeed = ballSpeed;
    const velocity = {
      vx: (dx / distance) * actualSpeed,
      vy: (dy / distance) * actualSpeed
    };
    
    // 创建小球
    const newBalls = [];
    for (let i = 0; i < ballCount; i++) {
      setTimeout(() => {
        const newBall = createBall(launchPosition.x, launchPosition.y, velocity.vx, velocity.vy);
        setBalls(prev => [...prev, newBall]);
      }, i * 80); // 每个球间隔80ms发射
    }
    
    setGameState(GAME_STATES.SHOOTING);
    setAimPosition(null);
  };

  // 重新开始游戏
  const restartGame = () => {
    initializeGame();
  };

  // 渲染瞄准线
  const renderAimLine = () => {
    if (!aimPosition || gameState !== GAME_STATES.AIMING) return null;
    
    // 计算直线的角度，但使用固定长度
    const dx = aimPosition.x - launchPosition.x;
    const dy = aimPosition.y - launchPosition.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const fixedLength = 150; // 固定长度150像素
    
    const lineStyle = {
      position: 'absolute',
      left: launchPosition.x,
      top: launchPosition.y - 1, // 调整线条中心位置
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
        {/* 渲染砖块 */}
        {bricks.map(brick => (
          <Brick key={brick.id} brick={brick} />
        ))}
        
        {/* 渲染小球 */}
        {balls.map(ball => (
          <Ball key={ball.id} ball={ball} />
        ))}
        
        {/* 渲染道具 */}
        {powerUps.map(powerUp => (
          <PowerUp key={powerUp.id} powerUp={powerUp} />
        ))}
        
        {/* 渲染瞄准线 */}
        {renderAimLine()}
        
        {/* 渲染发射位置 */}
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