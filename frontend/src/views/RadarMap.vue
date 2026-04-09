<template>
  <div class="radar-map" ref="mapContainer">
    <!-- 背景网格 -->
    <canvas ref="gridCanvas" class="grid-canvas"></canvas>
    
    <!-- 射线层 -->
    <canvas ref="rayCanvas" class="ray-canvas"></canvas>
    
    <!-- 交易所标记点 -->
    <div 
      v-for="exchange in exchanges" 
      :key="exchange.id"
      class="exchange-marker"
      :style="{ left: exchange.x + '%', top: exchange.y + '%' }"
      @click="selectExchange(exchange)"
    >
      <div class="marker-dot"></div>
      <div class="marker-label">{{ t(`exchanges.${exchange.id}`) }}</div>
    </div>

    <!-- 个股列表面板 (点击交易所后弹出) -->
    <div v-if="selectedExchange" class="stock-panel-overlay" @click.self="selectedExchange = null">
      <div class="stock-panel">
        <div class="panel-header">
          <h2>{{ t(`exchanges.${selectedExchange.id}`) }}</h2>
          <button class="close-btn" @click="selectedExchange = null">×</button>
        </div>
        <StockListPanel 
          :exchange="selectedExchange.code" 
          @select-stock="handleSelectStock"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import StockListPanel from '@/components/StockListPanel.vue';

const { t } = useI18n();
const router = useRouter();

const mapContainer = ref(null);
const gridCanvas = ref(null);
const rayCanvas = ref(null);

const mouseX = ref(window.innerWidth / 2);
const mouseY = ref(window.innerHeight / 2);
const selectedExchange = ref(null);

// 全球主要交易所坐标 (百分比)
const exchanges = [
  { id: 'NYSE', code: 'NYSE', x: 28, y: 45 },   // 纽约
  { id: 'NASDAQ', code: 'NASDAQ', x: 27, y: 43 }, // 纳斯达克
  { id: 'LSE', code: 'LSE', x: 48, y: 38 },     // 伦敦
  { id: 'TSE', code: 'TSE', x: 85, y: 35 },     // 东京
  { id: 'SSE', code: 'SSE', x: 78, y: 42 },     // 上海
  { id: 'HKEX', code: 'HKEX', x: 76, y: 52 },   // 香港
  { id: 'FRA', code: 'FRA', x: 50, y: 36 }      // 法兰克福
];

let animationFrameId = null;
let gridCtx = null;
let rayCtx = null;

// 初始化 Canvas
const initCanvas = () => {
  if (!mapContainer.value) return;
  
  const { width, height } = mapContainer.value.getBoundingClientRect();
  
  // 设置 Canvas 尺寸
  [gridCanvas.value, rayCanvas.value].forEach(canvas => {
    canvas.width = width;
    canvas.height = height;
  });
  
  gridCtx = gridCanvas.value.getContext('2d');
  rayCtx = rayCanvas.value.getContext('2d');
  
  drawGrid();
  animateRays();
};

// 绘制背景网格
const drawGrid = () => {
  if (!gridCtx || !gridCanvas.value) return;
  
  const { width, height } = gridCanvas.value;
  gridCtx.clearRect(0, 0, width, height);
  
  // 绘制科技风格网格
  gridCtx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
  gridCtx.lineWidth = 1;
  
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    gridCtx.beginPath();
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, height);
    gridCtx.stroke();
  }
  
  for (let y = 0; y < height; y += gridSize) {
    gridCtx.beginPath();
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(width, y);
    gridCtx.stroke();
  }
  
  // 绘制世界地图轮廓 (简化版)
  drawWorldMapOutline(gridCtx, width, height);
};

// 简化版世界地图轮廓
const drawWorldMapOutline = (ctx, width, height) => {
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(0, 243, 255, 0.03)';
  
  // 这里用简化的多边形表示大陆，实际项目中可以使用 GeoJSON
  const continents = [
    // 北美
    [{x: 0.15, y: 0.25}, {x: 0.35, y: 0.25}, {x: 0.35, y: 0.5}, {x: 0.2, y: 0.55}, {x: 0.15, y: 0.4}],
    // 南美
    [{x: 0.25, y: 0.55}, {x: 0.35, y: 0.55}, {x: 0.32, y: 0.8}, {x: 0.25, y: 0.75}],
    // 欧洲
    [{x: 0.45, y: 0.25}, {x: 0.55, y: 0.25}, {x: 0.53, y: 0.4}, {x: 0.45, y: 0.38}],
    // 非洲
    [{x: 0.45, y: 0.42}, {x: 0.55, y: 0.42}, {x: 0.55, y: 0.7}, {x: 0.45, y: 0.68}],
    // 亚洲
    [{x: 0.6, y: 0.25}, {x: 0.9, y: 0.25}, {x: 0.85, y: 0.55}, {x: 0.6, y: 0.5}],
    // 大洋洲
    [{x: 0.8, y: 0.65}, {x: 0.92, y: 0.65}, {x: 0.9, y: 0.8}, {x: 0.8, y: 0.78}]
  ];
  
  continents.forEach(points => {
    ctx.beginPath();
    points.forEach((point, i) => {
      const px = point.x * width;
      const py = point.y * height;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
};

// 动画射线
const animateRays = () => {
  if (!rayCtx || !rayCanvas.value) return;
  
  const { width, height } = rayCanvas.value;
  rayCtx.clearRect(0, 0, width, height);
  
  // 从鼠标位置发射射线
  const centerX = mouseX.value;
  const centerY = mouseY.value;
  
  const rayCount = 12;
  const time = Date.now() * 0.001;
  
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + time * 0.5;
    const length = 150 + Math.sin(time * 2 + i) * 50;
    
    const endX = centerX + Math.cos(angle) * length;
    const endY = centerY + Math.sin(angle) * length;
    
    // 创建渐变
    const gradient = rayCtx.createLinearGradient(centerX, centerY, endX, endY);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
    
    rayCtx.strokeStyle = gradient;
    rayCtx.lineWidth = 2;
    rayCtx.beginPath();
    rayCtx.moveTo(centerX, centerY);
    rayCtx.lineTo(endX, endY);
    rayCtx.stroke();
  }
  
  // 绘制鼠标光晕
  const glowGradient = rayCtx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, 100
  );
  glowGradient.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
  glowGradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
  
  rayCtx.fillStyle = glowGradient;
  rayCtx.beginPath();
  rayCtx.arc(centerX, centerY, 100, 0, Math.PI * 2);
  rayCtx.fill();
  
  animationFrameId = requestAnimationFrame(animateRays);
};

// 选择交易所
const selectExchange = (exchange) => {
  selectedExchange.value = exchange;
};

// 选择股票并跳转到交易页面
const handleSelectStock = (stock) => {
  router.push({
    path: '/trade',
    query: { 
      symbol: stock.symbol,
      exchange: stock.exchange
    }
  });
};

// 鼠标移动事件
const handleMouseMove = (e) => {
  if (!mapContainer.value) return;
  const rect = mapContainer.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

// 窗口大小变化
const handleResize = () => {
  initCanvas();
};

onMounted(() => {
  initCanvas();
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.radar-map {
  position: relative;
  width: 100%;
  height: 100vh;
  background: radial-gradient(ellipse at center, #0a0f1c 0%, #05080f 100%);
  overflow: hidden;
}

.grid-canvas,
.ray-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.exchange-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: transform 0.3s;
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
    
    .marker-dot {
      box-shadow: 0 0 30px rgba(0, 243, 255, 0.8);
    }
  }
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #00f3ff;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.6);
  animation: pulse 2s infinite;
}

.marker-label {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: #00f3ff;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.8);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(0, 243, 255, 0.3);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.stock-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.stock-panel {
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  background: rgba(13, 17, 23, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(0, 243, 255, 0.3);
  box-shadow: 0 0 50px rgba(0, 243, 255, 0.2);
  overflow: hidden;
  animation: slideUp 0.3s;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    color: #00f3ff;
    font-size: 20px;
    margin: 0;
  }
  
  .close-btn {
    background: transparent;
    border: none;
    color: #718096;
    font-size: 32px;
    cursor: pointer;
    transition: color 0.3s;
    
    &:hover {
      color: #fff;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
