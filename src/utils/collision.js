import { GAME_CONFIG, COLLISION_TYPES } from './constants';

/**
 * 检测小球与矩形的碰撞
 * @param {Object} ball - 小球对象 {x, y, radius, vx, vy}
 * @param {Object} rect - 矩形对象 {x, y, width, height}
 * @returns {string} 碰撞类型
 */
export function detectBallRectCollision(ball, rect) {
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;
  
  const rectLeft = rect.x;
  const rectRight = rect.x + rect.width;
  const rectTop = rect.y;
  const rectBottom = rect.y + rect.height;
  
  // 检查是否有碰撞
  if (ballRight < rectLeft || ballLeft > rectRight || 
      ballBottom < rectTop || ballTop > rectBottom) {
    return COLLISION_TYPES.NONE;
  }
  
  // 检查是否是角碰撞
  const cornerCollisionType = getCornerCollision(ball, rect);
  if (cornerCollisionType) {
    return cornerCollisionType;
  }
  
  // 计算球心到矩形中心的距离
  const rectCenterX = rect.x + rect.width / 2;
  const rectCenterY = rect.y + rect.height / 2;
  const deltaX = ball.x - rectCenterX;
  const deltaY = ball.y - rectCenterY;
  
  // 计算球心到各边的距离
  const distToLeft = Math.abs(ball.x - rectLeft);
  const distToRight = Math.abs(ball.x - rectRight);
  const distToTop = Math.abs(ball.y - rectTop);
  const distToBottom = Math.abs(ball.y - rectBottom);
  
  // 找到最小距离来确定碰撞边
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
  
  // 边碰撞检测
  if (minDist === distToLeft && ball.vx > 0) {
    return COLLISION_TYPES.LEFT;
  } else if (minDist === distToRight && ball.vx < 0) {
    return COLLISION_TYPES.RIGHT;
  } else if (minDist === distToTop && ball.vy > 0) {
    return COLLISION_TYPES.TOP;
  } else if (minDist === distToBottom && ball.vy < 0) {
    return COLLISION_TYPES.BOTTOM;
  }
  
  return COLLISION_TYPES.NONE;
}

/**
 * 检查是否是角碰撞，并返回具体的角类型
 * @param {Object} ball - 小球对象
 * @param {Object} rect - 矩形对象
 * @returns {string|null} 碰撞的角类型或null
 */
function getCornerCollision(ball, rect) {
  const corners = [
    { type: COLLISION_TYPES.CORNER_TOP_LEFT, x: rect.x, y: rect.y }, // 左上角
    { type: COLLISION_TYPES.CORNER_TOP_RIGHT, x: rect.x + rect.width, y: rect.y }, // 右上角
    { type: COLLISION_TYPES.CORNER_BOTTOM_LEFT, x: rect.x, y: rect.y + rect.height }, // 左下角
    { type: COLLISION_TYPES.CORNER_BOTTOM_RIGHT, x: rect.x + rect.width, y: rect.y + rect.height } // 右下角
  ];
  
  for (const corner of corners) {
    const dx = ball.x - corner.x;
    const dy = ball.y - corner.y;
    if (Math.sqrt(dx * dx + dy * dy) <= ball.radius) {
      return corner.type;
    }
  }
  return null;
}

/**
 * 处理小球碰撞反弹
 * @param {Object} ball - 小球对象
 * @param {string} collisionType - 碰撞类型
 */
export function handleBallBounce(ball, collisionType) {
  switch (collisionType) {
    case COLLISION_TYPES.LEFT:
    case COLLISION_TYPES.RIGHT:
      ball.vx = -ball.vx;
      break;
    case COLLISION_TYPES.TOP:
    case COLLISION_TYPES.BOTTOM:
      ball.vy = -ball.vy;
      break;
    case COLLISION_TYPES.CORNER_TOP_LEFT:
    case COLLISION_TYPES.CORNER_TOP_RIGHT:
    case COLLISION_TYPES.CORNER_BOTTOM_LEFT:
    case COLLISION_TYPES.CORNER_BOTTOM_RIGHT:
      // 计算入射角度（相对于水平方向）
      const angle = Math.abs(Math.atan2(ball.vy, ball.vx) * 180 / Math.PI);
      const normalizedAngle = angle > 90 ? 180 - angle : angle;
      
      // 检查是否正好是45度（允许±0.5度的微小误差，处理浮点数精度问题）
      const is45Degree = Math.abs(normalizedAngle - 45) <= 0.5;
      
      if (is45Degree) {
        // 正好45度：随机选择水平或垂直反射
        if (Math.random() < 0.5) {
          ball.vx = -ball.vx; // 水平反射
        } else {
          ball.vy = -ball.vy; // 垂直反射
        }
      } else if (normalizedAngle < 45) {
        // 水平入射（0-45度）：只反转水平速度
        ball.vx = -ball.vx;
      } else {
        // 垂直入射（45-90度）：只反转垂直速度
        ball.vy = -ball.vy;
      }
      break;
    default:
      break;
  }
}

/**
 * 检测小球与画布边界的碰撞
 * @param {Object} ball - 小球对象
 * @returns {string} 碰撞类型
 */
export function detectWallCollision(ball) {
  if (ball.x - ball.radius <= 0) {
    return COLLISION_TYPES.LEFT;
  }
  if (ball.x + ball.radius >= GAME_CONFIG.CANVAS_WIDTH) {
    return COLLISION_TYPES.RIGHT;
  }
  if (ball.y - ball.radius <= 0) {
    return COLLISION_TYPES.TOP;
  }
  if (ball.y + ball.radius >= GAME_CONFIG.CANVAS_HEIGHT) {
    return COLLISION_TYPES.BOTTOM;
  }
  return COLLISION_TYPES.NONE;
}

/**
 * 检测点是否在矩形内
 * @param {number} x - 点的x坐标
 * @param {number} y - 点的y坐标
 * @param {Object} rect - 矩形对象
 * @returns {boolean} 是否在矩形内
 */
export function isPointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width &&
         y >= rect.y && y <= rect.y + rect.height;
}

/**
 * 连续碰撞检测：检测小球在移动路径上是否与矩形碰撞
 * @param {Object} ball - 小球对象（当前位置）
 * @param {Object} newBall - 小球对象（新位置）
 * @param {Object} rect - 矩形对象
 * @returns {Object|null} 碰撞信息 {type, t, x, y} 或 null
 */
export function detectContinuousCollision(ball, newBall, rect) {
  // 小球移动向量
  const dx = newBall.x - ball.x;
  const dy = newBall.y - ball.y;
  
  // 如果小球没有移动，使用传统检测
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    const collisionType = detectBallRectCollision(newBall, rect);
    return collisionType !== COLLISION_TYPES.NONE ? { type: collisionType, t: 1, x: newBall.x, y: newBall.y } : null;
  }
  
  let minT = 1; // 最早碰撞时间（0到1之间）
  let collisionType = COLLISION_TYPES.NONE;
  let collisionX = newBall.x;
  let collisionY = newBall.y;
  
  // 检测与四边的碰撞
  const ballRadius = ball.radius;
  
  // 左边
  if (dx > 0) {
    const t = (rect.x - ballRadius - ball.x) / dx;
    if (t >= 0 && t <= 1) {
      const intersectY = ball.y + dy * t;
      if (intersectY >= rect.y - ballRadius && intersectY <= rect.y + rect.height + ballRadius) {
        if (t < minT) {
          minT = t;
          collisionType = COLLISION_TYPES.LEFT;
          collisionX = ball.x + dx * t;
          collisionY = intersectY;
        }
      }
    }
  }
  
  // 右边
  if (dx < 0) {
    const t = (rect.x + rect.width + ballRadius - ball.x) / dx;
    if (t >= 0 && t <= 1) {
      const intersectY = ball.y + dy * t;
      if (intersectY >= rect.y - ballRadius && intersectY <= rect.y + rect.height + ballRadius) {
        if (t < minT) {
          minT = t;
          collisionType = COLLISION_TYPES.RIGHT;
          collisionX = ball.x + dx * t;
          collisionY = intersectY;
        }
      }
    }
  }
  
  // 上边
  if (dy > 0) {
    const t = (rect.y - ballRadius - ball.y) / dy;
    if (t >= 0 && t <= 1) {
      const intersectX = ball.x + dx * t;
      if (intersectX >= rect.x - ballRadius && intersectX <= rect.x + rect.width + ballRadius) {
        if (t < minT) {
          minT = t;
          collisionType = COLLISION_TYPES.TOP;
          collisionX = intersectX;
          collisionY = ball.y + dy * t;
        }
      }
    }
  }
  
  // 下边
  if (dy < 0) {
    const t = (rect.y + rect.height + ballRadius - ball.y) / dy;
    if (t >= 0 && t <= 1) {
      const intersectX = ball.x + dx * t;
      if (intersectX >= rect.x - ballRadius && intersectX <= rect.x + rect.width + ballRadius) {
        if (t < minT) {
          minT = t;
          collisionType = COLLISION_TYPES.BOTTOM;
          collisionX = intersectX;
          collisionY = ball.y + dy * t;
        }
      }
    }
  }
  
  // 检测与四个角的碰撞
  const corners = [
    { type: COLLISION_TYPES.CORNER_TOP_LEFT, x: rect.x, y: rect.y },
    { type: COLLISION_TYPES.CORNER_TOP_RIGHT, x: rect.x + rect.width, y: rect.y },
    { type: COLLISION_TYPES.CORNER_BOTTOM_LEFT, x: rect.x, y: rect.y + rect.height },
    { type: COLLISION_TYPES.CORNER_BOTTOM_RIGHT, x: rect.x + rect.width, y: rect.y + rect.height }
  ];
  
  for (const corner of corners) {
    const t = getCircleLineIntersection(ball.x, ball.y, dx, dy, corner.x, corner.y, ballRadius);
    if (t !== null && t >= 0 && t <= 1 && t < minT) {
      minT = t;
      collisionType = corner.type;
      collisionX = ball.x + dx * t;
      collisionY = ball.y + dy * t;
    }
  }
  
  return minT < 1 ? { type: collisionType, t: minT, x: collisionX, y: collisionY } : null;
}

/**
 * 计算圆心沿直线运动时与固定圆心的碰撞时间
 * @param {number} x1 - 起始x坐标
 * @param {number} y1 - 起始y坐标
 * @param {number} dx - x方向移动量
 * @param {number} dy - y方向移动量
 * @param {number} cx - 固定圆心x坐标
 * @param {number} cy - 固定圆心y坐标
 * @param {number} r - 碰撞半径
 * @returns {number|null} 碰撞时间t（0-1）或null
 */
function getCircleLineIntersection(x1, y1, dx, dy, cx, cy, r) {
  const a = dx * dx + dy * dy;
  const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
  const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  
  // 返回最小的正值t
  if (t1 >= 0) return t1;
  if (t2 >= 0) return t2;
  return null;
}

/**
 * 连续碰撞检测：检测小球路径与道具的碰撞
 * @param {Object} ball - 小球对象（当前位置）
 * @param {Object} newBall - 小球对象（新位置）
 * @param {Object} powerUp - 道具对象
 * @returns {boolean} 是否发生碰撞
 */
export function detectPowerUpCollision(ball, newBall, powerUp) {
  // 增大碰撞检测半径，让收集更容易
  const ballRadius = ball.radius;
  const powerUpRadius = powerUp.size / 2;
  const collisionRadius = ballRadius + powerUpRadius + 1; // 额外增加5像素容错范围
  
  // 检测当前位置的碰撞
  const currentDistance = Math.sqrt(
    Math.pow(ball.x - powerUp.x, 2) + Math.pow(ball.y - powerUp.y, 2)
  );
  if (currentDistance <= collisionRadius) {
    return true;
  }
  
  // 检测新位置的碰撞
  const newDistance = Math.sqrt(
    Math.pow(newBall.x - powerUp.x, 2) + Math.pow(newBall.y - powerUp.y, 2)
  );
  if (newDistance <= collisionRadius) {
    return true;
  }
  
  // 检测路径上的碰撞（使用线段与圆的相交检测）
  const dx = newBall.x - ball.x;
  const dy = newBall.y - ball.y;
  
  // 如果小球移动距离很小，跳过路径检测
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
    return false;
  }
  
  // 计算点到线段的最短距离
  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const t = Math.max(0, Math.min(1, 
    ((powerUp.x - ball.x) * dx + (powerUp.y - ball.y) * dy) / (lineLength * lineLength)
  ));
  
  const closestPointX = ball.x + t * dx;
  const closestPointY = ball.y + t * dy;
  
  const distanceToLine = Math.sqrt(
    Math.pow(powerUp.x - closestPointX, 2) + Math.pow(powerUp.y - closestPointY, 2)
  );
  
  return distanceToLine <= collisionRadius;
} 