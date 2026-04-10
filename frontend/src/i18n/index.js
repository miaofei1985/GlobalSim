import { createI18n } from 'vue-i18n'
import authMessages from './authMessages'

const messages = {
  'zh-CN': {
    nav: {
      home: '首页',
      market: '市场',
      trade: '交易',
      wallet: '钱包',
      profile: '退出登录',
      logout: '退出登录'
    },
    earth: {
      title: '全球金融市场',
      subtitle: '全球基准指数地图',
      exchangesTitle: '重点交易所',
      loading: '正在加载地球模型...',
      autoFocus: '自动聚焦',
      noLiveBenchmark: '暂无实时基准',
      liveBenchmarkUnavailable: '暂无可用基准',
      legendTitle: '基准热力',
      benchmarkUp: '基准指数上涨',
      benchmarkDown: '基准指数下跌',
      benchmarkUnavailable: '暂无可用基准',
      noVerifiedBenchmark: '该市场暂未接入可信的实时基准。',
      delayedBenchmark: '延迟基准',
      liveBenchmark: '实时基准',
      updatedFromSource: '{timing} | 数据源：{source} | 更新时间：{time} UTC',
      updatedFromSourceNoTime: '{timing} | 数据源：{source}',
      specialRegions: {
        SE: '北欧交易所群'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: '东方财富',
        marketFeed: '市场数据'
      }
    },
    trade: {
      buy: '买入',
      sell: '卖出',
      price: '价格',
      quantity: '数量',
      total: '总计',
      balance: '可用余额',
      submit: '提交订单',
      cancel: '取消订单'
    },
    common: {
      loading: '加载中...',
      error: '发生错误',
      success: '操作成功',
      confirm: '确认',
      cancel: '取消'
    }
  },
  en: {
    nav: {
      home: 'Home',
      market: 'Market',
      trade: 'Trade',
      wallet: 'Wallet',
      profile: 'Log out',
      logout: 'Log out'
    },
    earth: {
      title: 'Global Financial Markets',
      subtitle: 'Global benchmark map',
      exchangesTitle: 'Key exchanges',
      loading: 'Loading Earth model...',
      autoFocus: 'Auto focus',
      noLiveBenchmark: 'No live benchmark',
      liveBenchmarkUnavailable: 'Live benchmark unavailable',
      legendTitle: 'Benchmark Heat',
      benchmarkUp: 'Benchmark index is up',
      benchmarkDown: 'Benchmark index is down',
      benchmarkUnavailable: 'Live benchmark not available',
      noVerifiedBenchmark: 'No verified live benchmark is linked for this market yet.',
      delayedBenchmark: 'Delayed benchmark',
      liveBenchmark: 'Live benchmark',
      updatedFromSource: '{timing} | Source: {source} | Updated {time} UTC',
      updatedFromSourceNoTime: '{timing} | Source: {source}',
      specialRegions: {
        SE: 'Nordic Exchanges'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'Market feed'
      }
    },
    trade: {
      buy: 'Buy',
      sell: 'Sell',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      balance: 'Balance',
      submit: 'Submit Order',
      cancel: 'Cancel Order'
    },
    common: {
      loading: 'Loading...',
      error: 'Error occurred',
      success: 'Success',
      confirm: 'Confirm',
      cancel: 'Cancel'
    }
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      market: 'السوق',
      trade: 'التداول',
      wallet: 'المحفظة',
      profile: 'تسجيل الخروج',
      logout: 'تسجيل الخروج'
    },
    earth: {
      title: 'الأسواق المالية العالمية',
      subtitle: 'خريطة المؤشرات المرجعية العالمية',
      exchangesTitle: 'البورصات الرئيسية',
      loading: 'جارٍ تحميل نموذج الأرض...',
      autoFocus: 'تركيز تلقائي',
      noLiveBenchmark: 'لا يوجد مؤشر مباشر',
      liveBenchmarkUnavailable: 'المؤشر غير متاح',
      legendTitle: 'حرارة المؤشرات',
      benchmarkUp: 'المؤشر المرجعي مرتفع',
      benchmarkDown: 'المؤشر المرجعي منخفض',
      benchmarkUnavailable: 'لا يوجد مؤشر متاح',
      noVerifiedBenchmark: 'لا يوجد مؤشر مرجعي موثوق لهذا السوق حتى الآن.',
      delayedBenchmark: 'مؤشر متأخر',
      liveBenchmark: 'مؤشر مباشر',
      updatedFromSource: '{timing} | المصدر: {source} | تم التحديث {time} UTC',
      updatedFromSourceNoTime: '{timing} | المصدر: {source}',
      specialRegions: {
        SE: 'بورصات الشمال الأوروبي'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'بيانات السوق'
      }
    },
    trade: {
      buy: 'شراء',
      sell: 'بيع',
      price: 'السعر',
      quantity: 'الكمية',
      total: 'الإجمالي',
      balance: 'الرصيد المتاح',
      submit: 'إرسال الطلب',
      cancel: 'إلغاء الطلب'
    },
    common: {
      loading: 'جارٍ التحميل...',
      error: 'حدث خطأ',
      success: 'تم بنجاح',
      confirm: 'تأكيد',
      cancel: 'إلغاء'
    }
  },
  ja: {
    nav: {
      home: 'ホーム',
      market: '市場',
      trade: '取引',
      wallet: 'ウォレット',
      profile: 'ログアウト',
      logout: 'ログアウト'
    },
    earth: {
      title: '世界金融市場',
      subtitle: '世界基準指数マップ',
      exchangesTitle: '主要取引所',
      loading: '地球モデルを読み込み中...',
      autoFocus: '自動フォーカス',
      noLiveBenchmark: 'ライブ基準なし',
      liveBenchmarkUnavailable: 'ライブ基準は利用できません',
      legendTitle: '基準ヒート',
      benchmarkUp: '基準指数は上昇',
      benchmarkDown: '基準指数は下落',
      benchmarkUnavailable: 'ライブ基準は利用できません',
      noVerifiedBenchmark: 'この市場には信頼できるライブ基準がまだありません。',
      delayedBenchmark: '遅延基準',
      liveBenchmark: 'ライブ基準',
      updatedFromSource: '{timing} | ソース: {source} | 更新 {time} UTC',
      updatedFromSourceNoTime: '{timing} | ソース: {source}',
      specialRegions: {
        SE: '北欧取引所'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: '市場データ'
      }
    },
    trade: {
      buy: '買い',
      sell: '売り',
      price: '価格',
      quantity: '数量',
      total: '合計',
      balance: '利用可能残高',
      submit: '注文する',
      cancel: '注文をキャンセル'
    },
    common: {
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      success: '成功',
      confirm: '確認',
      cancel: 'キャンセル'
    }
  },
  hi: {
    nav: {
      home: 'होम',
      market: 'बाज़ार',
      trade: 'ट्रेड',
      wallet: 'वॉलेट',
      profile: 'लॉग आउट',
      logout: 'लॉग आउट'
    },
    earth: {
      title: 'वैश्विक वित्तीय बाज़ार',
      subtitle: 'वैश्विक बेंचमार्क मानचित्र',
      exchangesTitle: 'मुख्य एक्सचेंज',
      loading: 'पृथ्वी मॉडल लोड हो रहा है...',
      autoFocus: 'स्वतः फोकस',
      noLiveBenchmark: 'कोई लाइव बेंचमार्क नहीं',
      liveBenchmarkUnavailable: 'लाइव बेंचमार्क उपलब्ध नहीं',
      legendTitle: 'बेंचमार्क हीट',
      benchmarkUp: 'बेंचमार्क सूचकांक ऊपर है',
      benchmarkDown: 'बेंचमार्क सूचकांक नीचे है',
      benchmarkUnavailable: 'लाइव बेंचमार्क उपलब्ध नहीं',
      noVerifiedBenchmark: 'इस बाज़ार के लिए अभी कोई विश्वसनीय लाइव बेंचमार्क नहीं है।',
      delayedBenchmark: 'विलंबित बेंचमार्क',
      liveBenchmark: 'लाइव बेंचमार्क',
      updatedFromSource: '{timing} | स्रोत: {source} | अपडेट {time} UTC',
      updatedFromSourceNoTime: '{timing} | स्रोत: {source}',
      specialRegions: {
        SE: 'नॉर्डिक एक्सचेंज'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'मार्केट डेटा'
      }
    },
    trade: {
      buy: 'खरीदें',
      sell: 'बेचें',
      price: 'कीमत',
      quantity: 'मात्रा',
      total: 'कुल',
      balance: 'उपलब्ध शेष',
      submit: 'ऑर्डर भेजें',
      cancel: 'ऑर्डर रद्द करें'
    },
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि हुई',
      success: 'सफल',
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      market: 'Mercado',
      trade: 'Trading',
      wallet: 'Billetera',
      profile: 'Cerrar sesión',
      logout: 'Cerrar sesión'
    },
    earth: {
      title: 'Mercados financieros globales',
      subtitle: 'Mapa global de índices de referencia',
      exchangesTitle: 'Bolsas principales',
      loading: 'Cargando modelo de la Tierra...',
      autoFocus: 'Enfoque automático',
      noLiveBenchmark: 'Sin referencia en vivo',
      liveBenchmarkUnavailable: 'Referencia en vivo no disponible',
      legendTitle: 'Mapa de calor de referencia',
      benchmarkUp: 'El índice de referencia sube',
      benchmarkDown: 'El índice de referencia baja',
      benchmarkUnavailable: 'Referencia en vivo no disponible',
      noVerifiedBenchmark: 'Todavía no hay una referencia en vivo confiable para este mercado.',
      delayedBenchmark: 'Referencia con retraso',
      liveBenchmark: 'Referencia en vivo',
      updatedFromSource: '{timing} | Fuente: {source} | Actualizado {time} UTC',
      updatedFromSourceNoTime: '{timing} | Fuente: {source}',
      specialRegions: {
        SE: 'Bolsas nórdicas'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'Datos de mercado'
      }
    },
    trade: {
      buy: 'Comprar',
      sell: 'Vender',
      price: 'Precio',
      quantity: 'Cantidad',
      total: 'Total',
      balance: 'Saldo disponible',
      submit: 'Enviar orden',
      cancel: 'Cancelar orden'
    },
    common: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      success: 'Éxito',
      confirm: 'Confirmar',
      cancel: 'Cancelar'
    }
  },
  bn: {
    nav: {
      home: 'হোম',
      market: 'বাজার',
      trade: 'ট্রেড',
      wallet: 'ওয়ালেট',
      profile: 'লগ আউট',
      logout: 'লগ আউট'
    },
    earth: {
      title: 'বিশ্ব আর্থিক বাজার',
      subtitle: 'বিশ্ব বেন্চমার্ক মানচিত্র',
      exchangesTitle: 'প্রধান এক্সচেঞ্জ',
      loading: 'পৃথিবীর মডেল লোড হচ্ছে...',
      autoFocus: 'স্বয়ংক্রিয় ফোকাস',
      noLiveBenchmark: 'কোনো লাইভ বেন্চমার্ক নেই',
      liveBenchmarkUnavailable: 'লাইভ বেন্চমার্ক পাওয়া যাচ্ছে না',
      legendTitle: 'বেন্চমার্ক হিট',
      benchmarkUp: 'বেন্চমার্ক সূচক উপরে',
      benchmarkDown: 'বেন্চমার্ক সূচক নিচে',
      benchmarkUnavailable: 'লাইভ বেন্চমার্ক পাওয়া যাচ্ছে না',
      noVerifiedBenchmark: 'এই বাজারের জন্য এখনো নির্ভরযোগ্য লাইভ বেন্চমার্ক নেই।',
      delayedBenchmark: 'বিলম্বিত বেন্চমার্ক',
      liveBenchmark: 'লাইভ বেন্চমার্ক',
      updatedFromSource: '{timing} | উৎস: {source} | আপডেট {time} UTC',
      updatedFromSourceNoTime: '{timing} | উৎস: {source}',
      specialRegions: {
        SE: 'নর্ডিক এক্সচেঞ্জ'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'মার্কেট ডেটা'
      }
    },
    trade: {
      buy: 'কিনুন',
      sell: 'বিক্রি করুন',
      price: 'দাম',
      quantity: 'পরিমাণ',
      total: 'মোট',
      balance: 'উপলব্ধ ব্যালান্স',
      submit: 'অর্ডার পাঠান',
      cancel: 'অর্ডার বাতিল'
    },
    common: {
      loading: 'লোড হচ্ছে...',
      error: 'ত্রুটি হয়েছে',
      success: 'সফল',
      confirm: 'নিশ্চিত করুন',
      cancel: 'বাতিল করুন'
    }
  },
  'pt-BR': {
    nav: {
      home: 'Início',
      market: 'Mercado',
      trade: 'Trading',
      wallet: 'Carteira',
      profile: 'Sair',
      logout: 'Sair'
    },
    earth: {
      title: 'Mercados financeiros globais',
      subtitle: 'Mapa global de benchmarks',
      exchangesTitle: 'Principais bolsas',
      loading: 'Carregando modelo da Terra...',
      autoFocus: 'Foco automático',
      noLiveBenchmark: 'Sem benchmark ao vivo',
      liveBenchmarkUnavailable: 'Benchmark ao vivo indisponível',
      legendTitle: 'Mapa de calor dos benchmarks',
      benchmarkUp: 'O índice de referência está em alta',
      benchmarkDown: 'O índice de referência está em baixa',
      benchmarkUnavailable: 'Benchmark ao vivo indisponível',
      noVerifiedBenchmark: 'Ainda não há benchmark confiável vinculado a este mercado.',
      delayedBenchmark: 'Benchmark com atraso',
      liveBenchmark: 'Benchmark ao vivo',
      updatedFromSource: '{timing} | Fonte: {source} | Atualizado {time} UTC',
      updatedFromSourceNoTime: '{timing} | Fonte: {source}',
      specialRegions: {
        SE: 'Bolsas nórdicas'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'Dados de mercado'
      }
    },
    trade: {
      buy: 'Comprar',
      sell: 'Vender',
      price: 'Preço',
      quantity: 'Quantidade',
      total: 'Total',
      balance: 'Saldo disponível',
      submit: 'Enviar ordem',
      cancel: 'Cancelar ordem'
    },
    common: {
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      success: 'Sucesso',
      confirm: 'Confirmar',
      cancel: 'Cancelar'
    }
  },
  ru: {
    nav: {
      home: 'Главная',
      market: 'Рынок',
      trade: 'Торги',
      wallet: 'Кошелек',
      profile: 'Выйти',
      logout: 'Выйти'
    },
    earth: {
      title: 'Мировые финансовые рынки',
      subtitle: 'Глобальная карта эталонных индексов',
      exchangesTitle: 'Ключевые биржи',
      loading: 'Загрузка модели Земли...',
      autoFocus: 'Автофокус',
      noLiveBenchmark: 'Нет живого ориентира',
      liveBenchmarkUnavailable: 'Индекс недоступен',
      legendTitle: 'Тепловая карта индексов',
      benchmarkUp: 'Эталонный индекс растет',
      benchmarkDown: 'Эталонный индекс падает',
      benchmarkUnavailable: 'Живой ориентир недоступен',
      noVerifiedBenchmark: 'Для этого рынка пока нет надежного живого ориентира.',
      delayedBenchmark: 'Индекс с задержкой',
      liveBenchmark: 'Живой индекс',
      updatedFromSource: '{timing} | Источник: {source} | Обновлено {time} UTC',
      updatedFromSourceNoTime: '{timing} | Источник: {source}',
      specialRegions: {
        SE: 'Скандинавские биржи'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'Рыночные данные'
      }
    },
    trade: {
      buy: 'Купить',
      sell: 'Продать',
      price: 'Цена',
      quantity: 'Количество',
      total: 'Итого',
      balance: 'Доступный баланс',
      submit: 'Отправить ордер',
      cancel: 'Отменить ордер'
    },
    common: {
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      success: 'Успешно',
      confirm: 'Подтвердить',
      cancel: 'Отмена'
    }
  },
  fr: {
    nav: {
      home: 'Accueil',
      market: 'Marché',
      trade: 'Trading',
      wallet: 'Portefeuille',
      profile: 'Se déconnecter',
      logout: 'Se déconnecter'
    },
    earth: {
      title: 'Marchés financiers mondiaux',
      subtitle: 'Carte mondiale des indices de référence',
      exchangesTitle: 'Places principales',
      loading: 'Chargement du globe...',
      autoFocus: 'Focus auto',
      noLiveBenchmark: 'Aucun benchmark en direct',
      liveBenchmarkUnavailable: 'Benchmark en direct indisponible',
      legendTitle: 'Chaleur des benchmarks',
      benchmarkUp: "L'indice de référence monte",
      benchmarkDown: "L'indice de référence baisse",
      benchmarkUnavailable: 'Benchmark en direct indisponible',
      noVerifiedBenchmark: "Aucun benchmark fiable n'est encore lié à ce marché.",
      delayedBenchmark: 'Benchmark différé',
      liveBenchmark: 'Benchmark en direct',
      updatedFromSource: '{timing} | Source : {source} | Mis à jour {time} UTC',
      updatedFromSourceNoTime: '{timing} | Source : {source}',
      specialRegions: {
        SE: 'Bourses nordiques'
      },
      sources: {
        yahoo: 'Yahoo Finance',
        eastmoney: 'Eastmoney',
        marketFeed: 'Données de marché'
      }
    },
    trade: {
      buy: 'Acheter',
      sell: 'Vendre',
      price: 'Prix',
      quantity: 'Quantité',
      total: 'Total',
      balance: 'Solde disponible',
      submit: "Envoyer l'ordre",
      cancel: "Annuler l'ordre"
    },
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      success: 'Succès',
      confirm: 'Confirmer',
      cancel: 'Annuler'
    }
  }
}

const mergedMessages = Object.fromEntries(
  Object.entries(messages).map(([locale, bundle]) => [
    locale,
    {
      ...bundle,
      auth: authMessages[locale]?.auth || authMessages.en.auth,
      errors: authMessages[locale]?.errors || authMessages.en.errors,
      common: {
        ...(authMessages[locale]?.common || authMessages.en.common),
        ...bundle.common
      }
    }
  ])
)

const supportedLocales = Object.keys(mergedMessages)

const resolveInitialLocale = () => {
  if (typeof window === 'undefined') {
    return 'zh-CN'
  }

  const savedLocale = window.localStorage.getItem('locale')
  if (savedLocale && supportedLocales.includes(savedLocale)) {
    return savedLocale
  }

  const browserLocale = window.navigator.language
  if (!browserLocale) {
    return 'zh-CN'
  }

  if (supportedLocales.includes(browserLocale)) {
    return browserLocale
  }

  const browserBaseLocale = browserLocale.split('-')[0]
  const matchedLocale = supportedLocales.find(
    (locale) => locale.split('-')[0] === browserBaseLocale
  )

  return matchedLocale || 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',
  messages: mergedMessages
})

export default i18n
