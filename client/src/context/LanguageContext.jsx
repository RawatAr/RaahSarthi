import { createContext, useContext, useState } from 'react';

const STRINGS = {
    en: {
        brand: { name: ['Raah', 'Sarthi'], tagline: 'Smart stops. Smarter journeys.' },
        search: {
            from: 'Starting point…', to: 'Destination…',
            btn: 'Find Route & Stops', calculating: 'Calculating…',
            swap: 'Swap origin & destination', gps: 'Use my location', voice: 'Voice search',
            hint: ['Ctrl', 'K', 'to focus', 'Esc', 'to close'],
        },
        sections: {
            routeSummary: 'Route Summary', weather: 'Weather',
            elevation: 'Elevation Profile', directions: 'Turn-by-Turn Directions',
            suggestions: 'Smart Suggestions', filters: 'Filters',
            savedRoutes: 'Saved Routes', save: 'Save', saved: 'Saved!',
        },
        stats: { distance: 'Distance', duration: 'Duration' },
        stops: {
            searching: 'Searching along route…', filtering: 'Filtering places within your corridor',
            noRoute: 'No route yet', noRouteDesc: 'Enter your origin and destination above to discover stops.',
            notFound: 'No {cat} found', notFoundDesc: 'Try increasing the corridor radius or lowering minimum rating.',
            streetView: 'Street View', addToRoute: 'Add to Route',
        },
        filter: { cat: 'Stop Category', minRating: 'Min Rating', corridor: 'Corridor', openNow: 'Open Now Only', any: 'Any' },
        route: { print: 'Print', share: 'Share', waypoints: 'Waypoints', dragHint: 'drag to reorder' },
        auth: {
            signIn: 'Sign In', signUp: 'Sign Up', email: 'Email', password: 'Password',
            name: 'Full Name', noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
            logout: 'Sign Out', welcome: 'Welcome back', profile: 'Profile',
        },
        travel: { driving: 'Drive', walking: 'Walk', cycling: 'Cycle' },
        lang: { toggle: 'हिं', label: 'Switch to Hindi' },
    },
    hi: {
        brand: { name: ['राह', 'सारथी'], tagline: 'स्मार्ट पड़ाव। बेहतर सफ़र।' },
        search: {
            from: 'शुरुआत का स्थान…', to: 'मंज़िल…',
            btn: 'रूट और पड़ाव खोजें', calculating: 'गणना हो रही है…',
            swap: 'ओरिजिन और गंतव्य बदलें', gps: 'मेरी लोकेशन इस्तेमाल करें', voice: 'आवाज़ से खोजें',
            hint: ['Ctrl', 'K', 'फ़ोकस करने के लिए', 'Esc', 'बंद करने के लिए'],
        },
        sections: {
            routeSummary: 'रूट सारांश', weather: 'मौसम',
            elevation: 'ऊंचाई प्रोफाइल', directions: 'मोड़-दर-मोड़ दिशाएं',
            suggestions: 'स्मार्ट सुझाव', filters: 'फ़िल्टर',
            savedRoutes: 'सहेजे गए रूट', save: 'सेव करें', saved: 'सेव हो गया!',
        },
        stats: { distance: 'दूरी', duration: 'समय' },
        stops: {
            searching: 'रूट के साथ खोज रहे हैं…', filtering: 'आपके कॉरिडोर में स्थान फ़िल्टर हो रहे हैं',
            noRoute: 'अभी कोई रूट नहीं', noRouteDesc: 'पड़ाव खोजने के लिए ऊपर ओरिजिन और गंतव्य दर्ज करें।',
            notFound: 'कोई {cat} नहीं मिला', notFoundDesc: 'कॉरिडोर बढ़ाएं या न्यूनतम रेटिंग कम करें।',
            streetView: 'स्ट्रीट व्यू', addToRoute: 'रूट में जोड़ें',
        },
        filter: { cat: 'पड़ाव श्रेणी', minRating: 'न्यूनतम रेटिंग', corridor: 'कॉरिडोर', openNow: 'अभी खुला', any: 'कोई भी' },
        route: { print: 'प्रिंट', share: 'शेयर', waypoints: 'वेपॉइंट', dragHint: 'क्रम बदलने के लिए खींचें' },
        auth: {
            signIn: 'साइन इन', signUp: 'साइन अप', email: 'ईमेल', password: 'पासवर्ड',
            name: 'पूरा नाम', noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?',
            logout: 'साइन आउट', welcome: 'वापस स्वागत है', profile: 'प्रोफ़ाइल',
        },
        travel: { driving: 'कार', walking: 'पैदल', cycling: 'साइकिल' },
        lang: { toggle: 'EN', label: 'Switch to English' },
    },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('en');
    const t = STRINGS[lang];
    const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');
    return (
        <LanguageContext.Provider value={{ lang, t, toggleLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export { STRINGS };
