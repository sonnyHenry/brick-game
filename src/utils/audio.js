const audioCache = {};
let userInteracted = false;
let audioContext;

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
    console.log('音效系统已启用');
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
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);
    
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
 * 播放一个已加载的音效
 * @param {string} soundName - 在预加载时定义的音效名称
 */
export const playSound = (soundName) => {
  if (!userInteracted) {
    // 在用户首次交互前，静默失败
    return;
  }

  const audio = audioCache[soundName];
  
  // 如果音效文件存在且可用，播放音效文件
  if (audio && audio.readyState >= 2) {
    try {
      const audioClone = audio.cloneNode();
      audioClone.currentTime = 0;
      audioClone.volume = 0.3;
      audioClone.play().catch(error => {
        console.warn(`播放音效失败: ${soundName}`, error);
        playFallbackSound(soundName);
      });
      return;
    } catch (error) {
      console.warn(`音效播放错误: ${soundName}`, error);
    }
  }
  
  // 如果音效文件不可用，播放占位符音调
  playFallbackSound(soundName);
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