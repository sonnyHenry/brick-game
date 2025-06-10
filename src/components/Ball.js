import React from 'react';

/**
 * 小球组件
 * @param {Object} props - 组件属性
 * @param {Object} props.ball - 小球对象
 * @param {string} props.className - CSS类名
 */
const Ball = ({ ball, className = '' }) => {
  if (!ball || !ball.active) {
    return null;
  }

  const ballStyle = {
    position: 'absolute',
    left: ball.x - ball.radius,
    top: ball.y - ball.radius,
    width: ball.radius * 2,
    height: ball.radius * 2,
    backgroundColor: ball.color,
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
    transition: 'none',
    zIndex: 10
  };

  return (
    <div 
      className={`ball ${className}`}
      style={ballStyle}
      data-ball-id={ball.id}
    />
  );
};

export default Ball; 