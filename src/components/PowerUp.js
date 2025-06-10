import React from 'react';
import { POWERUP_TYPES } from '../utils/constants';

/**
 * 道具组件
 * @param {Object} props - 组件属性
 * @param {Object} props.powerUp - 道具对象
 * @param {string} props.className - CSS类名
 */
const PowerUp = ({ powerUp, className = '' }) => {
  if (!powerUp || powerUp.collected) {
    return null;
  }

  const powerUpStyle = {
    position: 'absolute',
    left: powerUp.x - powerUp.size / 2,
    top: powerUp.y - powerUp.size / 2,
    width: powerUp.size,
    height: powerUp.size,
    backgroundColor: powerUp.color,
    border: '2px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#333',
    textShadow: 'none',
    boxShadow: '0 0 15px rgba(255, 255, 0, 0.8)',
    animation: 'powerUpPulse 1s ease-in-out infinite alternate',
    zIndex: 8
  };

  // 根据道具类型显示不同的图标
  const getIcon = (type) => {
    switch (type) {
      case POWERUP_TYPES.MULTI_BALL:
        return '+';
      default:
        return '?';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes powerUpPulse {
            0% { 
              transform: scale(1);
              box-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
            }
            100% { 
              transform: scale(1.1);
              box-shadow: 0 0 25px rgba(255, 255, 0, 1);
            }
          }
        `}
      </style>
      <div 
        className={`powerup ${className}`}
        style={powerUpStyle}
        data-powerup-id={powerUp.id}
        title="增加小球数量"
      >
        {getIcon(powerUp.type)}
      </div>
    </>
  );
};

export default PowerUp; 