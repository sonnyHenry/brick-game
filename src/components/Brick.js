import React from 'react';

/**
 * 砖块组件
 * @param {Object} props - 组件属性
 * @param {Object} props.brick - 砖块对象
 * @param {string} props.className - CSS类名
 */
const Brick = ({ brick, className = '' }) => {
  if (!brick || brick.destroyed) {
    return null;
  }

  // 移除根据血量计算透明度的逻辑
  const opacity = 1; // 保持所有砖块完全不透明

  const brickStyle = {
    position: 'absolute',
    left: brick.x,
    top: brick.y,
    width: brick.width,
    height: brick.height,
    backgroundColor: brick.color,
    opacity: opacity,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
    transition: 'opacity 0.1s ease',
    zIndex: 5
  };

  // 移除砖块受击时的动画效果，保持原始大小

  return (
    <div 
      className={`brick ${className}`}
      style={brickStyle}
      data-brick-id={brick.id}
    >
      {brick.health}
    </div>
  );
};

export default Brick; 