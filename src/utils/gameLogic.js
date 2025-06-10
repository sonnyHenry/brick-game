import { GAME_CONFIG, POWERUP_TYPES } from './constants';

/**
 * 根据生命值获取砖块颜色
 * @param {number} health - 砖块生命值
 * @returns {string} 颜色值
 */
export function getBrickColorByHealth(health) {
  const { BRICK } = GAME_CONFIG;
  // 使用区间划分：每5个生命值为一个区间
  const colorIndex = Math.floor((health - 1) / 5) % BRICK.COLORS.length;
  return BRICK.COLORS[colorIndex];
}

/**
 * 生成初始砖块
 * @param {number} round - 当前回合数
 * @returns {Array} 砖块数组
 */
export function generateBricks(round = 1) {
  const bricks = [];
  const { BRICK } = GAME_CONFIG;
  
  // 随机排列所有可能的位置
  const positions = [];
  for (let row = 0; row < BRICK.ROWS; row++) {
    for (let col = 0; col < BRICK.COLS; col++) {
      positions.push({ row, col });
    }
  }
  
  // 打乱位置数组
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // 只生成一部分砖块，并且生命值较低
  const brickCount = Math.floor(positions.length * 0.4); // 40%的位置生成砖块
  
  for (let i = 0; i < brickCount; i++) {
    const { row, col } = positions[i];
    // 初始砖块生命值在1-3之间随机
    const health = Math.floor(Math.random() * 3) + 1;
    
    const brick = {
      id: `${row}-${col}`,
      x: BRICK.OFFSET_LEFT + col * (BRICK.WIDTH + BRICK.PADDING),
      y: BRICK.OFFSET_TOP + row * (BRICK.HEIGHT + BRICK.PADDING),
      width: BRICK.WIDTH,
      height: BRICK.HEIGHT,
      health: health,
      maxHealth: health,
      color: getBrickColorByHealth(health),
      destroyed: false
    };
    bricks.push(brick);
  }
  
  return bricks;
}

/**
 * 生成新的顶行砖块
 * @param {number} round - 当前回合数
 * @returns {Array} 新的顶行砖块
 */
export function generateTopRowBricks(round) {
  const bricks = [];
  const { BRICK } = GAME_CONFIG;
  
  // 基于回合数决定新砖块的生命值范围，进一步加快增长速度
  const minHealth = Math.max(1, round); // 每回合增加1生命值（从每2回合改为每回合）
  const maxHealth = minHealth + 1; // 生命值范围为1
  
  // 由于砖块和道具总是向下移动，顶行一定是空的，因此所有列都可用。
  const availableColumns = [];
  for (let i = 0; i < BRICK.COLS; i++) {
    availableColumns.push(i);
  }
  
  // 随机排列可用的列位置
  for (let i = availableColumns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableColumns[i], availableColumns[j]] = [availableColumns[j], availableColumns[i]];
  }
  
  // 确保至少生成一些砖块，但不超过可用位置
  const minBricks = Math.min(3, availableColumns.length); // 至少生成3个砖块（如果有足够空间）
  const maxBricks = Math.floor(availableColumns.length * 0.7); // 最多70%的可用位置
  const brickCount = Math.max(minBricks, maxBricks);
  
  console.log(`生成新砖块: 可用列=${availableColumns.length}, 生成数量=${brickCount}, 回合=${round}`);
  
  for (let i = 0; i < brickCount; i++) {
    const col = availableColumns[i];
    // 在指定范围内随机生命值
    const health = Math.floor(Math.random() * (maxHealth - minHealth + 1)) + minHealth;
    
    const brick = {
      id: `top-${round}-${col}`,
      x: BRICK.OFFSET_LEFT + col * (BRICK.WIDTH + BRICK.PADDING),
      y: BRICK.OFFSET_TOP,
      width: BRICK.WIDTH,
      height: BRICK.HEIGHT,
      health: health,
      maxHealth: health,
      color: getBrickColorByHealth(health),
      destroyed: false
    };
    bricks.push(brick);
  }
  
  return bricks;
}

/**
 * 移动所有砖块向下一行
 * @param {Array} bricks - 砖块数组
 * @returns {Array} 移动后的砖块数组
 */
export function moveBricksDown(bricks) {
  const { BRICK } = GAME_CONFIG;
  
  return bricks.map(brick => ({
    ...brick,
    y: brick.y + BRICK.HEIGHT + BRICK.PADDING
  }));
}

/**
 * 检查游戏是否结束（砖块到达底部）
 * @param {Array} bricks - 砖块数组
 * @returns {boolean} 是否游戏结束
 */
export function checkGameOver(bricks) {
  const bottomThreshold = GAME_CONFIG.CANVAS_HEIGHT - 10; // 调整安全距离到80像素，给发射区域留出合理空间
  
  // 找到所有活跃砖块
  const activeBricks = bricks.filter(brick => !brick.destroyed);
  
  if (activeBricks.length === 0) {
    return false; // 没有砖块时不结束游戏
  }
  
  // 检查是否有砖块超过底部阈值
  const gameOver = activeBricks.some(brick => {
    const brickBottom = brick.y + GAME_CONFIG.BRICK.HEIGHT;
    return brickBottom >= bottomThreshold;
  });
  
  if (gameOver) {
    console.log('游戏结束！砖块到达底部！');
    // 打印最低砖块信息
    const lowestBrick = activeBricks.reduce((lowest, brick) => 
      brick.y > lowest.y ? brick : lowest
    );
    console.log(`最低砖块: y=${lowestBrick.y}, 底部=${lowestBrick.y + GAME_CONFIG.BRICK.HEIGHT}, 阈值=${bottomThreshold}`);
  }
  
  return gameOver;
}

/**
 * 生成道具
 * @param {Object} position - 道具位置 {x, y}
 * @param {string} type - 道具类型
 * @returns {Object} 道具对象
 */
export function createPowerUp(position, type = POWERUP_TYPES.MULTI_BALL) {
  return {
    id: `powerup-${Date.now()}-${Math.random()}`,
    x: position.x,
    y: position.y,
    size: GAME_CONFIG.POWERUP.SIZE,
    type: type,
    color: GAME_CONFIG.POWERUP.COLOR,
    collected: false,
  };
}

/**
 * 在初始砖块布局的空隙中生成道具
 * @param {Array} bricks - 当前砖块数组
 * @returns {Array} 道具数组
 */
export function generateInitialPowerUps(bricks) {
  const { BRICK, CANVAS_HEIGHT } = GAME_CONFIG;
  const occupiedCells = new Set();

  bricks.forEach(brick => {
    const col = Math.round((brick.x - BRICK.OFFSET_LEFT) / (BRICK.WIDTH + BRICK.PADDING));
    const row = Math.round((brick.y - BRICK.OFFSET_TOP) / (BRICK.HEIGHT + BRICK.PADDING));
    occupiedCells.add(`${row},${col}`);
  });

  const emptyCells = [];
  for (let r = 0; r < BRICK.ROWS; r++) {
    for (let c = 0; c < BRICK.COLS; c++) {
      if (!occupiedCells.has(`${r},${c}`)) {
        const x = BRICK.OFFSET_LEFT + c * (BRICK.WIDTH + BRICK.PADDING) + (BRICK.WIDTH / 2);
        const y = BRICK.OFFSET_TOP + r * (BRICK.HEIGHT + BRICK.PADDING) + (BRICK.HEIGHT / 2);

        if (y < CANVAS_HEIGHT - 200) {
            emptyCells.push({ x, y });
        }
      }
    }
  }

  const shuffled = emptyCells.sort(() => 0.5 - Math.random());
  
  const count = Math.min(shuffled.length, Math.floor(Math.random() * 3) + 1);
  const selectedCells = shuffled.slice(0, count);
  
  return selectedCells.map(cell => createPowerUp(cell));
}

/**
 * 创建一个包含所有被砖块占据的单元格坐标的集合。
 * @param {Array} bricks - 砖块数组。
 * @returns {Set<string>} 一个包含 "行,列" 格式字符串的集合。
 */
export function getOccupiedCells(bricks) {
  const { BRICK } = GAME_CONFIG;
  const occupiedCells = new Set();
  bricks.forEach(brick => {
    if (brick.destroyed) return;
    const col = Math.round((brick.x - BRICK.OFFSET_LEFT) / (BRICK.WIDTH + BRICK.PADDING));
    const row = Math.round((brick.y - BRICK.OFFSET_TOP) / (BRICK.HEIGHT + BRICK.PADDING));
    occupiedCells.add(`${row},${col}`);
  });
  return occupiedCells;
}

/**
 * 将现有的道具向下移动一行
 * @param {Array} powerUps - 道具数组
 * @returns {Array} 移动后的道具数组
 */
export function movePowerUpsDown(powerUps) {
  const { BRICK, CANVAS_HEIGHT } = GAME_CONFIG;
  return powerUps
    .filter(powerUp => !powerUp.collected) // 在移动前，先过滤掉已收集的道具
    .map(powerUp => {
      const newY = powerUp.y + BRICK.HEIGHT + BRICK.PADDING;
      // 确保道具移动距离与砖块移动距离完全一致
      return {
        ...powerUp,
        y: newY,
      };
    })
    .filter(powerUp => powerUp.y < CANVAS_HEIGHT - 100); // 移除超出游戏区域的道具
}

/**
 * 在新生成的顶行砖块的空隙中生成新道具
 * @param {Array} newTopRowBricks - 新生成的顶行砖块数组
 * @returns {Array} 新的道具数组
 */
export function generateTopRowPowerUps(newTopRowBricks) {
  const { BRICK } = GAME_CONFIG;
  const newPowerUps = [];
  
  // 找出被新砖块占据的列
  const occupiedCols = new Set(
    newTopRowBricks.map(brick =>
      Math.round((brick.x - BRICK.OFFSET_LEFT) / (BRICK.WIDTH + BRICK.PADDING))
    )
  );

  // 遍历所有可能的列位置
  for (let c = 0; c < BRICK.COLS; c++) {
    // 如果该列是空的
    if (!occupiedCols.has(c)) {
      // 按4%的概率在该空隙中生成一个道具（进一步降低概率）
      if (Math.random() < GAME_CONFIG.POWERUP.SPAWN_CHANCE) {
        const position = {
          x: BRICK.OFFSET_LEFT + c * (BRICK.WIDTH + BRICK.PADDING) + BRICK.WIDTH / 2,
          y: BRICK.OFFSET_TOP + BRICK.HEIGHT / 2,
        };
        newPowerUps.push(createPowerUp(position));
      }
    }
  }
  return newPowerUps;
}

/**
 * 计算发射角度
 * @param {Object} startPos - 起始位置 {x, y}
 * @param {Object} targetPos - 目标位置 {x, y}
 * @param {number} speed - 小球速度
 * @returns {Object} 速度向量 {vx, vy}
 */
export function calculateLaunchVelocity(startPos, targetPos, speed) {
  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 如果距离过小，则设置一个默认向上发射的速度
  if (distance < 1) {
    return { vx: 0, vy: -speed };
  }
  
  return {
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed
  };
}

/**
 * 创建小球对象
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} vx - x方向速度
 * @param {number} vy - y方向速度
 * @returns {Object} 小球对象
 */
export function createBall(x, y, vx = 0, vy = 0) {
  return {
    id: `ball-${Date.now()}-${Math.random()}`,
    x: x,
    y: y,
    radius: GAME_CONFIG.BALL.RADIUS,
    vx: vx,
    vy: vy,
    color: GAME_CONFIG.BALL.COLOR,
    active: true
  };
}

/**
 * 检查是否所有小球都已落地
 * @param {Array} balls - 小球数组
 * @returns {boolean} 是否所有小球都已落地
 */
export function areAllBallsLanded(balls) {
  if (balls.length === 0) return false; // 修改：没有小球时不应该结束回合
  
  // 只有当所有小球都不活跃时才算落地
  return balls.every(ball => !ball.active);
}

/**
 * 获取最后一个落地的小球位置
 * @param {Array} balls - 小球数组
 * @returns {number} 最后一个小球的x坐标
 */
export function getLastLandedBallX(balls) {
  console.log(`所有球状态:`, balls.map(b => ({ x: b.x, active: b.active, landingTime: b.landingTime })));
  
  // 只考虑已经落地（不活跃）且在有效范围内的球
  const landedBalls = balls.filter(ball => 
    !ball.active && // 球已经停止
    ball.x >= GAME_CONFIG.BALL.RADIUS && 
    ball.x <= GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.BALL.RADIUS &&
    ball.y >= GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.BALL.RADIUS - 50 // 确保球在底部附近
  );
  
  console.log(`落地的球:`, landedBalls.map(b => ({ x: b.x, y: b.y, landingTime: b.landingTime })));
  
  if (landedBalls.length === 0) {
    console.log(`没有找到有效的落地球，使用默认位置`);
    return GAME_CONFIG.CANVAS_WIDTH / 2;
  }
  
  // 找到落地时间最晚的球
  const lastLandedBall = landedBalls.reduce((last, current) => {
    if (!last.landingTime) return current;
    if (!current.landingTime) return last;
    return current.landingTime > last.landingTime ? current : last;
  });
  
  console.log(`选择最后落地的球位置: x=${lastLandedBall.x}`);
  
  return lastLandedBall.x;
}

/**
 * 清理已销毁的砖块
 * @param {Array} bricks - 砖块数组
 * @returns {Array} 清理后的砖块数组
 */
export function cleanupDestroyedBricks(bricks) {
  return bricks.filter(brick => !brick.destroyed);
} 