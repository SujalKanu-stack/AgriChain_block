import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);
const STORAGE_KEY = "agrichain-language";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", speech: "en-IN" },
  { code: "kn", label: "Kannada", speech: "kn-IN" },
  { code: "hi", label: "Hindi", speech: "hi-IN" },
  { code: "te", label: "Telugu", speech: "te-IN" },
  { code: "ta", label: "Tamil", speech: "ta-IN" },
];

const translations = {
  en: {
    shell: {
      status: "System healthy",
      statusDetail: "Syncing blockchain and API data",
      mobileStatus: "Secure mobile access enabled",
      languageLabel: "Language",
      searchPlaceholder: "Search lots, stages, or activity",
    },
    ai: {
      eyebrow: "AI Insights",
      title: "Explainable market intelligence for farmers",
      subtitle:
        "Generate multilingual BUY, SELL, or HOLD guidance with confidence, drivers, trend logic, and mobile-safe explainability.",
      product: "Product",
      quantity: "Quantity (kg)",
      farmerPrice: "Farmer Price (Rs./kg)",
      currentStage: "Current Stage",
      run: "Run AI Analysis",
      analyzing: "Analyzing...",
      listen: "Listen in my language",
      stop: "Stop audio",
      emptyTitle: "No recommendation yet",
      emptyDescription:
        "Select a crop, quantity, and current stage to generate explainable farmer guidance.",
      recommendation: "Recommendation",
      confidence: "Confidence",
      why: "Why this recommendation was made",
      trend: "Historical trend explanation",
      movement: "Expected movement",
      next24h: "Next 24h",
      next7d: "Next 7d",
      factors: "Factor importance",
      drivers: "Reasoning drivers",
      stagePricing: "Stage-by-stage pricing",
      revenue: "Revenue estimate",
      currentRevenue: "Revenue at current stage",
      potentialRevenue: "Potential revenue at consumer stage",
      recommendationSummary: "Recommendation summary",
      buy: "BUY",
      sell: "SELL",
      hold: "HOLD",
      chartDescription: "Live weighted signals behind the recommendation.",
    },
  },
  hi: {
    shell: {
      status: "सिस्टम स्वस्थ",
      statusDetail: "ब्लॉकचेन और API डेटा सिंक हो रहा है",
      mobileStatus: "सुरक्षित मोबाइल एक्सेस सक्षम है",
      languageLabel: "भाषा",
      searchPlaceholder: "लॉट, चरण या गतिविधि खोजें",
    },
    ai: {
      eyebrow: "AI इनसाइट्स",
      title: "किसानों के लिए समझाने योग्य मार्केट इंटेलिजेंस",
      subtitle:
        "विश्वास प्रतिशत, कारण, ट्रेंड लॉजिक और मोबाइल-सुरक्षित व्याख्या के साथ BUY, SELL या HOLD सलाह पाएं।",
      product: "उत्पाद",
      quantity: "मात्रा (किलो)",
      farmerPrice: "किसान मूल्य (रु./किलो)",
      currentStage: "वर्तमान चरण",
      run: "AI विश्लेषण चलाएँ",
      analyzing: "विश्लेषण हो रहा है...",
      listen: "मेरी भाषा में सुनें",
      stop: "ऑडियो रोकें",
      emptyTitle: "अभी तक कोई सलाह नहीं",
      emptyDescription: "फसल, मात्रा और वर्तमान चरण चुनें ताकि समझाने योग्य किसान सलाह मिल सके।",
      recommendation: "सिफारिश",
      confidence: "विश्वास",
      why: "यह सिफारिश क्यों दी गई",
      trend: "ऐतिहासिक ट्रेंड व्याख्या",
      movement: "अपेक्षित बदलाव",
      next24h: "अगले 24 घंटे",
      next7d: "अगले 7 दिन",
      factors: "फैक्टर इम्पोर्टेंस",
      drivers: "मुख्य कारण",
      stagePricing: "चरण-दर-चरण मूल्य",
      revenue: "राजस्व अनुमान",
      currentRevenue: "वर्तमान चरण पर राजस्व",
      potentialRevenue: "उपभोक्ता चरण पर संभावित राजस्व",
      recommendationSummary: "सिफारिश सारांश",
      buy: "खरीदें",
      sell: "बेचें",
      hold: "रोकें",
      chartDescription: "सिफारिश के पीछे के वेटेड संकेत।",
    },
  },
  kn: {
    shell: {
      status: "ವ್ಯವಸ್ಥೆ ಆರೋಗ್ಯಕರವಾಗಿದೆ",
      statusDetail: "ಬ್ಲಾಕ್‌ಚೈನ್ ಮತ್ತು API ಡೇಟಾ ಸಿಂಕ್ ಆಗುತ್ತಿದೆ",
      mobileStatus: "ಭದ್ರ ಮೊಬೈಲ್ ಪ್ರವೇಶ ಸಕ್ರಿಯವಾಗಿದೆ",
      languageLabel: "ಭಾಷೆ",
      searchPlaceholder: "ಲಾಟ್, ಹಂತ ಅಥವಾ ಚಟುವಟಿಕೆ ಹುಡುಕಿ",
    },
    ai: {
      eyebrow: "AI ಒಳನೋಟಗಳು",
      title: "ರೈತರಿಗೆ ವಿವರಿಸಬಹುದಾದ ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿವಂತಿಕೆ",
      subtitle:
        "BUY, SELL ಅಥವಾ HOLD ಸಲಹೆಯನ್ನು ವಿಶ್ವಾಸ ಶೇಕಡಾ, ಕಾರಣಗಳು ಮತ್ತು ಪ್ರವೃತ್ತಿ ವಿವರಣೆಯೊಂದಿಗೆ ಪಡೆಯಿರಿ.",
      product: "ಉತ್ಪನ್ನ",
      quantity: "ಪ್ರಮಾಣ (ಕೆಜಿ)",
      farmerPrice: "ರೈತ ಬೆಲೆ (ರೂ./ಕೆಜಿ)",
      currentStage: "ಪ್ರಸ್ತುತ ಹಂತ",
      run: "AI ವಿಶ್ಲೇಷಣೆ ಚಾಲನೆ ಮಾಡಿ",
      analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
      listen: "ನನ್ನ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ",
      stop: "ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ",
      emptyTitle: "ಇನ್ನೂ ಸಲಹೆ ಇಲ್ಲ",
      emptyDescription: "ಬೆಳೆ, ಪ್ರಮಾಣ ಮತ್ತು ಪ್ರಸ್ತುತ ಹಂತವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ವಿವರಿಸಬಹುದಾದ ರೈತ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.",
      recommendation: "ಶಿಫಾರಸು",
      confidence: "ವಿಶ್ವಾಸ",
      why: "ಈ ಶಿಫಾರಸು ಯಾಕೆ ಮಾಡಲಾಗಿದೆ",
      trend: "ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿ ವಿವರಣೆ",
      movement: "ನಿರೀಕ್ಷಿತ ಚಲನೆ",
      next24h: "ಮುಂದಿನ 24 ಗಂಟೆ",
      next7d: "ಮುಂದಿನ 7 ದಿನ",
      factors: "ಕಾರಕ ಮಹತ್ವ",
      drivers: "ಕಾರಣ ಸೂಚಿಗಳು",
      stagePricing: "ಹಂತವಾರು ಬೆಲೆ",
      revenue: "ಆದಾಯ ಅಂದಾಜು",
      currentRevenue: "ಪ್ರಸ್ತುತ ಹಂತದ ಆದಾಯ",
      potentialRevenue: "ಗ್ರಾಹಕ ಹಂತದ ಸಾಧ್ಯ ಆದಾಯ",
      recommendationSummary: "ಶಿಫಾರಸು ಸಾರಾಂಶ",
      buy: "ಖರೀದಿ",
      sell: "ಮಾರಾಟ",
      hold: "ಹಿಡಿದುಕೊಳ್ಳಿ",
      chartDescription: "ಶಿಫಾರಸಿನ ಹಿಂದೆ ಇರುವ ತೂಕೀಕೃತ ಸೂಚಿಗಳು.",
    },
  },
  te: {
    shell: {
      status: "సిస్టమ్ ఆరోగ్యంగా ఉంది",
      statusDetail: "బ్లాక్‌చైన్ మరియు API డేటా సమకాలీకరణలో ఉన్నాయి",
      mobileStatus: "సురక్షిత మొబైల్ యాక్సెస్ అందుబాటులో ఉంది",
      languageLabel: "భాష",
      searchPlaceholder: "లాట్లు, దశలు లేదా చలనం వెతకండి",
    },
    ai: {
      eyebrow: "AI అవగాహనలు",
      title: "రైతుల కోసం వివరణాత్మక మార్కెట్ ఇంటెలిజెన్స్",
      subtitle:
        "BUY, SELL లేదా HOLD సూచనలను విశ్వసనీయత శాతం, కారణాలు మరియు ట్రెండ్ వివరణతో పొందండి.",
      product: "ఉత్పత్తి",
      quantity: "పరిమాణం (కిలోలు)",
      farmerPrice: "రైతు ధర (రూ./కిలో)",
      currentStage: "ప్రస్తుత దశ",
      run: "AI విశ్లేషణ ప్రారంభించండి",
      analyzing: "విశ్లేషిస్తోంది...",
      listen: "నా భాషలో వినండి",
      stop: "ఆడియో ఆపు",
      emptyTitle: "ఇంకా సూచన లేదు",
      emptyDescription: "పంట, పరిమాణం మరియు ప్రస్తుత దశను ఎంచుకుని రైతు కోసం వివరమైన సూచన పొందండి.",
      recommendation: "సూచన",
      confidence: "నమ్మకం",
      why: "ఈ సూచన ఎందుకు ఇచ్చాం",
      trend: "చారిత్రక ధోరణి వివరణ",
      movement: "అంచనా మార్పు",
      next24h: "తదుపరి 24 గంటలు",
      next7d: "తదుపరి 7 రోజులు",
      factors: "ఫ్యాక్టర్ ప్రాముఖ్యత",
      drivers: "కారణ సూచీలు",
      stagePricing: "దశలవారీ ధర",
      revenue: "ఆదాయం అంచనా",
      currentRevenue: "ప్రస్తుత దశలో ఆదాయం",
      potentialRevenue: "వినియోగదారుడి దశలో సాధ్య ఆదాయం",
      recommendationSummary: "సూచన సారాంశం",
      buy: "కొనండి",
      sell: "అమ్మండి",
      hold: "పట్టుకోండి",
      chartDescription: "సూచన వెనుక ఉన్న బరువు కలిగిన సంకేతాలు.",
    },
  },
  ta: {
    shell: {
      status: "அமைப்பு சீராக உள்ளது",
      statusDetail: "ப்ளாக்செயின் மற்றும் API தரவு ஒத்திசைக்கப்படுகிறது",
      mobileStatus: "பாதுகாப்பான மொபைல் அணுகல் செயல்பாட்டில் உள்ளது",
      languageLabel: "மொழி",
      searchPlaceholder: "லாட், நிலை அல்லது செயல்பாட்டை தேடுங்கள்",
    },
    ai: {
      eyebrow: "AI அறிவுறுத்தல்கள்",
      title: "விவரிக்கக்கூடிய விவசாய சந்தை நுண்ணறிவு",
      subtitle:
        "BUY, SELL அல்லது HOLD பரிந்துரைகளை நம்பிக்கை சதவீதம், காரணங்கள் மற்றும் போக்கு விளக்கத்துடன் பெறுங்கள்.",
      product: "பொருள்",
      quantity: "அளவு (கிலோ)",
      farmerPrice: "விவசாயி விலை (ரூ./கிலோ)",
      currentStage: "தற்போதைய நிலை",
      run: "AI பகுப்பாய்வை இயக்கவும்",
      analyzing: "பகுப்பாய்வு நடைபெறுகிறது...",
      listen: "என் மொழியில் கேளுங்கள்",
      stop: "ஒலியை நிறுத்து",
      emptyTitle: "இன்னும் பரிந்துரை இல்லை",
      emptyDescription: "பயிர், அளவு மற்றும் தற்போதைய நிலையை தேர்வு செய்து விளக்கமான விவசாயி வழிகாட்டலை பெறுங்கள்.",
      recommendation: "பரிந்துரை",
      confidence: "நம்பிக்கை",
      why: "இந்த பரிந்துரை ஏன் வழங்கப்பட்டது",
      trend: "வரலாற்று போக்கு விளக்கம்",
      movement: "எதிர்பார்க்கப்படும் மாற்றம்",
      next24h: "அடுத்த 24 மணி",
      next7d: "அடுத்த 7 நாட்கள்",
      factors: "காரண முக்கியத்துவம்",
      drivers: "முக்கிய காரணங்கள்",
      stagePricing: "நிலை வாரியான விலை",
      revenue: "வருவாய் மதிப்பீடு",
      currentRevenue: "தற்போதைய நிலையில் வருவாய்",
      potentialRevenue: "நுகர்வோர் நிலையில் சாத்திய வருவாய்",
      recommendationSummary: "பரிந்துரை சுருக்கம்",
      buy: "வாங்கவும்",
      sell: "விற்கவும்",
      hold: "காத்திருக்கவும்",
      chartDescription: "பரிந்துரையின் பின்னணி காரணிகள்.",
    },
  },
};

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (LANGUAGE_OPTIONS.some((option) => option.code === savedLanguage)) {
    return savedLanguage;
  }

  return "en";
}

function readPath(language, path) {
  return path.split(".").reduce((value, key) => value?.[key], translations[language]);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const value = useMemo(() => {
    const option = LANGUAGE_OPTIONS.find((item) => item.code === language) || LANGUAGE_OPTIONS[0];

    return {
      language,
      setLanguage,
      currentLanguage: option,
      t: (path, fallback = path) => readPath(language, path) || fallback,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
