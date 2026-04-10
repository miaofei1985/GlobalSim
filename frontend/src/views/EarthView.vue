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
        
        <select v-model="currentLocale" @change="changeLocale" class="lang-switcher">
          <option
            v-for="option in languageOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </nav>
    </header>

    <!-- 3D Earth Canvas -->
    <div ref="earthContainer" class="earth-canvas"></div>

    <!-- Country Info Panel -->
    <transition name="slide-fade">
      <div v-if="selectedCountry" class="country-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">{{ t('earth.autoFocus') }}</p>
            <h2>{{ selectedCountryDisplayName }}</h2>
          </div>
          <div class="panel-badge" :class="trendClass(selectedCountry.primaryIndex?.change_percent)">
            <span class="badge-label">
              {{ selectedCountry.primaryIndex?.name || t('earth.noLiveBenchmark') }}
            </span>
            <span class="badge-value">{{ formatChange(selectedCountry.primaryIndex?.change_percent) }}</span>
          </div>
        </div>
        <p class="panel-caption">{{ selectedCountryCaption }}</p>
        <div class="exchanges-list">
          <h3>{{ t('earth.subtitle') }}</h3>
          <ul>
            <li 
              v-for="exchange in selectedCountry.exchanges" 
              :key="exchange.code"
              @click="goToTrade(exchange.symbol)"
              class="exchange-item"
            >
              <div class="exchange-copy">
                <span class="exchange-name">{{ exchange.name }}</span>
                <span class="exchange-code">{{ exchange.code }}</span>
              </div>
              <div class="exchange-meta">
                <span class="exchange-index">
                  {{ exchange.indexData?.name || t('earth.liveBenchmarkUnavailable') }}
                </span>
                <span class="exchange-change" :class="trendClass(exchange.indexData?.change_percent)">
                  {{ formatChange(exchange.indexData?.change_percent) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <div class="legend">
      <h4>{{ t('earth.legendTitle') }}</h4>
      <div class="legend-item">
        <span class="dot up"></span> {{ t('earth.benchmarkUp') }}
      </div>
      <div class="legend-item">
        <span class="dot down"></span> {{ t('earth.benchmarkDown') }}
      </div>
      <div class="legend-item">
        <span class="dot neutral"></span> {{ t('earth.benchmarkUnavailable') }}
      </div>
    </div>

    <!-- Hover Tooltip / Cluster Popup -->
    <div
      v-if="hoveredCluster"
      class="cluster-popup"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="cluster-title">
        {{ getClusterDisplayName(hoveredCluster) }}
        <span 
          v-if="hoveredClusterIndex"
          class="cluster-index"
          :class="trendClass(hoveredClusterIndex.change_percent)"
        >
          {{ hoveredClusterIndex.name }}
          {{ formatChange(hoveredClusterIndex.change_percent) }}
        </span>
      </div>
      <div
        v-for="ex in hoveredCluster.exchanges"
        :key="ex.code"
        class="cluster-item"
        @click.stop="goToTrade(ex.symbol)"
      >
        <span class="item-arrow">-&gt;</span>
        <span class="item-name">{{ ex.name }}</span>
        <span class="item-code">{{ ex.code }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'
import { marketApi } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()
const LANGUAGE_CODES = ['zh-CN', 'en', 'ar', 'ja', 'hi', 'es', 'bn', 'pt-BR', 'ru', 'fr']
const SPECIAL_REGION_COUNTRIES = new Set(['SE'])
const FALLBACK_LANGUAGE_LABELS = {
  'zh-CN': 'Chinese',
  en: 'English',
  ar: 'Arabic',
  ja: 'Japanese',
  hi: 'Hindi',
  es: 'Spanish',
  bn: 'Bengali',
  'pt-BR': 'Portuguese (Brazil)',
  ru: 'Russian',
  fr: 'French'
}

const loading = ref(true)
const earthContainer = ref(null)
const selectedCountry = ref(null)
const currentLocale = ref(locale.value)
const hoveredCluster = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const tempMarkerPosition = new THREE.Vector3()
const tempCameraPosition = new THREE.Vector3()

let scene, camera, renderer, earth, controls
let animationId
let refreshTimer
let indicesData = []
let indicesByCode = new Map()
let clusterMap = {}

const COUNTRY_LABELS = {
  US: 'United States',
  CA: 'Canada',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  ES: 'Spain',
  IT: 'Italy',
  CH: 'Switzerland',
  SE: 'Nordic Exchanges',
  PL: 'Poland',
  RU: 'Russia',
  TR: 'Turkey',
  CN: 'China',
  JP: 'Japan',
  HK: 'Hong Kong',
  KR: 'South Korea',
  TW: 'Taiwan',
  IN: 'India',
  SG: 'Singapore',
  TH: 'Thailand',
  MY: 'Malaysia',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  PK: 'Pakistan',
  AU: 'Australia',
  NZ: 'New Zealand',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  QA: 'Qatar',
  IL: 'Israel',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya'
}

const PRIMARY_INDEX_BY_COUNTRY = {
  US: 'SPX',
  CA: 'TSX',
  BR: 'BVSP',
  MX: 'MXX',
  AR: 'MERVAL',
  GB: 'UKX',
  DE: 'DAX',
  FR: 'CAC40',
  NL: 'AEX',
  ES: 'IBEX35',
  IT: 'FTSEMIB',
  CH: 'SMI',
  SE: 'OMXS30',
  PL: 'WIG20',
  RU: 'IMOEX',
  TR: 'XU100',
  CN: 'SSE',
  JP: 'N225',
  HK: 'HSI',
  KR: 'KOSPI',
  TW: 'TWSE',
  IN: 'NIFTY50',
  SG: 'STI',
  TH: 'SET',
  MY: 'KLCI',
  ID: 'JKSE',
  PH: 'PSEi',
  VN: 'VNINDEX',
  PK: 'KSE100',
  AU: 'ASX200',
  NZ: 'NZX50',
  SA: 'TASI',
  AE: 'ADI',
  QA: 'QSI',
  IL: 'TA125',
  ZA: 'JALSH',
  EG: 'EGX30',
  NG: 'NGSEASI',
  KE: 'NSE20'
}

const INDEX_BY_EXCHANGE_CODE = {
  NYSE: 'DJIA',
  NASDAQ: 'IXIC',
  TSX: 'TSX',
  B3: 'BVSP',
  BMV: 'MXX',
  BYMA: 'MERVAL',
  LSE: 'UKX',
  XETRA: 'DAX',
  EPA: 'CAC40',
  AMS: 'AEX',
  BME: 'IBEX35',
  MIL: 'FTSEMIB',
  SIX: 'SMI',
  STO: 'OMXS30',
  OSL: 'OBX',
  CSE: 'OMXC25',
  HEL: 'OMXHPI',
  GPW: 'WIG20',
  MOEX: 'IMOEX',
  BIST: 'XU100',
  SSE: 'SSE',
  SZSE: 'SZSE',
  TSE: 'N225',
  HKEX: 'HSI',
  KRX: 'KOSPI',
  TWSE: 'TWSE',
  BSE: 'SENSEX',
  NSE: 'NIFTY50',
  SGX: 'STI',
  SET: 'SET',
  Bursa: 'KLCI',
  IDX: 'JKSE',
  PSE: 'PSEi',
  HOSE: 'VNINDEX',
  PSX: 'KSE100',
  ASX: 'ASX200',
  NZX: 'NZX50',
  Tadawul: 'TASI',
  DFM: 'DFM',
  ADX: 'ADI',
  QSE: 'QSI',
  TASE: 'TA125',
  JSE: 'JALSH',
  EGX: 'EGX30',
  NGX: 'NGSEASI',
  'NSE-KE': 'NSE20'
}

const selectedCountryCaption = computed(() => getIndexCaption(selectedCountry.value?.primaryIndex))
const selectedCountryDisplayName = computed(() => getClusterDisplayName(selectedCountry.value))
const hoveredClusterIndex = computed(() =>
  hoveredCluster.value ? getIndexForCluster(hoveredCluster.value) : null
)
const languageOptions = computed(() =>
  LANGUAGE_CODES.map((value) => ({
    value,
    label: getLanguageLabel(value)
  }))
)

const getDisplayNames = (type) => {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') {
    return null
  }

  try {
    return new Intl.DisplayNames([currentLocale.value || locale.value || 'en'], { type })
  } catch (error) {
    return null
  }
}

const getLanguageLabel = (languageCode) => {
  const label = getDisplayNames('language')?.of(languageCode)
  return label || FALLBACK_LANGUAGE_LABELS[languageCode] || languageCode
}

const getCountryLabel = (countryCode) => {
  if (!countryCode) return ''

  if (SPECIAL_REGION_COUNTRIES.has(countryCode)) {
    return t(`earth.specialRegions.${countryCode}`)
  }

  const label = getDisplayNames('region')?.of(countryCode)
  return label || COUNTRY_LABELS[countryCode] || countryCode
}

const getClusterDisplayName = (cluster) => {
  if (!cluster) return ''

  return getCountryLabel(cluster.country_code) || cluster.region
}

const getSourceLabel = (source) => {
  if (source === 'yahoo') return t('earth.sources.yahoo')
  if (source === 'eastmoney') return t('earth.sources.eastmoney')
  if (!source) return t('earth.sources.marketFeed')
  return source
}

const formatUtcTimestamp = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(currentLocale.value || 'en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date)
}

const getIndexCaption = (indexData) => {
  if (!indexData) {
    return t('earth.noVerifiedBenchmark')
  }

  const timestamp = indexData.as_of || indexData.updated_at
  const formatted = formatUtcTimestamp(timestamp)

  const timing = indexData.is_delayed ? t('earth.delayedBenchmark') : t('earth.liveBenchmark')
  const source = getSourceLabel(indexData.source)

  return formatted
    ? t('earth.updatedFromSource', { timing, source, time: formatted })
    : t('earth.updatedFromSourceNoTime', { timing, source })
}

const getIndexByCode = (indexCode) => {
  if (!indexCode) return null
  return indicesByCode.get(indexCode) || null
}

const getIndexForExchange = (exchange, cluster) => {
  const indexCode = INDEX_BY_EXCHANGE_CODE[exchange.code] || PRIMARY_INDEX_BY_COUNTRY[cluster.country_code]
  return getIndexByCode(indexCode)
}

// Fetch market indices from API
  const fetchIndices = async () => {
  try {
    const response = await marketApi.getIndices({ realOnly: true, freshOnly: true })
    const rows = Array.isArray(response.data?.data) ? response.data.data : []

    indicesData = rows.filter((row) => row?.source && row.source !== 'seed')
    indicesByCode = new Map(indicesData.map((row) => [row.code, row]))
    applyClusterColors()

    if (selectedCountry.value?.country_code) {
      const activeCluster = clusterMap[selectedCountry.value.country_code]
      if (activeCluster) {
        selectCluster(activeCluster)
      }
    }
  } catch (error) {
    console.warn('Failed to fetch live benchmark indices:', error)
    indicesData = []
    indicesByCode = new Map()
    applyClusterColors()
  }
}

// Get index data for a cluster by country_code
const getIndexForCluster = (cluster) => {
  if (!cluster?.country_code) return null

  const primaryCode = PRIMARY_INDEX_BY_COUNTRY[cluster.country_code]
  if (primaryCode && indicesByCode.has(primaryCode)) {
    return indicesByCode.get(primaryCode)
  }

  return indicesData.find((indexEntry) => indexEntry.country_code === cluster.country_code) || null
}

const formatChange = (value) => {
  const numericValue = parseFloat(value)
  if (!Number.isFinite(numericValue)) return '--'
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(2)}%`
}

const trendClass = (value) => {
  const numericValue = parseFloat(value)
  if (!Number.isFinite(numericValue)) return 'neutral'
  return numericValue >= 0 ? 'up' : 'down'
}

const getDotColor = (indexData) => {
  const numericValue = Number(indexData?.change_percent)
  if (!Number.isFinite(numericValue)) return 0x94a3b8
  return numericValue >= 0 ? 0x22c55e : 0xef4444
}

const applyClusterColors = () => {
  if (!earth) return

  earth.children.forEach((child) => {
    if (!child.userData?.country_code) return
    const dotColor = getDotColor(getIndexForCluster(clusterMap[child.userData.country_code]))
    child.material.color.setHex(dotColor)
  })
}

const selectCluster = (cluster) => {
  selectedCountry.value = {
    name: getClusterDisplayName(cluster),
    region: cluster.region,
    exchanges: cluster.exchanges.map((exchange) => ({
      ...exchange,
      indexData: getIndexForExchange(exchange, cluster)
    })),
    country_code: cluster.country_code,
    primaryIndex: getIndexForCluster(cluster)
  }
}



// Convert lat/lon to 3D position on sphere
const latLonToVec3 = (lat, lon, radius = 5.05) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

// Initialize 3D Earth
const initEarth = async () => {
  await fetchIndices()

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
  renderer.domElement.style.cursor = 'grab'

  // Earth Sphere
  const geometry = new THREE.SphereGeometry(5, 64, 64)
  
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

  // Wireframe overlay
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

  // Add hotspot markers
  addHotspots()
  focusInitialCluster('CN')

  // Orbit controls
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
    updateFrontCluster()
    renderer.render(scene, camera)
  }
  
  animate()
  loading.value = false
  refreshTimer = window.setInterval(() => {
    void fetchIndices()
  }, 120000)

  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('click', onMouseClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
}

const getFrontCluster = () => {
  let frontCluster = null
  let bestFacingScore = -Infinity

  tempCameraPosition.copy(camera.position).normalize()

  earth.children.forEach((child) => {
    if (child.userData?.type !== 'cluster') return

    child.getWorldPosition(tempMarkerPosition).normalize()
    const facingScore = tempCameraPosition.dot(tempMarkerPosition)

    if (facingScore > bestFacingScore) {
      bestFacingScore = facingScore
      frontCluster = child.userData.cluster
    }
  })

  return frontCluster
}

const focusInitialCluster = (countryCode) => {
  const cluster = clusterMap[countryCode]
  if (!cluster) return

  const targetPosition = latLonToVec3(cluster.lat, cluster.lon)
  earth.rotation.y = Math.atan2(-targetPosition.x, targetPosition.z)
  selectCluster(cluster)
}

const updateFrontCluster = () => {
  if (!earth) return

  const cluster = getFrontCluster()
  if (!cluster) return

  if (
    selectedCountry.value?.country_code === cluster.country_code &&
    selectedCountry.value?.name === getClusterDisplayName(cluster)
  ) {
    return
  }

  selectCluster(cluster)
}

const addHotspots = () => {
  const clusters = [
    // Americas
    { lat: 40.7, lon: -74.0, region: 'New York, USA', country_code: 'US', exchanges: [
      { code: 'NYSE', name: 'New York Stock Exchange', symbol: 'NYSE/GSB' },
      { code: 'NASDAQ', name: 'NASDAQ', symbol: 'NASDAQ/GSB' }
    ]},
    { lat: 43.65, lon: -79.38, region: 'Toronto, Canada', country_code: 'CA', exchanges: [
      { code: 'TSX', name: 'Toronto Stock Exchange', symbol: 'TSX/GSB' }
    ]},
    { lat: -23.55, lon: -46.63, region: 'Sao Paulo, Brazil', country_code: 'BR', exchanges: [
      { code: 'B3', name: 'B3 - Brasil Bolsa Balcao', symbol: 'B3/GSB' }
    ]},
    { lat: 19.43, lon: -99.13, region: 'Mexico City', country_code: 'MX', exchanges: [
      { code: 'BMV', name: 'Bolsa Mexicana de Valores', symbol: 'BMV/GSB' }
    ]},
    { lat: -34.60, lon: -58.38, region: 'Buenos Aires, Argentina', country_code: 'AR', exchanges: [
      { code: 'BYMA', name: 'Bolsas y Mercados Argentinos', symbol: 'BYMA/GSB' }
    ]},
    // Europe
    { lat: 51.51, lon: -0.13, region: 'London, UK', country_code: 'GB', exchanges: [
      { code: 'LSE', name: 'London Stock Exchange', symbol: 'LSE/GSB' }
    ]},
    { lat: 50.11, lon: 8.68, region: 'Frankfurt, Germany', country_code: 'DE', exchanges: [
      { code: 'XETRA', name: 'Deutsche Boerse XETRA', symbol: 'XETRA/GSB' }
    ]},
    { lat: 48.86, lon: 2.35, region: 'Paris, France', country_code: 'FR', exchanges: [
      { code: 'EPA', name: 'Euronext Paris', symbol: 'EPA/GSB' }
    ]},
    { lat: 52.37, lon: 4.90, region: 'Amsterdam, Netherlands', country_code: 'NL', exchanges: [
      { code: 'AMS', name: 'Euronext Amsterdam', symbol: 'AMS/GSB' }
    ]},
    { lat: 40.42, lon: -3.70, region: 'Madrid, Spain', country_code: 'ES', exchanges: [
      { code: 'BME', name: 'Bolsa de Madrid', symbol: 'BME/GSB' }
    ]},
    { lat: 45.46, lon: 9.19, region: 'Milan, Italy', country_code: 'IT', exchanges: [
      { code: 'MIL', name: 'Borsa Italiana', symbol: 'MIL/GSB' }
    ]},
    { lat: 47.38, lon: 8.54, region: 'Zurich, Switzerland', country_code: 'CH', exchanges: [
      { code: 'SIX', name: 'SIX Swiss Exchange', symbol: 'SIX/GSB' }
    ]},
    // Nordic cluster
    { lat: 58.5, lon: 15.0, region: 'Nordic Exchanges', country_code: 'SE', exchanges: [
      { code: 'STO', name: 'Nasdaq Stockholm', symbol: 'STO/GSB' },
      { code: 'OSL', name: 'Oslo Bors', symbol: 'OSL/GSB' },
      { code: 'CSE', name: 'Nasdaq Copenhagen', symbol: 'CSE/GSB' },
      { code: 'HEL', name: 'Nasdaq Helsinki', symbol: 'HEL/GSB' }
    ]},
    { lat: 52.23, lon: 21.01, region: 'Warsaw, Poland', country_code: 'PL', exchanges: [
      { code: 'GPW', name: 'GPW', symbol: 'GPW/GSB' }
    ]},
    { lat: 55.76, lon: 37.62, region: 'Moscow, Russia', country_code: 'RU', exchanges: [
      { code: 'MOEX', name: 'Moscow Exchange', symbol: 'MOEX/GSB' }
    ]},
    { lat: 41.01, lon: 28.98, region: 'Istanbul, Turkey', country_code: 'TR', exchanges: [
      { code: 'BIST', name: 'Borsa Istanbul', symbol: 'BIST/GSB' }
    ]},
    // Asia-Pacific
    { lat: 31.2, lon: 121.5, region: 'China', country_code: 'CN', exchanges: [
      { code: 'SSE', name: 'Shanghai Stock Exchange', symbol: 'SSE/GSB' },
      { code: 'SZSE', name: 'Shenzhen Stock Exchange', symbol: 'SZSE/GSB' }
    ]},
    { lat: 35.68, lon: 139.65, region: 'Tokyo, Japan', country_code: 'JP', exchanges: [
      { code: 'TSE', name: 'Tokyo Stock Exchange', symbol: 'TSE/GSB' }
    ]},
    { lat: 22.32, lon: 114.17, region: 'Hong Kong', country_code: 'HK', exchanges: [
      { code: 'HKEX', name: 'Hong Kong Exchanges', symbol: 'HKEX/GSB' }
    ]},
    { lat: 37.57, lon: 126.98, region: 'Seoul, South Korea', country_code: 'KR', exchanges: [
      { code: 'KRX', name: 'Korea Exchange', symbol: 'KRX/GSB' }
    ]},
    { lat: 25.03, lon: 121.57, region: 'Taipei, Taiwan', country_code: 'TW', exchanges: [
      { code: 'TWSE', name: 'Taiwan Stock Exchange', symbol: 'TWSE/GSB' }
    ]},
    // India cluster
    { lat: 19.08, lon: 72.88, region: 'India', country_code: 'IN', exchanges: [
      { code: 'BSE', name: 'Bombay Stock Exchange', symbol: 'BSE/GSB' },
      { code: 'NSE', name: 'National Stock Exchange', symbol: 'NSE/GSB' }
    ]},
    { lat: 1.35, lon: 103.82, region: 'Singapore', country_code: 'SG', exchanges: [
      { code: 'SGX', name: 'Singapore Exchange', symbol: 'SGX/GSB' }
    ]},
    { lat: 13.76, lon: 100.50, region: 'Bangkok, Thailand', country_code: 'TH', exchanges: [
      { code: 'SET', name: 'Stock Exchange of Thailand', symbol: 'SET/GSB' }
    ]},
    { lat: 3.14, lon: 101.69, region: 'Kuala Lumpur, Malaysia', country_code: 'MY', exchanges: [
      { code: 'Bursa', name: 'Bursa Malaysia', symbol: 'Bursa/GSB' }
    ]},
    { lat: -6.21, lon: 106.85, region: 'Jakarta, Indonesia', country_code: 'ID', exchanges: [
      { code: 'IDX', name: 'Indonesia Stock Exchange', symbol: 'IDX/GSB' }
    ]},
    { lat: 14.60, lon: 120.98, region: 'Manila, Philippines', country_code: 'PH', exchanges: [
      { code: 'PSE', name: 'Philippine Stock Exchange', symbol: 'PSE/GSB' }
    ]},
    { lat: 10.82, lon: 106.63, region: 'Ho Chi Minh, Vietnam', country_code: 'VN', exchanges: [
      { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange', symbol: 'HOSE/GSB' }
    ]},
    { lat: 24.86, lon: 67.00, region: 'Karachi, Pakistan', country_code: 'PK', exchanges: [
      { code: 'PSX', name: 'Pakistan Stock Exchange', symbol: 'PSX/GSB' }
    ]},
    { lat: -33.87, lon: 151.21, region: 'Sydney, Australia', country_code: 'AU', exchanges: [
      { code: 'ASX', name: 'Australian Securities Exchange', symbol: 'ASX/GSB' }
    ]},
    { lat: -36.85, lon: 174.76, region: 'Auckland, New Zealand', country_code: 'NZ', exchanges: [
      { code: 'NZX', name: 'New Zealand Exchange', symbol: 'NZX/GSB' }
    ]},
    // Middle East & Africa
    { lat: 24.71, lon: 46.68, region: 'Riyadh, Saudi Arabia', country_code: 'SA', exchanges: [
      { code: 'Tadawul', name: 'Saudi Exchange', symbol: 'Tadawul/GSB' }
    ]},
    { lat: 24.8, lon: 54.8, region: 'UAE', country_code: 'AE', exchanges: [
      { code: 'DFM', name: 'Dubai Financial Market', symbol: 'DFM/GSB' },
      { code: 'ADX', name: 'Abu Dhabi Securities Exchange', symbol: 'ADX/GSB' }
    ]},
    { lat: 25.29, lon: 51.53, region: 'Doha, Qatar', country_code: 'QA', exchanges: [
      { code: 'QSE', name: 'Qatar Stock Exchange', symbol: 'QSE/GSB' }
    ]},
    { lat: 32.09, lon: 34.78, region: 'Tel Aviv, Israel', country_code: 'IL', exchanges: [
      { code: 'TASE', name: 'Tel Aviv Stock Exchange', symbol: 'TASE/GSB' }
    ]},
    { lat: -33.92, lon: 18.42, region: 'Johannesburg, South Africa', country_code: 'ZA', exchanges: [
      { code: 'JSE', name: 'Johannesburg Stock Exchange', symbol: 'JSE/GSB' }
    ]},
    { lat: 30.04, lon: 31.24, region: 'Cairo, Egypt', country_code: 'EG', exchanges: [
      { code: 'EGX', name: 'Egyptian Exchange', symbol: 'EGX/GSB' }
    ]},
    { lat: 6.52, lon: 3.38, region: 'Lagos, Nigeria', country_code: 'NG', exchanges: [
      { code: 'NGX', name: 'Nigerian Exchange', symbol: 'NGX/GSB' }
    ]},
    { lat: -1.29, lon: 36.82, region: 'Nairobi, Kenya', country_code: 'KE', exchanges: [
      { code: 'NSE-KE', name: 'Nairobi Securities Exchange', symbol: 'NSE-KE/GSB' }
    ]}
  ]

  clusters.forEach(cluster => {
    const size = cluster.exchanges.length > 1 ? 0.08 : 0.06
    const pos = latLonToVec3(cluster.lat, cluster.lon)

    const indexData = getIndexForCluster(cluster)
    const dotColor = getDotColor(indexData)

    // Red/green dot marker based on index change
    const geometry = new THREE.SphereGeometry(size, 12, 12)
    const material = new THREE.MeshBasicMaterial({ color: dotColor })
    const marker = new THREE.Mesh(geometry, material)
    marker.position.copy(pos)
    marker.userData = { type: 'cluster', cluster: cluster, country_code: cluster.country_code }
    earth.add(marker)

    // Pulsing ring
    const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2.2, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: dotColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(pos)
    ring.lookAt(new THREE.Vector3(0, 0, 0))
    ring.userData = { type: 'cluster-ring', country_code: cluster.country_code }
    earth.add(ring)

    clusterMap[cluster.country_code] = cluster
  })
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

  for (const hit of intersects) {
    if (hit.object.userData.type === 'cluster') {
      const cluster = hit.object.userData.cluster
      if (cluster.exchanges.length === 1) {
        goToTrade(cluster.exchanges[0].symbol)
        return
      }
      // Multi-exchange: show panel
      selectCluster(cluster)
      return
    }
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
  userStore.setLocale(currentLocale.value)
  document.documentElement.dir = currentLocale.value === 'ar' ? 'rtl' : 'ltr'

  if (selectedCountry.value?.country_code) {
    const activeCluster = clusterMap[selectedCountry.value.country_code]
    if (activeCluster) {
      selectCluster(activeCluster)
    }
  }
}

const logout = async () => {
  await userStore.logout()
  router.replace('/login')
}

onMounted(() => {
  initEarth()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (refreshTimer) window.clearInterval(refreshTimer)
  if (controls) controls.dispose()
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
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  background: rgba(10, 10, 26, 0.95);
  
  .spinner {
    width: 50px; height: 50px;
    border: 4px solid rgba(74, 158, 255, 0.3);
    border-top-color: #4a9eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  p { color: #fff; margin-top: 20px; font-size: 16px; }
}

@keyframes spin { to { transform: rotate(360deg); } }

.earth-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  
  .logo {
    h1 { color: #4a9eff; margin: 0; font-size: 28px; font-weight: 700; }
    .tagline { color: rgba(255,255,255,0.7); font-size: 14px; margin-left: 10px; }
  }
  
  .main-nav {
    display: flex; gap: 30px; align-items: center;
    a { color: #fff; text-decoration: none; font-size: 14px; transition: color 0.3s;
      &:hover { color: #4a9eff; }
    }
    .lang-switcher {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer; outline: none;
      option { background: #1a1a3a; color: #fff; }
    }
  }
}

.earth-canvas { width: 100%; height: 100%; }

.country-panel {
  position: absolute; top: 100px; right: 40px; width: 320px;
  background: rgba(26, 26, 58, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 12px; padding: 24px; color: #fff; z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);

  .panel-header {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    margin-bottom: 12px;
  }

  .panel-kicker {
    margin: 0 0 8px 0;
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .panel-badge {
    display: flex; flex-direction: column; gap: 4px;
    min-width: 112px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255,255,255,0.08);
    text-align: right;

    &.up { background: rgba(34, 197, 94, 0.14); }
    &.down { background: rgba(239, 68, 68, 0.14); }
    &.neutral { background: rgba(255,255,255,0.08); }
  }

  .badge-label {
    color: rgba(255,255,255,0.6);
    font-size: 11px;
    line-height: 1.2;
  }

  .badge-value {
    font-size: 18px;
    font-weight: 700;
    color: #dbeafe;
  }

  .panel-badge.up .badge-value { color: #22c55e; }
  .panel-badge.down .badge-value { color: #ef4444; }

  .panel-caption {
    margin: 0 0 16px 0;
    color: rgba(255,255,255,0.68);
    font-size: 13px;
    line-height: 1.45;
  }

  h2 { margin: 0 0 20px 0; font-size: 22px; color: #4a9eff; }
  
  .exchanges-list {
    h3 { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
    ul { list-style: none; padding: 0; margin: 0; }
    .exchange-item {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 12px; margin-bottom: 8px;
      background: rgba(74, 158, 255, 0.1); border-radius: 6px;
      cursor: pointer; transition: all 0.3s;
      &:hover { background: rgba(74, 158, 255, 0.2); transform: translateX(-4px); }
      .exchange-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .exchange-name { font-size: 14px; color: #fff; }
      .exchange-code { font-size: 12px; color: #4a9eff; font-weight: 600; }
      .exchange-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; text-align: right; }
      .exchange-index { max-width: 132px; color: rgba(255,255,255,0.62); font-size: 11px; line-height: 1.2; }
      .exchange-change {
        font-size: 13px; font-weight: 700;
        &.up { color: #22c55e; }
        &.down { color: #ef4444; }
        &.neutral { color: rgba(255,255,255,0.7); }
      }
    }
  }
}

.legend {
  position: absolute; bottom: 40px; left: 40px;
  background: rgba(26, 26, 58, 0.9);
  backdrop-filter: blur(10px); padding: 16px;
  border-radius: 8px; border: 1px solid rgba(74, 158, 255, 0.2);
  color: #fff; z-index: 100;
  
  h4 { margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.8); }
  .legend-item {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px;
    &:last-child { margin-bottom: 0; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      &.up { background: #22c55e; }
      &.down { background: #ef4444; }
      &.neutral { background: #94a3b8; }
    }
  }
}

.cluster-popup {
  position: absolute; pointer-events: auto; z-index: 200;
  background: rgba(10, 10, 30, 0.94);
  backdrop-filter: blur(14px); padding: 0;
  border-radius: 10px; border: 1px solid rgba(74, 158, 255, 0.35);
  box-shadow: 0 4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(74, 158, 255, 0.15);
  min-width: 220px; max-width: 360px; overflow: hidden;
  animation: popupFadeIn 0.18s ease;

  .cluster-title {
    padding: 10px 14px 8px;
    font-size: 11px; font-weight: 600;
    color: rgba(74, 158, 255, 0.85);
    text-transform: uppercase; letter-spacing: 1.2px;
    border-bottom: 1px solid rgba(74, 158, 255, 0.15);
    display: flex; align-items: center; justify-content: space-between;

    .cluster-index {
      font-size: 12px; font-weight: 700;
      letter-spacing: 0; text-transform: none;
      padding: 2px 8px; border-radius: 4px;
      &.up { color: #22c55e; background: rgba(34, 197, 94, 0.15); }
      &.down { color: #ef4444; background: rgba(239, 68, 68, 0.15); }
      &.neutral { color: rgba(255,255,255,0.72); background: rgba(255,255,255,0.1); }
    }
  }

  .cluster-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px; cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    &:last-child { border-bottom: none; }
    &:hover { background: rgba(74, 158, 255, 0.15); }

    .item-arrow { color: rgba(74,158,255,0.7); font-size: 16px; font-weight: 700; width: 14px; flex-shrink: 0; }
    .item-name { flex: 1; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-code { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 0.5px; flex-shrink: 0; }
  }
}

@keyframes popupFadeIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(50px); opacity: 0; }
</style>

