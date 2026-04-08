<template>
  <div class="earth-container">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ t('earth.loading') }}</p>
    </div>

    <!-- Header -->
    <header class="earth-header">
      <div class="logo">
        <h1>GlobalSim</h1>
        <span class="tagline">{{ t('earth.title') }}</span>
      </div>
      
      <nav class="main-nav">
        <a href="#" @click.prevent="$router.push('/')">{{ t('nav.home') }}</a>
        <a href="#" @click.prevent="$router.push('/wallet')">{{ t('nav.wallet') }}</a>
        <a href="#" @click.prevent="logout">{{ t('nav.profile') }}</a>
        
        <!-- Language Switcher -->
        <select v-model="currentLocale" @change="changeLocale" class="lang-switcher">
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="ja">日本語</option>
          <option value="hi">हिन्दी</option>
          <option value="es">Español</option>
          <option value="bn">বাংলা</option>
          <option value="pt-BR">Português</option>
          <option value="ru">Русский</option>
          <option value="fr">Français</option>
        </select>
      </nav>
    </header>

    <!-- 3D Earth Canvas -->
    <div ref="earthContainer" class="earth-canvas"></div>

    <!-- Country Info Panel -->
    <transition name="slide-fade">
      <div v-if="selectedCountry" class="country-panel">
        <button class="close-btn" @click="selectedCountry = null">×</button>
        <h2>{{ selectedCountry.name }}</h2>
        <div class="exchanges-list">
          <h3>{{ t('earth.subtitle') }}</h3>
          <ul>
            <li 
              v-for="exchange in selectedCountry.exchanges" 
              :key="exchange.code"
              @click="goToTrade(exchange.symbol)"
              class="exchange-item"
            >
              <span class="exchange-name">{{ exchange.name }}</span>
              <span class="exchange-code">{{ exchange.code }}</span>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <!-- Hotspots Legend -->
    <div class="legend">
      <h4>市场热度</h4>
      <div class="legend-item">
        <span class="dot high"></span> 高活跃度
      </div>
      <div class="legend-item">
        <span class="dot medium"></span> 中等活跃
      </div>
      <div class="legend-item">
        <span class="dot low"></span> 低活跃
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { gsap } from 'gsap'

const router = useRouter()
const { t, locale } = useI18n()

const loading = ref(true)
const earthContainer = ref(null)
const selectedCountry = ref(null)
const currentLocale = ref(locale.value)

let scene, camera, renderer, earth, controls
let animationId

// Country data with exchanges
const countriesData = {
  'US': {
    name: 'United States',
    exchanges: [
      { code: 'NYSE', name: 'New York Stock Exchange', symbol: 'NYSE/GSB' },
      { code: 'NASDAQ', name: 'NASDAQ', symbol: 'NASDAQ/GSB' }
    ]
  },
  'CN': {
    name: '中国',
    exchanges: [
      { code: 'SSE', name: '上海证券交易所', symbol: 'SSE/GSB' },
      { code: 'SZSE', name: '深圳证券交易所', symbol: 'SZSE/GSB' }
    ]
  },
  'JP': {
    name: '日本',
    exchanges: [
      { code: 'TSE', name: 'Tokyo Stock Exchange', symbol: 'TSE/GSB' }
    ]
  },
  'GB': {
    name: 'United Kingdom',
    exchanges: [
      { code: 'LSE', name: 'London Stock Exchange', symbol: 'LSE/GSB' }
    ]
  },
  'DE': {
    name: 'Deutschland',
    exchanges: [
      { code: 'XETRA', name: 'Deutsche Börse XETRA', symbol: 'XETRA/GSB' }
    ]
  }
}

// Initialize 3D Earth
const initEarth = () => {
  const container = earthContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.z = 15

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // Earth Sphere
  const geometry = new THREE.SphereGeometry(5, 64, 64)
  
  // Create a simple earth material with grid
  const material = new THREE.MeshPhongMaterial({
    color: 0x1a4d7c,
    emissive: 0x0a1a3a,
    specular: 0x333333,
    shininess: 15,
    wireframe: false
  })
  
  earth = new THREE.Mesh(geometry, material)
  scene.add(earth)

  // Add wireframe overlay
  const wireGeo = new THREE.SphereGeometry(5.01, 32, 32)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x4a9eff,
    wireframe: true,
    transparent: true,
    opacity: 0.1
  })
  const wireframe = new THREE.Mesh(wireGeo, wireMat)
  earth.add(wireframe)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  // Add hotspot markers for major exchanges
  addHotspots()

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    // Auto rotation
    earth.rotation.y += 0.001
    
    renderer.render(scene, camera)
  }
  
  animate()
  loading.value = false

  // Handle window resize
  window.addEventListener('resize', onWindowResize)
  
  // Add click interaction
  renderer.domElement.addEventListener('click', onMouseClick)
}

const addHotspots = () => {
  const hotspots = [
    { lat: 40.7128, lon: -74.0060, name: 'New York' },  // NYSE/NASDAQ
    { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },     // TSE
    { lat: 51.5074, lon: -0.1278, name: 'London' },     // LSE
    { lat: 50.1109, lon: 8.6821, name: 'Frankfurt' },   // XETRA
    { lat: 31.2304, lon: 121.4737, name: 'Shanghai' }   // SSE
  ]

  hotspots.forEach(spot => {
    const marker = createMarker(spot.lat, spot.lon)
    earth.add(marker)
  })
}

const createMarker = (lat, lon) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const radius = 5.05

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = (radius * Math.sin(phi) * Math.sin(theta))
  const y = (radius * Math.cos(phi))

  const geometry = new THREE.SphereGeometry(0.08, 16, 16)
  const material = new THREE.MeshBasicMaterial({ color: 0xff4444 })
  const marker = new THREE.Mesh(geometry, material)
  
  marker.position.set(x, y, z)
  marker.userData = { type: 'hotspot' }
  
  return marker
}

const onWindowResize = () => {
  if (!earthContainer.value) return
  
  const width = earthContainer.value.clientWidth
  const height = earthContainer.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const onMouseClick = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(earth.children)
  
  if (intersects.length > 0) {
    const clicked = intersects[0].object
    
    if (clicked.userData.type === 'hotspot') {
      // Show country panel (simplified for demo)
      selectedCountry.value = countriesData['US'] // Demo: always show US
    }
  }
}

const goToTrade = (symbol) => {
  router.push(`/trade/${encodeURIComponent(symbol)}`)
}

const changeLocale = () => {
  locale.value = currentLocale.value
  document.documentElement.dir = currentLocale.value === 'ar' ? 'rtl' : 'ltr'
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(() => {
  initEarth()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', onWindowResize)
  if (renderer && earthContainer.value) {
    earthContainer.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped lang="scss">
.earth-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  background: rgba(10, 10, 26, 0.95);
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(74, 158, 255, 0.3);
    border-top-color: #4a9eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  p {
    color: #fff;
    margin-top: 20px;
    font-size: 16px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.earth-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  
  .logo {
    h1 {
      color: #4a9eff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    
    .tagline {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin-left: 10px;
    }
  }
  
  .main-nav {
    display: flex;
    gap: 30px;
    align-items: center;
    
    a {
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
      
      &:hover {
        color: #4a9eff;
      }
    }
    
    .lang-switcher {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      outline: none;
      
      option {
        background: #1a1a3a;
        color: #fff;
      }
    }
  }
}

.earth-canvas {
  width: 100%;
  height: 100%;
}

.country-panel {
  position: absolute;
  top: 100px;
  right: 40px;
  width: 320px;
  background: rgba(26, 26, 58, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  
  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 24px;
    cursor: pointer;
    transition: color 0.3s;
    
    &:hover {
      color: #fff;
    }
  }
  
  h2 {
    margin: 0 0 20px 0;
    font-size: 22px;
    color: #4a9eff;
  }
  
  .exchanges-list {
    h3 {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 12px;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .exchange-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(74, 158, 255, 0.1);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(74, 158, 255, 0.2);
        transform: translateX(-4px);
      }
      
      .exchange-name {
        font-size: 14px;
      }
      
      .exchange-code {
        font-size: 12px;
        color: #4a9eff;
        font-weight: 600;
      }
    }
  }
}

.legend {
  position: absolute;
  bottom: 40px;
  left: 40px;
  background: rgba(26, 26, 58, 0.9);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(74, 158, 255, 0.2);
  color: #fff;
  z-index: 100;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      
      &.high { background: #ff4444; }
      &.medium { background: #ffaa44; }
      &.low { background: #44ff88; }
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(50px);
  opacity: 0;
}
</style>
