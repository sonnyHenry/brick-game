# 🧱 React 砖块游戏 (Brick Breaker Game)

一个使用 React 构建的现代化砖块消除游戏，具有物理碰撞检测、道具系统和动态难度调整。

## 🎮 游戏特色

### 核心玩法
- **经典砖块消除**：发射小球打破砖块
- **连续碰撞检测**：防止小球穿透，提供流畅的物理体验
- **动态难度**：砖块生命值随回合数递增
- **道具系统**：收集道具增加小球数量

### 视觉效果
- **彩色砖块**：根据生命值显示不同颜色
- **实时更新**：砖块受击后颜色动态变化
- **响应式设计**：适配不同屏幕尺寸

### 技术特色
- **时间基础物理**：帧率无关的平滑运动
- **连续碰撞检测**：精确的路径碰撞算法
- **状态管理**：统一的游戏世界状态管理

## 🚀 快速开始

### 环境要求
- Node.js 14.0+
- npm 6.0+ 或 yarn 1.0+

### 安装与运行
```bash
# 克隆项目
git clone <repository-url>
cd brickGame

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

## 🎯 游戏玩法

### 基本操作
1. **瞄准**：移动鼠标调整发射角度
2. **发射**：点击鼠标发射小球
3. **收集道具**：小球触碰黄色道具增加球数
4. **打破砖块**：消除所有砖块或避免砖块到达底部

### 游戏机制
- **砖块颜色系统**：
  - 🔴 红色 (1-5生命值)
  - 🟠 橙色 (6-10生命值)
  - 🩷 洋红色 (11-15生命值)
  - 🔵 蓝色 (16-20生命值)
  - 🟡 黄色 (21-25生命值)
  - 🟣 紫色 (26+生命值)

- **速度选择**：500 / 900 / 1300 像素/秒
- **道具生成**：4%概率在空隙中生成

## 🏗️ 项目结构

```
src/
├── components/          # React 组件
│   ├── Game.js         # 主游戏组件
│   ├── Ball.js         # 小球组件
│   ├── Brick.js        # 砖块组件
│   └── PowerUp.js      # 道具组件
├── utils/              # 工具函数
│   ├── constants.js    # 游戏常量配置
│   ├── collision.js    # 碰撞检测算法
│   └── gameLogic.js    # 游戏逻辑函数
├── styles/             # 样式文件
│   └── Game.css        # 游戏样式
└── App.js              # 应用入口
```

## 🔧 技术实现

### 核心算法
- **连续碰撞检测**：使用线段与矩形相交算法防止穿透
- **时间基础物理**：`position += velocity × deltaTime`
- **状态同步**：React状态管理确保UI与逻辑同步

### 性能优化
- **requestAnimationFrame**：平滑的游戏循环
- **状态批处理**：减少不必要的重渲染
- **内存管理**：及时清理销毁的对象

## 📊 游戏配置

### 可调整参数
```javascript
// 画布尺寸
CANVAS_WIDTH: 955
CANVAS_HEIGHT: 800

// 砖块配置
BRICK_ROWS: 6
BRICK_COLS: 14

// 道具生成概率
POWERUP_SPAWN_CHANCE: 0.04 (4%)

// 小球物理
BALL_RADIUS: 10
BALL_SPEEDS: [500, 900, 1300] // 像素/秒
```

## 🎨 自定义修改

### 添加新道具类型
1. 在 `constants.js` 中定义新的道具类型
2. 在 `PowerUp.js` 中添加图标显示
3. 在 `Game.js` 中实现道具效果

### 调整难度曲线
修改 `gameLogic.js` 中的 `generateTopRowBricks` 函数：
```javascript
// 当前：每回合生命值+1
const minHealth = Math.max(1, round);

// 示例：每2回合生命值+1
const minHealth = Math.max(1, Math.floor(round / 2));
```

## 🧪 开发注意事项

### 碰撞检测
- 使用连续碰撞检测而非点检测
- 确保小球在高速移动时不会穿透对象
- 处理边缘情况（角碰撞、同时碰撞多个对象）

### 状态管理
- 保持游戏状态的一致性
- 避免状态更新时的竞态条件
- 合理使用 useCallback 和 useEffect

## 📈 未来改进方向

- [ ] 添加音效和背景音乐
- [ ] 实现更多道具类型（激光、穿透球等）
- [ ] 添加粒子效果和动画
- [ ] 实现关卡编辑器
- [ ] 添加成就系统
- [ ] 支持多人对战模式

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 👨‍💻 作者

开发者：[您的姓名]
- GitHub: [@yourusername](https://github.com/yourusername)
- 邮箱: your.email@example.com

---

⭐ 如果这个项目对您有帮助，请考虑给它一个 Star！ 