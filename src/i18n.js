import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APP_LANGUAGE_KEY } from './Services/Constants/Constants';

// preferred language is stored in sessionStorage under the key defined by APP_LANGUAGE_KEY
const storedLang = sessionStorage.getItem(APP_LANGUAGE_KEY);
const defaultLanguage = storedLang || 'hr'; // Croatian by default

// if nothing is stored yet, write the default so consumers can read later
if (!storedLang) {
  sessionStorage.setItem('appLang', defaultLanguage);
}

// minimal translation resources; expand as you add more keys
const resources = {
  en: {
    translation: {
      header: {
        title: 'MUNICIPALITY OF TISNO',
        subtitle: 'Monitor your digital signage network',
        languageLabel: 'Language',
        profile: 'Profile',
        logout: 'Logout',
      },
      navigation: {
        slides: 'Slides',
        pools: 'Content Pools',
        timeline: 'Timeline',
        connector: 'Connector',
      },
      timeline: {
        description: 'Dynamic device work cycle visualization with pool-based rotation',
        noDevices: 'No Devices',
        error: 'Error',
        deviceLabel: 'Device',
        workSchedule: 'Work Schedule',
        nowPlaying: 'Now Playing',
        cyclePrefix: 'Cycle #',
        statusLive: 'Live & Playing',
        statusInactive: 'Inactive',
      },
      general: {
        loading: 'Loading...',
        failedToLoadToken: 'Failed to load token',
      },
    },
  },
  hr: {
    translation: {
      header: {
        title: 'OPĆINA TISNO',
        subtitle: 'Nadzor vaše mreže digitalnih zaslona',
        languageLabel: 'Jezik',
        profile: 'Profil',
        logout: 'Odjava',
      },
      navigation: {
        slides: 'Slajdovi',
        pools: 'Sadržajni bazeni',
        timeline: 'Vremenska linija',
        connector: 'Povezivač',
      },
      timeline: {
        description: 'Dinamičan prikaz radnog ciklusa uređaja s rotacijom po bazenima',
        noDevices: 'Nema uređaja',
        error: 'Greška',
        deviceLabel: 'Uređaj',
        workSchedule: 'Radni raspored',
        nowPlaying: 'Sada svira',
        cyclePrefix: 'Ciklus #',
        statusLive: 'UŽIVO i svira',
        statusInactive: 'Neaktivno',
      },
      general: {
        loading: 'Učitavanje...',
        failedToLoadToken: 'Ne može se učitati token',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'hr',
  interpolation: { escapeValue: false },
});

// keep html lang attribute in sync so assistive tools and crawlers know the active language
document.documentElement.lang = defaultLanguage;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
