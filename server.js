const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const SCORES_FILE = path.join(__dirname, 'scores.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// 初始化分数文件
const initializeScoresFile = async () => {
  try {
    await fs.access(SCORES_FILE);
  } catch (error) {
    await fs.writeFile(SCORES_FILE, JSON.stringify([]), 'utf8');
    console.log('scores.json 文件已创建');
  }
};

// API: 获取排行榜
app.get('/api/scores', async (req, res) => {
  try {
    const data = await fs.readFile(SCORES_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('读取分数失败:', error);
    res.status(500).json({ message: '无法读取排行榜数据' });
  }
});

// API: 添加新分数
app.post('/api/scores', async (req, res) => {
  try {
    const newScore = req.body;
    if (!newScore || !newScore.name || !newScore.round) {
      return res.status(400).json({ message: '无效的分数数据' });
    }

    const data = await fs.readFile(SCORES_FILE, 'utf8');
    const scores = JSON.parse(data);

    const scoreEntry = {
      ...newScore,
      id: `${Date.now()}-${newScore.name}`,
      date: new Date().toISOString()
    };

    scores.push(scoreEntry);
    scores.sort((a, b) => {
      if (b.round !== a.round) return b.round - a.round;
      return b.ballCount - a.ballCount;
    });

    const topScores = scores.slice(0, 10);
    await fs.writeFile(SCORES_FILE, JSON.stringify(topScores, null, 2), 'utf8');
    
    res.status(201).json(topScores);
  } catch (error) {
    console.error('写入分数失败:', error);
    res.status(500).json({ message: '无法保存排行榜数据' });
  }
});

// 处理所有其他路由，返回React应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 启动服务器
app.listen(PORT, async () => {
  await initializeScoresFile();
  console.log(`服务器正在 http://localhost:${PORT} 运行`);
}); 