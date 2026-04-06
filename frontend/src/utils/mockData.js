export const productList = [
  "Tomato",
  "Onion",
  "Potato",
  "Rice",
  "Wheat",
  "Banana",
  "Apple",
  "Mango",
  "Carrot",
  "Cabbage",
  "Corn",
];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateId = () => Math.random().toString(36).substring(2, 10);

/**
 * Generates mock products with basePrice and a random currentStageIndex (0–4).
 */
export function generateMockData(count = 150) {
  const data = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    data.push({
      id: generateId(),
      name: getRandomElement(productList),
      quantity: getRandomInt(50, 500),
      basePrice: getRandomInt(10, 120),
      currentStageIndex: getRandomInt(0, 4),
      createdAt: new Date(now - getRandomInt(100000, 10000000)).toISOString(),
    });
  }

  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function generateMockLogs(lots) {
  const logs = [];
  lots.forEach((lot) => {
    const basePrice = lot.basePrice ?? lot.price ?? 0;
    
    // Created event
    logs.push({
      id: generateId(),
      message: `${lot.name} lot (${lot.quantity}kg) created at Farmer stage with price ₹${basePrice}`,
      timestamp: lot.createdAt || new Date().toISOString(),
    });

    // If it has moved stages, add an event for its current stage
    if (lot.currentStageIndex > 0) {
      const stageNames = ["Farmer", "Processing", "Distributor", "Retail", "Consumer"];
      const currentStage = stageNames[lot.currentStageIndex];
      // Add artificial delay for the log timestamp
      const movedTime = new Date(new Date(lot.createdAt).getTime() + (lot.currentStageIndex * 3600000));
      
      logs.push({
        id: generateId(),
        message: `${lot.name} moved to ${currentStage} stage`,
        timestamp: movedTime.toISOString(),
      });
    }
  });

  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
}
