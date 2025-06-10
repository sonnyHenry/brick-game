// 游戏常量配置
export const GAME_CONFIG = {
  // 游戏画布尺寸
  CANVAS_WIDTH: 955,
  CANVAS_HEIGHT: 800,
  
  // 速度配置
  SPEED: {
    BASE: 500,
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
    // 区间颜色：每5个生命值为一个区间，区间间区分度高
    COLORS: [
      '#ff0000',  // 区间1（生命值1-5）：红色
      '#ff8000',  // 区间2（生命值6-10）：橙色  
      '#ff0080',  // 区间3（生命值11-15）：洋红色
      '#0080ff',  // 区间4（生命值16-20）：蓝色
      '#ffff00',  // 区间5（生命值21-25）：黄色
      '#8000ff'   // 区间6（生命值26+）：紫色
    ]
  },
  
  // 道具配置
  POWERUP: {
    SIZE: 20,
    SPEED: 2,
    COLOR: '#ffff00',
    SPAWN_CHANCE: 0.07, // 7%的概率生成道具（从4%提高）
    // 道具生成数量配置
    MIN_BRICK_COUNT: 5, // 对应约40%密度
    MAX_BRICK_COUNT: 9, // 对应约70%密度
    MIN_COUNT: 1,       // 最少1个道具
    MAX_COUNT: 3        // 最多3个道具
  },
  
  // 物理常量
  PHYSICS: {
    GRAVITY: 0,
    FRICTION: 1,
    BOUNCE_DAMPING: 1
  }
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