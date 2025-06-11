const LEADERBOARD_KEY = 'brickGameLeaderboard';
const MAX_SCORES = 10; // 只保留前10名

/**
 * 获取排行榜分数
 * @returns {Array} 分数数组
 */
export const getScores = () => {
  try {
    const scoresJSON = localStorage.getItem(LEADERBOARD_KEY);
    return scoresJSON ? JSON.parse(scoresJSON) : [];
  } catch (error) {
    console.error("无法加载排行榜:", error);
    return [];
  }
};

/**
 * 添加一条新的分数记录
 * @param {object} newScore - 新分数对象，例如 { name: '玩家', score: 100, difficulty: '困难' }
 * @returns {Array} 更新后的分数数组
 */
export const addScore = (newScore) => {
  try {
    const scores = getScores();
    const scoreData = {
      ...newScore,
      id: `${Date.now()}-${newScore.name}`,
      date: new Date().toISOString()
    };
    
    scores.push(scoreData);
    
    // 按回合数降序排序，如果回合数相同，则按小球数降序
    scores.sort((a, b) => {
      if (b.round !== a.round) {
        return b.round - a.round;
      }
      return b.ballCount - a.ballCount;
    });
    
    // 只保留前10名
    const topScores = scores.slice(0, MAX_SCORES);
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores));
    return topScores;
  } catch (error) {
    console.error("无法保存分数:", error);
    return getScores();
  }
}; 