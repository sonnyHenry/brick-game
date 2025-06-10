const audioCache = {};
let userInteracted = false;
let audioContext = null;

/**
 * 启用音效系统（需要用户交互后调用）
 */
export const enableAudio = () => {
  if (userInteracted) return;
  userInteracted = true;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // 如果音频上下文处于暂停状态，尝试恢复它
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    console.log("音频上下文已启用");
  } catch (error) {
    console.error('无法初始化音效系统:', error);
  }
};

/**
 * 创建一个简单的音调作为占位符
 * @param {number} frequency - 频率
 * @param {number} duration - 持续时间（毫秒）
 * @param {number} volume - 音量 (0-1)
 */
const createTone = (frequency, duration, volume = 0.1) => {
  if (!audioContext || !userInteracted) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn('无法播放音调:', error);
  }
};

/**
 * 预加载音效文件到缓存中
 * @param {Array<Object>} soundList - 要加载的声音列表，格式为 { name, src }
 */
export const preloadSounds = (soundList) => {
  console.log('正在预加载音效...');
  soundList.forEach(sound => {
    try {
      const audio = new Audio(sound.src);
      audio.preload = 'auto';
      audio.volume = 0.3; // 设置默认音量
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`音效加载成功: ${sound.name}`);
      });
      
      audio.addEventListener('error', (e) => {
        console.warn(`音效加载失败: ${sound.name}`, e);
        // 为加载失败的音效创建占位符
        audioCache[sound.name] = null;
      });
      
      audio.load();
      audioCache[sound.name] = audio;
    } catch (error) {
      console.error(`音效预加载失败: ${sound.name}`, error);
      audioCache[sound.name] = null;
    }
  });
  console.log('音效预加载完成，总数:', Object.keys(audioCache).length);
};

/**
 * 播放声音。
 * 如果对应的音频缓冲区存在，则播放它。
 * 否则，播放一个备用的合成音效。
 * @param {string} soundName - 要播放的声音的名称（例如 'hit_low'）
 */
export const playSound = (soundName) => {
  if (!audioContext || !userInteracted) {
    console.warn("音频未启用，无法播放声音。");
    return;
  }
  
  // 由于我们只使用备用音效，直接调用它
  playFallbackSound(soundName);
};

/**
 * 停止所有当前正在播放的声音。
 * 这对于在游戏结束或重置时清理声音很有用。
 */
export const stopAllSounds = () => {
  // 当前实现中，合成音效很短，不需要手动停止。
  // 如果未来添加了循环的背景音乐，需要在这里实现停止逻辑。
  console.log("停止所有声音（当前无操作）");
};

/**
 * 播放占位符音效
 * @param {string} soundName - 音效名称
 */
const playFallbackSound = (soundName) => {
  if (!audioContext || !userInteracted) return;
  
  const soundMap = {
    'hit_low': () => createTone(200, 100, 0.15),
    'hit_medium': () => createTone(400, 150, 0.2),
    'hit_high': () => createTone(600, 200, 0.25),
    'bounce': () => createTone(800, 80, 0.1),
    'powerup': () => {
      createTone(440, 100, 0.2);
      setTimeout(() => createTone(880, 100, 0.2), 100);
    },
    'game_over': () => {
      createTone(200, 500, 0.3);
      setTimeout(() => createTone(150, 500, 0.3), 200);
    },
    'launch': () => createTone(300, 120, 0.15)
  };
  
  const soundFunc = soundMap[soundName];
  if (soundFunc) {
    console.log(`播放占位符音效: ${soundName}`);
    soundFunc();
  } else {
    console.warn(`未知音效: ${soundName}`);
  }
}; 