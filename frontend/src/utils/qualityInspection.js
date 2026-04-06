function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return { hue: hue / 6, saturation, lightness };
}

async function loadImageBitmap(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function extractVisualSignals(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const width = 180;
  const height = Math.max(120, Math.round((image.height / image.width) * width));

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const brightnessValues = [];
  const saturationValues = [];
  let bruisePixels = 0;
  let fungusPixels = 0;
  let dryLeafPixels = 0;
  let damagePixels = 0;
  let greenPixels = 0;
  let warmPixels = 0;
  let packageEdgeMismatch = 0;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha < 32) {
      continue;
    }

    const brightness = (red + green + blue) / 3;
    const { saturation } = rgbToHsl(red, green, blue);

    brightnessValues.push(brightness);
    saturationValues.push(saturation * 100);

    if (brightness < 72 && red > blue + 10) {
      bruisePixels += 1;
    }

    if (green > 120 && red > 120 && blue > 110) {
      fungusPixels += 1;
    }

    if (red > 145 && green > 130 && blue < 90) {
      dryLeafPixels += 1;
    }

    if (brightness < 50 || (red > 170 && blue > 150 && green < 120)) {
      damagePixels += 1;
    }

    if (green > red + 8) {
      greenPixels += 1;
    }

    if (red > green + 10) {
      warmPixels += 1;
    }
  }

  const totalPixels = Math.max(brightnessValues.length, 1);
  const borderSample = context.getImageData(0, 0, width, 10).data;
  for (let index = 0; index < borderSample.length; index += 4) {
    const red = borderSample[index];
    const green = borderSample[index + 1];
    const blue = borderSample[index + 2];
    const brightness = (red + green + blue) / 3;
    if (brightness < 40 || brightness > 230) {
      packageEdgeMismatch += 1;
    }
  }

  return {
    brightness: average(brightnessValues),
    saturation: average(saturationValues),
    bruiseRatio: bruisePixels / totalPixels,
    fungusRatio: fungusPixels / totalPixels,
    dryLeafRatio: dryLeafPixels / totalPixels,
    damageRatio: damagePixels / totalPixels,
    greenRatio: greenPixels / totalPixels,
    warmRatio: warmPixels / totalPixels,
    packageEdgeRatio: packageEdgeMismatch / Math.max(borderSample.length / 4, 1),
  };
}

function buildInspectionResult(signals, fileName = "") {
  const freshnessScore = clamp(
    72 + signals.saturation * 0.18 + signals.brightness * 0.06 - signals.dryLeafRatio * 240 - signals.fungusRatio * 300,
    18,
    98
  );
  const qualityScore = clamp(
    74 + signals.saturation * 0.14 - signals.bruiseRatio * 260 - signals.damageRatio * 230 - signals.packageEdgeRatio * 70,
    15,
    97
  );
  const spoilageLikelihood = clamp(
    18 + signals.fungusRatio * 320 + signals.damageRatio * 180 + signals.dryLeafRatio * 120 - signals.greenRatio * 30,
    4,
    96
  );
  const packagingQuality = clamp(
    82 - signals.packageEdgeRatio * 120 - signals.damageRatio * 30,
    28,
    96
  );

  const defectFlags = [];
  if (signals.bruiseRatio > 0.045) {
    defectFlags.push("Bruises or compression marks are visible.");
  }
  if (signals.fungusRatio > 0.018) {
    defectFlags.push("Possible fungus or surface spotting detected.");
  }
  if (signals.dryLeafRatio > 0.04) {
    defectFlags.push("Leaf dryness or dehydration is noticeable.");
  }
  if (signals.damageRatio > 0.07) {
    defectFlags.push("Visible damage or dark patches need attention.");
  }
  if (packagingQuality < 55) {
    defectFlags.push("Packaging edges appear weak or inconsistent.");
  }

  const ripeness = clamp(48 + signals.warmRatio * 70 - signals.greenRatio * 25, 10, 96);
  let recommendation = "safe";
  if (spoilageLikelihood > 58 || qualityScore < 45) {
    recommendation = "avoid";
  } else if (spoilageLikelihood > 34 || qualityScore < 68) {
    recommendation = "caution";
  }

  const qualityGrade = qualityScore >= 80 ? "A" : qualityScore >= 60 ? "B" : "C";
  const confidence = clamp(
    62 + Math.abs(signals.saturation - 42) * 0.3 + defectFlags.length * 3,
    58,
    93
  );

  const explanation = `${fileName || "Uploaded crop image"} shows ${
    recommendation === "safe"
      ? "healthy color retention and limited surface damage"
      : recommendation === "caution"
        ? "mixed quality signals with some visible stress"
        : "clear spoilage or damage indicators"
  }.`;

  return {
    qualityGrade,
    qualityScore: Math.round(qualityScore),
    freshnessScore: Math.round(freshnessScore),
    spoilageLikelihood: Math.round(spoilageLikelihood),
    packagingQuality: Math.round(packagingQuality),
    ripeness: Math.round(ripeness),
    confidence: Math.round(confidence),
    recommendation,
    defectDetection: defectFlags.length ? defectFlags : ["No major visible external defects detected."],
    factorBreakdown: [
      { label: "Color freshness", score: Math.round(clamp(freshnessScore + signals.greenRatio * 10, 0, 100)) },
      { label: "Bruises", score: Math.round(clamp(100 - signals.bruiseRatio * 800, 0, 100)) },
      { label: "Fungus / spots", score: Math.round(clamp(100 - signals.fungusRatio * 1200, 0, 100)) },
      { label: "Ripeness", score: Math.round(ripeness) },
      { label: "Leaf dryness", score: Math.round(clamp(100 - signals.dryLeafRatio * 900, 0, 100)) },
      { label: "Visible damage", score: Math.round(clamp(100 - signals.damageRatio * 700, 0, 100)) },
      { label: "Packaging quality", score: Math.round(packagingQuality) },
    ],
    explanation,
    signals,
  };
}

export async function analyzeQualityImage(file) {
  const image = await loadImageBitmap(file);
  const signals = extractVisualSignals(image);

  return buildInspectionResult(signals, file?.name || "");
}
