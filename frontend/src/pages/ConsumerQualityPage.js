import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Mic,
  ScanSearch,
  ShieldAlert,
  Square,
} from "lucide-react";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

import { useLanguage } from "../components/LanguageProvider";
import { EmptyState } from "../components/EmptyState";
import { analyzeQualityImage } from "../utils/qualityInspection";

const recommendationMeta = {
  safe: {
    icon: CheckCircle2,
    className: "safe",
  },
  caution: {
    icon: AlertTriangle,
    className: "caution",
  },
  avoid: {
    icon: ShieldAlert,
    className: "avoid",
  },
};

const localized = {
  en: {
    title: "Consumer AI Quality Inspection",
    description:
      "Upload a crop or packaged produce image to get a future-ready AI quality assessment with freshness, defects, and spoilage guidance.",
    gallery: "Upload Image",
    camera: "Use Camera",
    inspect: "Inspect Quality",
    inspecting: "Inspecting...",
    preview: "Preview",
    quality: "Quality score",
    freshness: "Freshness score",
    spoilage: "Spoilage likelihood",
    defects: "Defect detection",
    packaging: "Packaging quality",
    confidence: "Confidence",
    explanation: "Simple explanation",
    listen: "Voice explanation",
    stop: "Stop audio",
    emptyTitle: "No image inspected yet",
    emptyDescription: "Upload a fresh crop or product image to generate a consumer-facing quality report.",
    qualityGrade: "Quality grade",
    recommendation: "Recommendation",
  },
  hi: {
    title: "उपभोक्ता AI गुणवत्ता निरीक्षण",
    description:
      "फसल या पैकेज्ड उत्पाद की तस्वीर अपलोड करें और ताजगी, दोष तथा खराब होने की संभावना पर AI-आधारित रिपोर्ट पाएं।",
    gallery: "चित्र अपलोड करें",
    camera: "कैमरा उपयोग करें",
    inspect: "गुणवत्ता जांचें",
    inspecting: "जांच हो रही है...",
    preview: "पूर्वावलोकन",
    quality: "गुणवत्ता स्कोर",
    freshness: "ताजगी स्कोर",
    spoilage: "खराब होने की संभावना",
    defects: "दोष पहचान",
    packaging: "पैकेजिंग गुणवत्ता",
    confidence: "विश्वास",
    explanation: "सरल व्याख्या",
    listen: "आवाज़ में सुनें",
    stop: "ऑडियो रोकें",
    emptyTitle: "अभी तक कोई चित्र जांचा नहीं गया",
    emptyDescription: "उपभोक्ता-उन्मुख गुणवत्ता रिपोर्ट के लिए फसल या उत्पाद का चित्र अपलोड करें।",
    qualityGrade: "गुणवत्ता ग्रेड",
    recommendation: "सिफारिश",
  },
  kn: {
    title: "ಗ್ರಾಹಕ AI ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ",
    description:
      "ಬೆಳೆ ಅಥವಾ ಪ್ಯಾಕೇಜ್ ಮಾಡಿದ ಉತ್ಪನ್ನದ ಚಿತ್ರವನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ ತಾಜಾತನ, ದೋಷ ಮತ್ತು ಹಾಳಾಗುವ ಸಾಧ್ಯತೆಯ ವರದಿ ಪಡೆಯಿರಿ.",
    gallery: "ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
    camera: "ಕ್ಯಾಮೆರಾ ಬಳಸಿ",
    inspect: "ಗುಣಮಟ್ಟ ಪರಿಶೀಲಿಸಿ",
    inspecting: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    preview: "ಪೂರ್ವ ವೀಕ್ಷಣೆ",
    quality: "ಗುಣಮಟ್ಟ ಅಂಕ",
    freshness: "ತಾಜಾತನ ಅಂಕ",
    spoilage: "ಹಾಳಾಗುವ ಸಾಧ್ಯತೆ",
    defects: "ದೋಷ ಪತ್ತೆ",
    packaging: "ಪ್ಯಾಕೇಜಿಂಗ್ ಗುಣಮಟ್ಟ",
    confidence: "ವಿಶ್ವಾಸ",
    explanation: "ಸರಳ ವಿವರಣೆ",
    listen: "ಧ್ವನಿ ವಿವರಣೆ",
    stop: "ಧ್ವನಿ ನಿಲ್ಲಿಸಿ",
    emptyTitle: "ಇನ್ನೂ ಯಾವುದೇ ಚಿತ್ರ ಪರಿಶೀಲಿಸಿಲ್ಲ",
    emptyDescription: "ಗ್ರಾಹಕ ಗುಣಮಟ್ಟ ವರದಿ ಪಡೆಯಲು ಉತ್ಪನ್ನದ ಚಿತ್ರವನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ.",
    qualityGrade: "ಗುಣಮಟ್ಟ ದರ್ಜೆ",
    recommendation: "ಶಿಫಾರಸು",
  },
  te: {
    title: "వినియోగదారు AI నాణ్యత తనిఖీ",
    description:
      "పంట లేదా ప్యాకేజ్డ్ ఉత్పత్తి చిత్రాన్ని అప్లోడ్ చేసి తాజాదనం, లోపాలు, పాడయ్యే అవకాశంపై నివేదిక పొందండి.",
    gallery: "చిత్రం అప్లోడ్ చేయండి",
    camera: "కెమెరా ఉపయోగించండి",
    inspect: "నాణ్యత తనిఖీ",
    inspecting: "తనిఖీ జరుగుతోంది...",
    preview: "ప్రివ్యూ",
    quality: "నాణ్యత స్కోర్",
    freshness: "తాజాదనం స్కోర్",
    spoilage: "పాడయ్యే అవకాశం",
    defects: "లోపాల గుర్తింపు",
    packaging: "ప్యాకేజింగ్ నాణ్యత",
    confidence: "నమ్మకం",
    explanation: "సులభ వివరణ",
    listen: "వాయిస్ వివరణ",
    stop: "ఆడియో ఆపు",
    emptyTitle: "ఇంకా చిత్రం విశ్లేషించలేదు",
    emptyDescription: "వినియోగదారుని కోసం నాణ్యత నివేదిక పొందేందుకు చిత్రం అప్లోడ్ చేయండి.",
    qualityGrade: "నాణ్యత గ్రేడ్",
    recommendation: "సూచన",
  },
  ta: {
    title: "நுகர்வோர் AI தர ஆய்வு",
    description:
      "பயிர் அல்லது பொதியிடப்பட்ட பொருளின் படத்தைப் பதிவேற்றி, பசுமை, குறைபாடு மற்றும் கெடுதல் வாய்ப்பு அறிக்கையைப் பெறுங்கள்.",
    gallery: "படத்தை பதிவேற்று",
    camera: "கேமரா பயன்படுத்து",
    inspect: "தரத்தை ஆய்வு செய்",
    inspecting: "ஆய்வு நடைபெறுகிறது...",
    preview: "முன்னோட்டம்",
    quality: "தர மதிப்பெண்",
    freshness: "புதுமை மதிப்பெண்",
    spoilage: "கெடுதல் சாத்தியம்",
    defects: "குறைபாடு கண்டறிதல்",
    packaging: "பேக்கேஜிங் தரம்",
    confidence: "நம்பிக்கை",
    explanation: "எளிய விளக்கம்",
    listen: "ஒலி விளக்கம்",
    stop: "ஒலியை நிறுத்து",
    emptyTitle: "இன்னும் எந்தப் படம் ஆய்வு செய்யப்படவில்லை",
    emptyDescription: "நுகர்வோர் தர அறிக்கைக்காக ஒரு பொருள் படத்தைப் பதிவேற்றுங்கள்.",
    qualityGrade: "தர நிலை",
    recommendation: "பரிந்துரை",
  },
};

function getCopy(language) {
  return localized[language] || localized.en;
}

function getRecommendationLabel(recommendation) {
  const labels = {
    safe: "Safe",
    caution: "Caution",
    avoid: "Avoid",
  };

  return labels[recommendation] || recommendation;
}

function buildVoiceSummary(result, copy) {
  if (!result) {
    return "";
  }

  return [
    `${copy.recommendation}: ${getRecommendationLabel(result.recommendation)}.`,
    `${copy.qualityGrade}: ${result.qualityGrade}.`,
    `${copy.quality}: ${result.qualityScore} percent.`,
    `${copy.freshness}: ${result.freshnessScore} percent.`,
    `${copy.spoilage}: ${result.spoilageLikelihood} percent.`,
    `${copy.explanation}: ${result.explanation}`,
  ].join(" ");
}

export default function ConsumerQualityPage() {
  const { language, currentLanguage } = useLanguage();
  const copy = getCopy(language);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [previewUrl]);

  const voiceSummary = useMemo(() => buildVoiceSummary(result, copy), [copy, result]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setResult(null);
  };

  const handleInspect = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const inspection = await analyzeQualityImage(file);
      setResult(inspection);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!voiceSummary || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceSummary);
    utterance.lang = currentLanguage.speech;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const recommendation = recommendationMeta[result?.recommendation || "safe"];
  const RecommendationIcon = recommendation.icon;
  const recommendationLabel = getRecommendationLabel(result?.recommendation || "safe");

  return (
    <section className="page-section consumer-quality-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Consumer AI</div>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
      </div>

      <div className="consumer-quality-layout">
        <div className="glass-card consumer-upload-card">
          <div className="section-heading">
            <h3>{copy.preview}</h3>
            <p>Mock CV inference today, future-ready for OpenCV or a vision API tomorrow.</p>
          </div>

          <div className="consumer-upload-actions">
            <label className="button button-secondary consumer-upload-button">
              <ImagePlus size={16} />
              {copy.gallery}
              <input type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>

            <label className="button button-secondary consumer-upload-button">
              <Camera size={16} />
              {copy.camera}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} hidden />
            </label>
          </div>

          <div className="consumer-preview-panel">
            {previewUrl ? (
              <img src={previewUrl} alt="Consumer quality preview" className="consumer-preview-image" />
            ) : (
              <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
            )}
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={handleInspect}
            disabled={!file || loading}
          >
            {loading ? copy.inspecting : copy.inspect}
          </button>
        </div>

        <div className="consumer-quality-results">
          {result ? (
            <motion.div
              className="consumer-quality-grid"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <div className="glass-card consumer-quality-hero">
                <div>
                  <div className="eyebrow">{copy.recommendation}</div>
                  <h3>{recommendationLabel}</h3>
                  <p>{result.explanation}</p>
                </div>
                <div className={`consumer-quality-badge ${recommendation.className}`}>
                  <RecommendationIcon size={20} />
                  <strong>{result.qualityGrade}</strong>
                  <span>{copy.qualityGrade}</span>
                </div>
              </div>

              <div className="consumer-score-grid">
                <div className="glass-card consumer-score-card">
                  <span>{copy.quality}</span>
                  <strong>{result.qualityScore}%</strong>
                </div>
                <div className="glass-card consumer-score-card">
                  <span>{copy.freshness}</span>
                  <strong>{result.freshnessScore}%</strong>
                </div>
                <div className="glass-card consumer-score-card">
                  <span>{copy.spoilage}</span>
                  <strong>{result.spoilageLikelihood}%</strong>
                </div>
                <div className="glass-card consumer-score-card">
                  <span>{copy.confidence}</span>
                  <strong>{result.confidence}%</strong>
                </div>
              </div>

              <div className="consumer-quality-chart-layout">
                <div className="glass-card consumer-chart-card">
                  <div className="section-heading">
                    <h3>Inspection radar</h3>
                    <p>Visible quality factors extracted from the uploaded image.</p>
                  </div>
                  <div className="consumer-radar-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={result.factorBreakdown} outerRadius="70%">
                        <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "rgb(100 116 139)" }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.28} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card consumer-factor-card">
                  <div className="section-heading">
                    <h3>{copy.defects}</h3>
                    <p>{copy.explanation}</p>
                  </div>
                  <div className="consumer-factor-list">
                    {result.factorBreakdown.map((factor) => (
                      <div key={factor.label} className="consumer-factor-row">
                        <div>
                          <strong>{factor.label}</strong>
                          <p>{factor.score}/100</p>
                        </div>
                        <div className="consumer-factor-bar">
                          <div className="consumer-factor-fill" style={{ width: `${factor.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="consumer-quality-chart-layout">
                <div className="glass-card consumer-defect-card">
                  <div className="section-heading">
                    <h3>{copy.defects}</h3>
                    <p>Detected visible defects and risk indicators from the image.</p>
                  </div>
                  <div className="consumer-defect-list">
                    {result.defectDetection.map((defect, index) => (
                      <div key={`${defect}-${index}`} className="consumer-defect-item">
                        <ScanSearch size={16} />
                        <span>{defect}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card consumer-explanation-card">
                  <div className="section-heading">
                    <h3>{copy.explanation}</h3>
                    <p>Regional-language-friendly explanation for consumers.</p>
                  </div>
                  <p className="consumer-explanation-text">{result.explanation}</p>
                  <p className="consumer-explanation-text">
                    {copy.packaging}: {result.packagingQuality}% · Ripeness: {result.ripeness}%
                  </p>
                  <div className="ai-voice-actions">
                    <button type="button" className="button button-secondary" onClick={handleSpeak}>
                      <Mic size={16} />
                      {copy.listen}
                    </button>
                    <button type="button" className="button button-secondary" onClick={handleStop} disabled={!isSpeaking}>
                      <Square size={14} />
                      {copy.stop}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card empty-state-card">
              <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
