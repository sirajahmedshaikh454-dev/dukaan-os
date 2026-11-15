import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const en = {
  tagline: 'Your whole shop, in one place.',
  login: 'Log in',
  signup: 'Create account',
  logout: 'Log out',
  phone: 'Mobile number',
  phoneHint: 'Like 03001234567',
  password: 'Password',
  passwordHint: 'At least 8 characters',
  shopName: 'Shop name',
  noAccount: 'New here? Create an account',
  haveAccount: 'Already have an account? Log in',
  yourApps: 'Your apps',
  noApps: 'No apps yet',
  noAppsHint: 'Apps will show here when they are added.',
  loading: 'Loading…',
  back: 'Back',
  notFound: 'This page does not exist',
  goHome: 'Go to home',
  retry: 'Try again',
  appFailed: 'This app could not open',
  switchLanguage: 'اردو',
  fieldErrors: {
    phone: 'Enter a mobile number like 03001234567',
    password: 'Password needs at least 8 characters',
    passwordRequired: 'Enter your password',
    shopName: 'Enter your shop name',
  },
  errors: {
    bad_credentials: 'Wrong mobile number or password',
    phone_taken: 'This mobile number already has an account. Try logging in.',
    invalid_input: 'Please check the form',
    network: 'No connection. Check your internet and try again.',
    server_error: 'Something went wrong. Please try again.',
  },
};

const ur: typeof en = {
  tagline: 'آپ کی پوری دکان، ایک جگہ۔',
  login: 'لاگ اِن',
  signup: 'اکاؤنٹ بنائیں',
  logout: 'لاگ آؤٹ',
  phone: 'موبائل نمبر',
  phoneHint: 'جیسے 03001234567',
  password: 'پاس ورڈ',
  passwordHint: 'کم از کم 8 حروف',
  shopName: 'دکان کا نام',
  noAccount: 'نئے ہیں؟ اکاؤنٹ بنائیں',
  haveAccount: 'پہلے سے اکاؤنٹ ہے؟ لاگ اِن کریں',
  yourApps: 'آپ کی ایپس',
  noApps: 'ابھی کوئی ایپ نہیں',
  noAppsHint: 'ایپس شامل ہونے پر یہاں نظر آئیں گی۔',
  loading: 'لوڈ ہو رہا ہے…',
  back: 'واپس',
  notFound: 'یہ صفحہ موجود نہیں',
  goHome: 'ہوم پر جائیں',
  retry: 'دوبارہ کوشش کریں',
  appFailed: 'یہ ایپ نہیں کھل سکی',
  switchLanguage: 'English',
  fieldErrors: {
    phone: 'موبائل نمبر ایسے لکھیں: 03001234567',
    password: 'پاس ورڈ کم از کم 8 حروف کا ہو',
    passwordRequired: 'اپنا پاس ورڈ لکھیں',
    shopName: 'دکان کا نام لکھیں',
  },
  errors: {
    bad_credentials: 'موبائل نمبر یا پاس ورڈ غلط ہے',
    phone_taken: 'اس نمبر سے پہلے ہی اکاؤنٹ موجود ہے۔ لاگ اِن کریں۔',
    invalid_input: 'براہِ کرم فارم دوبارہ دیکھیں',
    network: 'انٹرنیٹ نہیں ہے۔ کنکشن دیکھ کر دوبارہ کوشش کریں۔',
    server_error: 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
  },
};

export type Lang = 'en' | 'ur';
const STORAGE_KEY = 'dukaan.lang';

function applyToDocument(lang: string) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
}

function savedLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en';
  } catch {
    return 'en'; // private mode can block localStorage
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: savedLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes text
});
applyToDocument(i18n.language);

i18n.on('languageChanged', (lang) => {
  applyToDocument(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not saved; the choice still works for this visit
  }
});

export const currentLang = (): Lang => (i18n.language === 'ur' ? 'ur' : 'en');
export const toggleLang = () => void i18n.changeLanguage(currentLang() === 'ur' ? 'en' : 'ur');
export default i18n;
