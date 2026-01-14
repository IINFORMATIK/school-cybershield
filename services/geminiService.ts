
import { GoogleGenAI, Type } from "@google/genai";
import { Device, Vulnerability, SecurityLevel } from "../types";

export const analyzeSecurityLandscape = async (devices: Device[], wifiNetworks: any[]) => {
  // Instantiate GoogleGenAI inside the function to ensure it uses the latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare detailed device information for analysis
  const deviceSummary = devices.map((d: any) => ({
    ip: d.ip,
    mac: d.mac,
    hostname: d.hostname,
    vendor: d.vendor || 'Unknown',
    type: d.type,
    status: d.status
  }));

  const prompt = `Ты эксперт по информационной безопасности в образовательных учреждениях.
  
Проанализируй состояние информационной безопасности школьной сети на основе следующих данных:
- Найденные устройства: ${JSON.stringify(deviceSummary)}
- Wi-Fi сети: ${JSON.stringify(wifiNetworks || [])}

Твоя задача:
1. Выявить потенциальные уязвимости и риски для школьной сети
2. Оценить серьезность каждого риска (Low, Medium, High, Critical)
3. Предоставить конкретные рекомендации по устранению

Важно:
- Учитывай контекст школьной среды (дети, образовательные процессы)
- Fokus на практических и реализуемых рекомендациях
- Возвращай ответ ТОЛЬКО в формате JSON, без дополнительного текста`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vulnerabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  deviceId: { type: Type.STRING },
                  severity: { type: Type.STRING, description: 'Low, Medium, High, Critical' },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ['id', 'severity', 'title', 'description', 'recommendation']
              }
            },
            overallScore: { type: Type.NUMBER, description: '0-100 security health score' },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API error:", error);
    // Return fallback analysis if API fails
    return {
      vulnerabilities: [
        {
          id: 'fall-001',
          deviceId: 'unknown',
          severity: 'Medium',
          title: 'Требуется анализ сети',
          description: 'Не удалось выполнить анализ с помощью AI. Пожалуйста, попробуйте позже.',
          recommendation: 'Убедитесь, что API ключ Gemini установлен корректно.'
        }
      ],
      overallScore: 75,
      summary: 'Анализ не доступен'
    };
  }
};

export const getSystemHardeningGuideline = async (os: string) => {
  // Instantiate GoogleGenAI inside the function to ensure it uses the latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Ты эксперт по информационной безопасности. Предоставь 5 ключевых шагов по настройке безопасности (hardening) для операционной системы: ${os}.

Требования:
- Фокус на школьной сетевой среде
- Практические и реализуемые рекомендации
- На русском языке
- Каждый шаг должен быть четким и конкретным`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return `Рекомендации по защите ${os}:\n1. Установить все критические обновления безопасности\n2. Настроить локальный брандмауэр\n3. Включить антивирусное ПО\n4. Отключить ненужные сервисы\n5. Настроить сильные политики доступа`;
  }
};
