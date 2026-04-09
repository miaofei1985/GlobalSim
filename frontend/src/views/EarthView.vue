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

    <!-- Hover Tooltip / Cluster Popup -->
    <div
      v-if="hoveredCluster"
      class="cluster-popup"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="cluster-title">{{ hoveredCluster.region }}</div>
      <div
        v-for="ex in hoveredCluster.exchanges"
        :key="ex.code"
        class="cluster-item"
        @click.stop="goToTrade(ex.symbol)"
      >
        <span class="item-arrow">›</span>
        <span class="item-name">{{ ex.name }}</span>
        <span class="item-code">{{ ex.code }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

const router = useRouter()
const { t, locale } = useI18n()

const loading = ref(true)
const earthContainer = ref(null)
const selectedCountry = ref(null)
const currentLocale = ref(locale.value)
const hoveredCluster = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

let scene, camera, renderer, earth, controls
let animationId

// Country data with exchanges
const countriesData = {
  // === Americas ===
  'US': {
    name: 'United States',
    exchanges: [
      { code: 'NYSE', name: 'New York Stock Exchange', symbol: 'NYSE/GSB' },
      { code: 'NASDAQ', name: 'NASDAQ', symbol: 'NASDAQ/GSB' }
    ]
  },
  'CA': {
    name: 'Canada',
    exchanges: [
      { code: 'TSX', name: 'Toronto Stock Exchange', symbol: 'TSX/GSB' }
    ]
  },
  'BR': {
    name: 'Brasil',
    exchanges: [
      { code: 'B3', name: 'B3 - Brasil Bolsa Balcão', symbol: 'B3/GSB' }
    ]
  },
  'MX': {
    name: 'México',
    exchanges: [
      { code: 'BMV', name: 'Bolsa Mexicana de Valores', symbol: 'BMV/GSB' }
    ]
  },
  'AR': {
    name: 'Argentina',
    exchanges: [
      { code: 'BYMA', name: 'Bolsas y Mercados Argentinos', symbol: 'BYMA/GSB' }
    ]
  },
  // === Europe ===
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
  },
  'FR': {
    name: 'France',
    exchanges: [
      { code: 'EPA', name: 'Euronext Paris', symbol: 'EPA/GSB' }
    ]
  },
  'NL': {
    name: 'Nederland',
    exchanges: [
      { code: 'AMS', name: 'Euronext Amsterdam', symbol: 'AMS/GSB' }
    ]
  },
  'ES': {
    name: 'España',
    exchanges: [
      { code: 'BME', name: 'Bolsa de Madrid', symbol: 'BME/GSB' }
    ]
  },
  'IT': {
    name: 'Italia',
    exchanges: [
      { code: 'MIL', name: 'Borsa Italiana', symbol: 'MIL/GSB' }
    ]
  },
  'CH': {
    name: 'Schweiz',
    exchanges: [
      { code: 'SIX', name: 'SIX Swiss Exchange', symbol: 'SIX/GSB' }
    ]
  },
  'SE': {
    name: 'Sverige',
    exchanges: [
      { code: 'STO', name: 'Nasdaq Stockholm', symbol: 'STO/GSB' }
    ]
  },
  'NO': {
    name: 'Norge',
    exchanges: [
      { code: 'OSL', name: 'Oslo Børs', symbol: 'OSL/GSB' }
    ]
  },
  'DK': {
    name: 'Danmark',
    exchanges: [
      { code: 'CSE', name: 'Nasdaq Copenhagen', symbol: 'CSE/GSB' }
    ]
  },
  'FI': {
    name: 'Suomi',
    exchanges: [
      { code: 'HEL', name: 'Nasdaq Helsinki', symbol: 'HEL/GSB' }
    ]
  },
  'PL': {
    name: 'Polska',
    exchanges: [
      { code: 'GPW', name: 'Giełda Papierów Wartościowych', symbol: 'GPW/GSB' }
    ]
  },
  'RU': {
    name: 'Россия',
    exchanges: [
      { code: 'MOEX', name: 'Moscow Exchange', symbol: 'MOEX/GSB' }
    ]
  },
  'TR': {
    name: 'Türkiye',
    exchanges: [
      { code: 'BIST', name: 'Borsa İstanbul', symbol: 'BIST/GSB' }
    ]
  },
  // === Asia-Pacific ===
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
      { code: 'TSE', name: '東京証券取引所', symbol: 'TSE/GSB' }
    ]
  },
  'HK': {
    name: '香港',
    exchanges: [
      { code: 'HKEX', name: 'Hong Kong Exchanges', symbol: 'HKEX/GSB' }
    ]
  },
  'KR': {
    name: '한국',
    exchanges: [
      { code: 'KRX', name: 'Korea Exchange', symbol: 'KRX/GSB' }
    ]
  },
  'TW': {
    name: '台湾',
    exchanges: [
      { code: 'TWSE', name: 'Taiwan Stock Exchange', symbol: 'TWSE/GSB' }
    ]
  },
  'IN': {
    name: 'India',
    exchanges: [
      { code: 'BSE', name: 'Bombay Stock Exchange', symbol: 'BSE/GSB' },
      { code: 'NSE', name: 'National Stock Exchange', symbol: 'NSE/GSB' }
    ]
  },
  'SG': {
    name: 'Singapore',
    exchanges: [
      { code: 'SGX', name: 'Singapore Exchange', symbol: 'SGX/GSB' }
    ]
  },
  'TH': {
    name: 'Thailand',
    exchanges: [
      { code: 'SET', name: 'Stock Exchange of Thailand', symbol: 'SET/GSB' }
    ]
  },
  'MY': {
    name: 'Malaysia',
    exchanges: [
      { code: 'Bursa', name: 'Bursa Malaysia', symbol: 'Bursa/GSB' }
    ]
  },
  'ID': {
    name: 'Indonesia',
    exchanges: [
      { code: 'IDX', name: 'Indonesia Stock Exchange', symbol: 'IDX/GSB' }
    ]
  },
  'PH': {
    name: 'Philippines',
    exchanges: [
      { code: 'PSE', name: 'Philippine Stock Exchange', symbol: 'PSE/GSB' }
    ]
  },
  'VN': {
    name: 'Việt Nam',
    exchanges: [
      { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange', symbol: 'HOSE/GSB' }
    ]
  },
  'PK': {
    name: 'Pakistan',
    exchanges: [
      { code: 'PSX', name: 'Pakistan Stock Exchange', symbol: 'PSX/GSB' }
    ]
  },
  'AU': {
    name: 'Australia',
    exchanges: [
      { code: 'ASX', name: 'Australian Securities Exchange', symbol: 'ASX/GSB' }
    ]
  },
  'NZ': {
    name: 'New Zealand',
    exchanges: [
      { code: 'NZX', name: 'New Zealand Exchange', symbol: 'NZX/GSB' }
    ]
  },
  // === Middle East & Africa ===
  'SA': {
    name: 'Saudi Arabia',
    exchanges: [
      { code: 'Tadawul', name: 'Saudi Exchange', symbol: 'Tadawul/GSB' }
    ]
  },
  'AE': {
    name: 'UAE',
    exchanges: [
      { code: 'DFM', name: 'Dubai Financial Market', symbol: 'DFM/GSB' },
      { code: 'ADX', name: 'Abu Dhabi Securities Exchange', symbol: 'ADX/GSB' }
    ]
  },
  'QA': {
    name: 'Qatar',
    exchanges: [
      { code: 'QSE', name: 'Qatar Stock Exchange', symbol: 'QSE/GSB' }
    ]
  },
  'IL': {
    name: 'Israel',
    exchanges: [
      { code: 'TASE', name: 'Tel Aviv Stock Exchange', symbol: 'TASE/GSB' }
    ]
  },
  'ZA': {
    name: 'South Africa',
    exchanges: [
      { code: 'JSE', name: 'Johannesburg Stock Exchange', symbol: 'JSE/GSB' }
    ]
  },
  'EG': {
    name: 'Egypt',
    exchanges: [
      { code: 'EGX', name: 'Egyptian Exchange', symbol: 'EGX/GSB' }
    ]
  },
  'NG': {
    name: 'Nigeria',
    exchanges: [
      { code: 'NGX', name: 'Nigerian Exchange', symbol: 'NGX/GSB' }
    ]
  },
  'KE': {
    name: 'Kenya',
    exchanges: [
      { code: 'NSE', name: 'Nairobi Securities Exchange', symbol: 'NSE-KE/GSB' }
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
  
  // Load real Earth texture
  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load('/textures/earth_daymap.jpg')
  earthTexture.wrapS = THREE.RepeatWrapping
  earthTexture.wrapT = THREE.ClampToEdgeWrapping

  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    specular: 0x333333,
    shininess: 15
  })

  earth = new THREE.Mesh(geometry, material)
  scene.add(earth)

  // Add wireframe overlay
  const wireGeo = new THREE.SphereGeometry(5.01, 32, 32)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x4a9eff,
    wireframe: true,
    transparent: true,
    opacity: 0.03
  })
  const wireframe = new THREE.Mesh(wireGeo, wireMat)
  earth.add(wireframe)

  // Atmosphere glow
  const atmosphereGeo = new THREE.SphereGeometry(5.15, 64, 64)
  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
  scene.add(atmosphere)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  // Add hotspot markers for major exchanges
  addHotspots()

  // Orbit controls (drag to rotate, scroll to zoom)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false
  controls.minDistance = 7
  controls.maxDistance = 30
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  
  animate()
  loading.value = false

  // Handle window resize
  window.addEventListener('resize', onWindowResize)
  
  // Add click interaction
  renderer.domElement.addEventListener('click', onMouseClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
}

const addHotspots = () => {
  // Clustered exchanges - nearby exchanges grouped into one marker
  const clusters = [
    // Americas
    { lat: 40.7, lon: -74.0, region: 'New York, USA', exchanges: [
      { code: 'NYSE', name: 'New York Stock Exchange', symbol: 'NYSE/GSB' },
      { code: 'NASDAQ', name: 'NASDAQ', symbol: 'NASDAQ/GSB' }
    ]},
    { lat: 43.65, lon: -79.38, region: 'Toronto, Canada', exchanges: [
      { code: 'TSX', name: 'Toronto Stock Exchange', symbol: 'TSX/GSB' }
    ]},
    { lat: -23.55, lon: -46.63, region: 'São Paulo, Brazil', exchanges: [
      { code: 'B3', name: 'B3 - Brasil Bolsa Balcão', symbol: 'B3/GSB' }
    ]},
    { lat: 19.43, lon: -99.13, region: 'Mexico City', exchanges: [
      { code: 'BMV', name: 'Bolsa Mexicana de Valores', symbol: 'BMV/GSB' }
    ]},
    { lat: -34.60, lon: -58.38, region: 'Buenos Aires, Argentina', exchanges: [
      { code: 'BYMA', name: 'Bolsas y Mercados Argentinos', symbol: 'BYMA/GSB' }
    ]},
    // Europe
    { lat: 51.51, lon: -0.13, region: 'London, UK', exchanges: [
      { code: 'LSE', name: 'London Stock Exchange', symbol: 'LSE/GSB' }
    ]},
    { lat: 50.11, lon: 8.68, region: 'Frankfurt, Germany', exchanges: [
      { code: 'XETRA', name: 'Deutsche Börse XETRA', symbol: 'XETRA/GSB' }
    ]},
    { lat: 48.86, lon: 2.35, region: 'Paris, France', exchanges: [
      { code: 'EPA', name: 'Euronext Paris', symbol: 'EPA/GSB' }
    ]},
    { lat: 52.37, lon: 4.90, region: 'Amsterdam, Netherlands', exchanges: [
      { code: 'AMS', name: 'Euronext Amsterdam', symbol: 'AMS/GSB' }
    ]},
    { lat: 40.42, lon: -3.70, region: 'Madrid, Spain', exchanges: [
      { code: 'BME', name: 'Bolsa de Madrid', symbol: 'BME/GSB' }
    ]},
    { lat: 45.46, lon: 9.19, region: 'Milan, Italy', exchanges: [
      { code: 'MIL', name: 'Borsa Italiana', symbol: 'MIL/GSB' }
    ]},
    { lat: 47.38, lon: 8.54, region: 'Zurich, Switzerland', exchanges: [
      { code: 'SIX', name: 'SIX Swiss Exchange', symbol: 'SIX/GSB' }
    ]},
    // Nordic cluster
    { lat: 58.5, lon: 15.0, region: 'Nordic Exchanges', exchanges: [
      { code: 'STO', name: 'Nasdaq Stockholm', symbol: 'STO/GSB' },
      { code: 'OSL', name: 'Oslo Børs', symbol: 'OSL/GSB' },
      { code: 'CSE', name: 'Nasdaq Copenhagen', symbol: 'CSE/GSB' },
      { code: 'HEL', name: 'Nasdaq Helsinki', symbol: 'HEL/GSB' }
    ]},
    { lat: 52.23, lon: 21.01, region: 'Warsaw, Poland', exchanges: [
      { code: 'GPW', name: 'Giełda Papierów Wartościowych', symbol: 'GPW/GSB' }
    ]},
    { lat: 55.76, lon: 37.62, region: 'Moscow, Russia', exchanges: [
      { code: 'MOEX', name: 'Moscow Exchange', symbol: 'MOEX/GSB' }
    ]},
    { lat: 41.01, lon: 28.98, region: 'Istanbul, Turkey', exchanges: [
      { code: 'BIST', name: 'Borsa İstanbul', symbol: 'BIST/GSB' }
    ]},
    // Asia-Pacific
    // China cluster
    { lat: 27.0, lon: 118.0, region: 'China', exchanges: [
      { code: 'SSE', name: '上海证券交易所', symbol: 'SSE/GSB' },
      { code: 'SZSE', name: '深圳证券交易所', symbol: 'SZSE/GSB' }
    ]},
    { lat: 35.68, lon: 139.65, region: 'Tokyo, Japan', exchanges: [
      { code: 'TSE', name: '東京証券取引所', symbol: 'TSE/GSB' }
    ]},
    { lat: 22.32, lon: 114.17, region: 'Hong Kong', exchanges: [
      { code: 'HKEX', name: 'Hong Kong Exchanges', symbol: 'HKEX/GSB' }
    ]},
    { lat: 37.57, lon: 126.98, region: 'Seoul, South Korea', exchanges: [
      { code: 'KRX', name: 'Korea Exchange', symbol: 'KRX/GSB' }
    ]},
    { lat: 25.03, lon: 121.57, region: 'Taipei, Taiwan', exchanges: [
      { code: 'TWSE', name: 'Taiwan Stock Exchange', symbol: 'TWSE/GSB' }
    ]},
    // India cluster
    { lat: 19.08, lon: 72.88, region: 'India', exchanges: [
      { code: 'BSE', name: 'Bombay Stock Exchange', symbol: 'BSE/GSB' },
      { code: 'NSE', name: 'National Stock Exchange', symbol: 'NSE/GSB' }
    ]},
    { lat: 1.35, lon: 103.82, region: 'Singapore', exchanges: [
      { code: 'SGX', name: 'Singapore Exchange', symbol: 'SGX/GSB' }
    ]},
    { lat: 13.76, lon: 100.50, region: 'Bangkok, Thailand', exchanges: [
      { code: 'SET', name: 'Stock Exchange of Thailand', symbol: 'SET/GSB' }
    ]},
    { lat: 3.14, lon: 101.69, region: 'Kuala Lumpur, Malaysia', exchanges: [
      { code: 'Bursa', name: 'Bursa Malaysia', symbol: 'Bursa/GSB' }
    ]},
    { lat: -6.21, lon: 106.85, region: 'Jakarta, Indonesia', exchanges: [
      { code: 'IDX', name: 'Indonesia Stock Exchange', symbol: 'IDX/GSB' }
    ]},
    { lat: 14.60, lon: 120.98, region: 'Manila, Philippines', exchanges: [
      { code: 'PSE', name: 'Philippine Stock Exchange', symbol: 'PSE/GSB' }
    ]},
    { lat: 10.82, lon: 106.63, region: 'Ho Chi Minh, Vietnam', exchanges: [
      { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange', symbol: 'HOSE/GSB' }
    ]},
    { lat: 24.86, lon: 67.00, region: 'Karachi, Pakistan', exchanges: [
      { code: 'PSX', name: 'Pakistan Stock Exchange', symbol: 'PSX/GSB' }
    ]},
    { lat: -33.87, lon: 151.21, region: 'Sydney, Australia', exchanges: [
      { code: 'ASX', name: 'Australian Securities Exchange', symbol: 'ASX/GSB' }
    ]},
    { lat: -36.85, lon: 174.76, region: 'Auckland, New Zealand', exchanges: [
      { code: 'NZX', name: 'New Zealand Exchange', symbol: 'NZX/GSB' }
    ]},
    // Middle East & Africa
    { lat: 24.71, lon: 46.68, region: 'Riyadh, Saudi Arabia', exchanges: [
      { code: 'Tadawul', name: 'Saudi Exchange', symbol: 'Tadawul/GSB' }
    ]},
    // UAE cluster
    { lat: 24.8, lon: 54.8, region: 'UAE', exchanges: [
      { code: 'DFM', name: 'Dubai Financial Market', symbol: 'DFM/GSB' },
      { code: 'ADX', name: 'Abu Dhabi Securities Exchange', symbol: 'ADX/GSB' }
    ]},
    { lat: 25.29, lon: 51.53, region: 'Doha, Qatar', exchanges: [
      { code: 'QSE', name: 'Qatar Stock Exchange', symbol: 'QSE/GSB' }
    ]},
    { lat: 32.09, lon: 34.78, region: 'Tel Aviv, Israel', exchanges: [
      { code: 'TASE', name: 'Tel Aviv Stock Exchange', symbol: 'TASE/GSB' }
    ]},
    { lat: -33.92, lon: 18.42, region: 'Johannesburg, South Africa', exchanges: [
      { code: 'JSE', name: 'Johannesburg Stock Exchange', symbol: 'JSE/GSB' }
    ]},
    { lat: 30.04, lon: 31.24, region: 'Cairo, Egypt', exchanges: [
      { code: 'EGX', name: 'Egyptian Exchange', symbol: 'EGX/GSB' }
    ]},
    { lat: 6.52, lon: 3.38, region: 'Lagos, Nigeria', exchanges: [
      { code: 'NGX', name: 'Nigerian Exchange', symbol: 'NGX/GSB' }
    ]},
    { lat: -1.29, lon: 36.82, region: 'Nairobi, Kenya', exchanges: [
      { code: 'NSE-KE', name: 'Nairobi Securities Exchange', symbol: 'NSE-KE/GSB' }
    ]}
  ]

  clusters.forEach(cluster => {
    // Single exchange = small dot, multiple = slightly larger
    const size = cluster.exchanges.length > 1 ? 0.08 : 0.06
    const marker = createClusterMarker(cluster.lat, cluster.lon, cluster, size)
    earth.add(marker)
  })
}

const createClusterMarker = (lat, lon, cluster, size) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const radius = 5.05

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = (radius * Math.sin(phi) * Math.sin(theta))
  const y = (radius * Math.cos(phi))

  const geometry = new THREE.SphereGeometry(size, 12, 12)
  const material = new THREE.MeshBasicMaterial({ color: 0xff4444 })
  const marker = new THREE.Mesh(geometry, material)
  marker.position.set(x, y, z)
  marker.userData = { type: 'cluster', cluster: cluster }

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

  if (intersects.length > 0 && intersects[0].object.userData.type === 'cluster') {
    const cluster = intersects[0].object.userData.cluster
    if (cluster.exchanges.length === 1) {
      goToTrade(cluster.exchanges[0].symbol)
    }
    // Multi-exchange: rely on popup click
  }
}

let hoveredMesh = null

const onMouseMove = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(earth.children)
  let foundCluster = false

  if (intersects.length > 0) {
    const hit = intersects[0].object
    if (hit.userData.type === 'cluster') {
      foundCluster = true
      if (hoveredMesh && hoveredMesh !== hit) {
        gsap.to(hoveredMesh.scale, { x: 1, y: 1, z: 1, duration: 0.2 })
      }
      hoveredMesh = hit
      gsap.to(hit.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.2 })

      hoveredCluster.value = hit.userData.cluster
      tooltipPos.value = {
        x: event.clientX - rect.left + 18,
        y: event.clientY - rect.top
      }
      controls.autoRotate = false
      renderer.domElement.style.cursor = 'pointer'
    }
  }

  if (!foundCluster) {
    if (hoveredMesh) {
      gsap.to(hoveredMesh.scale, { x: 1, y: 1, z: 1, duration: 0.2 })
      hoveredMesh = null
    }
    hoveredCluster.value = null
    controls.autoRotate = true
    renderer.domElement.style.cursor = 'grab'
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
  if (controls) {
    controls.dispose()
  }
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.domElement.removeEventListener('click', onMouseClick)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
  }
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

.cluster-popup {
  position: absolute;
  pointer-events: auto;
  z-index: 200;
  background: rgba(10, 10, 30, 0.94);
  backdrop-filter: blur(14px);
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(74, 158, 255, 0.35);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(74, 158, 255, 0.15);
  min-width: 220px;
  max-width: 320px;
  overflow: hidden;
  animation: popupFadeIn 0.18s ease;

  .cluster-title {
    padding: 10px 14px 8px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(74, 158, 255, 0.85);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border-bottom: 1px solid rgba(74, 158, 255, 0.15);
  }

  .cluster-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);

    &:last-child { border-bottom: none; }

    &:hover {
      background: rgba(74, 158, 255, 0.15);
    }

    .item-arrow {
      color: rgba(74, 158, 255, 0.7);
      font-size: 16px;
      font-weight: 700;
      width: 14px;
      flex-shrink: 0;
    }

    .item-name {
      flex: 1;
      font-size: 13px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-code {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 600;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
  }
}

@keyframes popupFadeIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
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
