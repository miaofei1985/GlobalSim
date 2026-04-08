import { createI18n } from 'vue-i18n'

const messages = {
  'zh-CN': {
    nav: { home: '首页', market: '行情', trade: '交易', wallet: '钱包', profile: '个人中心' },
    earth: { 
      title: '全球金融市场',
      subtitle: '点击国家查看交易所',
      loading: '加载地球模型中...'
    },
    trade: {
      buy: '买入',
      sell: '卖出',
      price: '价格',
      quantity: '数量',
      total: '总计',
      balance: '可用余额',
      submit: '提交订单',
      cancel: '撤单'
    },
    common: {
      loading: '加载中...',
      error: '发生错误',
      success: '操作成功',
      confirm: '确认',
      cancel: '取消'
    }
  },
  'en': {
    nav: { home: 'Home', market: 'Market', trade: 'Trade', wallet: 'Wallet', profile: 'Profile' },
    earth: { 
      title: 'Global Financial Market',
      subtitle: 'Click country to view exchanges',
      loading: 'Loading Earth model...'
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
  'ar': {
    nav: { home: 'الرئيسية', market: 'السوق', trade: 'التداول', wallet: 'المحفظة', profile: 'الملف الشخصي' },
    earth: { 
      title: 'السوق المالي العالمي',
      subtitle: 'انقر على الدولة لعرض البورصات',
      loading: 'جاري تحميل نموذج الأرض...'
    },
    trade: {
      buy: 'شراء',
      sell: 'بيع',
      price: 'السعر',
      quantity: 'الكمية',
      total: 'الإجمالي',
      balance: 'الرصيد المتاح',
      submit: 'تقديم الطلب',
      cancel: 'إلغاء الطلب'
    },
    common: {
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      success: 'نجاح',
      confirm: 'تأكيد',
      cancel: 'إلغاء'
    }
  },
  'ja': {
    nav: { home: 'ホーム', market: '市場', trade: '取引', wallet: 'ウォレット', profile: 'プロフィール' },
    earth: { 
      title: 'グローバル金融市場',
      subtitle: '国をクリックして取引所を表示',
      loading: '地球モデルを読み込み中...'
    },
    trade: {
      buy: '買い',
      sell: '売り',
      price: '価格',
      quantity: '数量',
      total: '合計',
      balance: '利用可能残高',
      submit: '注文する',
      cancel: '注文キャンセル'
    },
    common: {
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      success: '成功',
      confirm: '確認',
      cancel: 'キャンセル'
    }
  },
  'hi': {
    nav: { home: 'होम', market: 'बाजार', trade: 'व्यापार', wallet: 'वॉलेट', profile: 'प्रोफाइल' },
    earth: { 
      title: 'वैश्विक वित्तीय बाजार',
      subtitle: 'एक्सचेंज देखने के लिए देश पर क्लिक करें',
      loading: 'पृथ्वी मॉडल लोड हो रहा है...'
    },
    trade: {
      buy: 'खरीदें',
      sell: 'बेचें',
      price: 'मूल्य',
      quantity: 'मात्रा',
      total: 'कुल',
      balance: 'उपलब्ध शेष',
      submit: 'आदेश जमा करें',
      cancel: 'आदेश रद्द करें'
    },
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि हुई',
      success: 'सफल',
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें'
    }
  },
  'es': {
    nav: { home: 'Inicio', market: 'Mercado', trade: 'Comercio', wallet: 'Billetera', profile: 'Perfil' },
    earth: { 
      title: 'Mercado Financiero Global',
      subtitle: 'Haga clic en el país para ver las bolsas',
      loading: 'Cargando modelo de la Tierra...'
    },
    trade: {
      buy: 'Comprar',
      sell: 'Vender',
      price: 'Precio',
      quantity: 'Cantidad',
      total: 'Total',
      balance: 'Saldo disponible',
      submit: 'Enviar pedido',
      cancel: 'Cancelar pedido'
    },
    common: {
      loading: 'Cargando...',
      error: 'Error ocurrido',
      success: 'Éxito',
      confirm: 'Confirmar',
      cancel: 'Cancelar'
    }
  },
  'bn': {
    nav: { home: 'হোম', market: 'বাজার', trade: 'ট্রেড', wallet: 'ওয়ালেট', profile: 'প্রোফাইল' },
    earth: { 
      title: 'বৈশ্বিক আর্থিক বাজার',
      subtitle: 'এক্সচেঞ্জ দেখতে দেশে ক্লিক করুন',
      loading: 'পৃথিবী মডেল লোড হচ্ছে...'
    },
    trade: {
      buy: 'কিনুন',
      sell: 'বিক্রি করুন',
      price: 'মূল্য',
      quantity: 'পরিমাণ',
      total: 'মোট',
      balance: 'উপলব্ধ ব্যালেন্স',
      submit: 'অর্ডার জমা দিন',
      cancel: 'অর্ডার বাতিল করুন'
    },
    common: {
      loading: 'লোড হচ্ছে...',
      error: 'ত্রুটি ঘটেছে',
      success: 'সফল',
      confirm: 'নিশ্চিত করুন',
      cancel: 'বাতিল করুন'
    }
  },
  'pt-BR': {
    nav: { home: 'Início', market: 'Mercado', trade: 'Negociação', wallet: 'Carteira', profile: 'Perfil' },
    earth: { 
      title: 'Mercado Financeiro Global',
      subtitle: 'Clique no país para ver as bolsas',
      loading: 'Carregando modelo da Terra...'
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
      error: 'Erro ocorrido',
      success: 'Sucesso',
      confirm: 'Confirmar',
      cancel: 'Cancelar'
    }
  },
  'ru': {
    nav: { home: 'Главная', market: 'Рынок', trade: 'Торговля', wallet: 'Кошелек', profile: 'Профиль' },
    earth: { 
      title: 'Глобальный финансовый рынок',
      subtitle: 'Нажмите на страну, чтобы увидеть биржи',
      loading: 'Загрузка модели Земли...'
    },
    trade: {
      buy: 'Купить',
      sell: 'Продать',
      price: 'Цена',
      quantity: 'Количество',
      total: 'Итого',
      balance: 'Доступный баланс',
      submit: 'Отправить заказ',
      cancel: 'Отменить заказ'
    },
    common: {
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      success: 'Успешно',
      confirm: 'Подтвердить',
      cancel: 'Отмена'
    }
  },
  'fr': {
    nav: { home: 'Accueil', market: 'Marché', trade: 'Commerce', wallet: 'Portefeuille', profile: 'Profil' },
    earth: { 
      title: 'Marché Financier Mondial',
      subtitle: 'Cliquez sur le pays pour voir les bourses',
      loading: 'Chargement du modèle terrestre...'
    },
    trade: {
      buy: 'Acheter',
      sell: 'Vendre',
      price: 'Prix',
      quantity: 'Quantité',
      total: 'Total',
      balance: 'Solde disponible',
      submit: 'Soumettre la commande',
      cancel: 'Annuler la commande'
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur survenue',
      success: 'Succès',
      confirm: 'Confirmer',
      cancel: 'Annuler'
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages
})

export default i18n
