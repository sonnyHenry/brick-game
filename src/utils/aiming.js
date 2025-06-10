import { GAME_CONFIG } from './constants';

/**
 * 这是一个用于计算和限制瞄准角度的工具模块。
 * 它可以被游戏逻辑和UI组件共用，以确保发射和视觉预览的一致性。
 */

/**
 * 根据起始点和目标点，计算出最终合法的瞄准向量。
 * 角度限制会从GAME_CONFIG中自动获取。
 * @param {Object} startPos - 起始坐标 { x, y }
 * @param {Object} targetPos - 原始目标坐标 { x, y }
 * @returns {Object} - 一个包含合法方向单位向量的对象 { dx, dy }
 */
export function getClampedAimVector(startPos, targetPos) {
  const minAngleDeg = GAME_CONFIG.AIMING.MIN_ANGLE_DEG;
  let dx = targetPos.x - startPos.x;
  let dy = targetPos.y - startPos.y;

  // 1. 确保始终朝上发射
  // 如果瞄准水平线以下，强制给一个微小的向上分量
  if (dy >= 0) {
    dy = -0.01;
  }

  // 2. 归一化初始向量
  const distance = Math.sqrt(dx * dx + dy * dy);
  // 避免除以零
  if (distance < 0.001) {
    return { dx: 0, dy: -1 }; // 默认垂直向上
  }
  let unitDx = dx / distance;
  let unitDy = dy / distance;

  // 3. 限制角度
  const minAngleRad = minAngleDeg * (Math.PI / 180);
  // 我们关心的是垂直分量与总长度的比值，这直接对应于角度的正弦值
  const minDyRatio = Math.sin(minAngleRad);
  // unitDy 是归一化后的垂直分量，其绝对值就是当前角度的正弦值
  const currentDyRatio = Math.abs(unitDy);

  if (currentDyRatio < minDyRatio) {
    // 如果当前角度太平，则强制设为最小角度
    const newUnitDy = -minDyRatio; // 垂直分量必须向上（负值）
    // 根据勾股定理 a^2 + b^2 = c^2 (这里c=1)，重新计算水平分量
    const newUnitDxAbs = Math.sqrt(1 - newUnitDy * newUnitDy);
    
    // 保持原始的水平方向（向左还是向右）
    const newUnitDx = newUnitDxAbs * Math.sign(unitDx);
    
    return { dx: newUnitDx, dy: newUnitDy };
  }

  // 如果角度合法，直接返回归一化的向量
  return { dx: unitDx, dy: unitDy };
} 