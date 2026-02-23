// stars.js - 鼠标移动彩色星星特效（加速版）
(function() {
  let lastTime = 0;
  const throttleDelay = 20; // 降低延迟，提高响应速度
  
  // 创建星星元素
  function createStar(x, y) {
    const star = document.createElement('span');
    star.innerHTML = '*';
    star.style.position = 'fixed';
    star.style.left = x + (Math.random() - 0.5) * 15 + 'px'; // 添加随机偏移
    star.style.top = y + (Math.random() - 0.5) * 15 + 'px';
    star.style.color = getRandomColor();
    star.style.fontSize = Math.random() * 16 + 12 + 'px';
    star.style.pointerEvents = 'none';
    star.style.zIndex = '9999';
    star.style.transition = 'opacity 1.2s ease-out, transform 1.2s ease-out'; // 缩短动画时间
    star.style.userSelect = 'none';
    star.style.textShadow = '0 0 6px currentColor'; // 添加发光效果
    
    // 添加到页面
    document.body.appendChild(star);
    
    // 动画效果
    setTimeout(() => {
      star.style.opacity = '0';
      star.style.transform = 'translateY(-40px) scale(0)'; // 更快的上升效果
    }, 30);
    
    // 1.2秒后移除元素
    setTimeout(() => {
      if (star.parentNode) {
        star.parentNode.removeChild(star);
      }
    }, 1200);
    
    return star;
  }
  
  // 随机颜色
  function getRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
      '#00d2d3', '#ff9f43', '#10ac84', '#ee5a6f',
      '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f' // 增加更多颜色
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // 鼠标移动事件（节流优化）
  function handleMouseMove(e) {
    const currentTime = Date.now();
    if (currentTime - lastTime < throttleDelay) return;
    lastTime = currentTime;
    
    // 大幅提高星星生成频率
    if (Math.random() > 0.3) { // 70%概率生成（原来30%）
      createStar(e.clientX, e.clientY);
    }
  }
  
  // 触摸事件（移动端）
  function handleTouchMove(e) {
    const currentTime = Date.now();
    if (currentTime - lastTime < throttleDelay) return;
    lastTime = currentTime;
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (Math.random() > 0.4) { // 60%概率生成
        createStar(touch.clientX, touch.clientY);
      }
    }
  }
  
  // 页面加载完成后绑定事件
  document.addEventListener('DOMContentLoaded', function() {
    // PC端鼠标事件
    document.addEventListener('mousemove', handleMouseMove);
    
    // 移动端触摸事件
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
  });
  
  // 如果页面已经加载完成，直接绑定事件
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
  }
})();
