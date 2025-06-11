// 游戏常量配置
export const GAME_CONFIG = {
  // 游戏画布尺寸
  CANVAS_WIDTH: 955,
  CANVAS_HEIGHT: 800,
  
  // 速度配置
  SPEED: {
    BASE: 500,
    DEFAULT: 1, // 默认速度倍率
    MULTIPLIERS: [
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '3x', value: 3 },
    ]
  },
  
  // 小球配置
  BALL: {
    RADIUS: 10,
    COLOR: '#00ff00',
    SHADOW_BLUR: 15
  },
  
  // 砖块配置
  BRICK: {
    WIDTH: 60,
    HEIGHT: 30,
    ROWS: 6,
    COLS: 14, // 从12增加到14列，利用更宽的空间
    PADDING: 5,
    OFFSET_TOP: 50,
    OFFSET_LEFT: 25,
    // 新的颜色方案：基于扁平化设计，追求高对比度和视觉冲击力
    COLORS: [
      '#1abc9c', // 绿松石
      '#2ecc71', // 翡翠
      '#3498db', // 彼得河蓝
      '#9b59b6', // 紫水晶
      '#34495e', // 湿沥青
      '#f1c40f', // 太阳花
      '#e67e22', // 胡萝卜
      '#e74c3c', // 炼金石
      '#ecf0f1', // 云
      '#7f8c8d', // 石棉
    ]
  },
  
  // 道具配置
  POWERUP: {
    SIZE: 20,
    SPEED: 2,
    COLOR: '#ffff00',
  },
  
  // 瞄准配置
  AIMING: {
    MIN_ANGLE_DEG: 10, // 发射角度距离水平线的最小夹角（度）
    LINE_LENGTH: 300   // 瞄准线的像素长度
  },
  
  // 物理常量
  PHYSICS: {
    GRAVITY: 0,
    FRICTION: 1,
    BOUNCE_DAMPING: 1
  }
};

// 游戏难度常量
export const DIFFICULTIES = {
  MEDIUM: '中等',
  HARD: '困难',
};

// 各难度下的详细配置
export const DIFFICULTY_SETTINGS = {
  [DIFFICULTIES.MEDIUM]: {
    // 砖块生命值每4回合提升一次
    BRICK_HEALTH_INTERVAL: 4,
    // 每2回合保底1个道具
    POWERUP_GUARANTEED_SPAWN_ROUNDS: 2,
    // 道具基础生成率50%
    POWERUP_BASE_SPAWN_CHANCE: 0.5,
    // 每3回合检查一次小球数，基础值为3
    SAFETY_NET: {
      GROWTH_INTERVAL: 3,
      MIN_BALLS_BASE: 3,
    },
  },
  [DIFFICULTIES.HARD]: {
    // 砖块生命值每3回合提升一次
    BRICK_HEALTH_INTERVAL: 3,
    // 每3回合保底1个道具
    POWERUP_GUARANTEED_SPAWN_ROUNDS: 3,
    // 道具基础生成率35%
    POWERUP_BASE_SPAWN_CHANCE: 0.35,
    // 每4回合检查一次小球数，基础值为3
    SAFETY_NET: {
      GROWTH_INTERVAL: 4,
      MIN_BALLS_BASE: 3,
    },
  },
};

// 碰撞类型枚举
export const COLLISION_TYPES = {
  NONE: 'none',
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  CORNER_TOP_LEFT: 'corner_top_left',
  CORNER_TOP_RIGHT: 'corner_top_right',
  CORNER_BOTTOM_LEFT: 'corner_bottom_left',
  CORNER_BOTTOM_RIGHT: 'corner_bottom_right',
};

// 游戏状态枚举
export const GAME_STATES = {
  READY: 'ready',
  AIMING: 'aiming', 
  SHOOTING: 'shooting',
  GAME_OVER: 'gameOver'
};

// 道具类型枚举  
export const POWERUP_TYPES = {
  MULTI_BALL: 'multiBall'
};