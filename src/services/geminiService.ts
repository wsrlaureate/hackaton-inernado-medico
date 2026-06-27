import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing! AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey });

export interface DiagnosticTest {
  id: string;
  name: string;
  result: string;
  interpretation: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  patientDescription: string;
  patientPersonality: "colaborador" | "irrespetuoso" | "callado" | "ansioso";
  vitals: {
    temp: string;
    bp: string;
    hr: string;
    rr: string;
    sat: string;
  };
  history: string;
  physicalExam: string;
  diagnosticTests: DiagnosticTest[];
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface PatientMessage {
  role: "patient" | "doctor";
  content: string;
}

export const generateClinicalCase = async (area: string, difficulty: number, hospitalType: string): Promise<ClinicalCase> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera un caso clínico riguroso para un interno de medicina en Perú en el área de ${area}. 
    El hospital es de tipo ${hospitalType} (MINSA suele tener menos recursos, EsSalud más). 
    Dificultad nivel ${difficulty}/10. 
    Asigna una personalidad al paciente: "colaborador", "irrespetuoso" (difícil de tratar), "callado" (da poca información) o "ansioso".
    Incluye datos realistas, funciones vitales, historia clínica y examen físico. 
    Genera una lista de 4-5 exámenes auxiliares (laboratorio, imágenes como radiografías, ecografías, etc.) que el médico podría pedir, con sus resultados e interpretación.
    Luego proporciona 3 preguntas de opción múltiple con explicaciones detalladas basadas en guías peruanas (MINSA/EsSalud) o internacionales (UpToDate/Harrison).`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" as any },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          patientDescription: { type: Type.STRING },
          patientPersonality: { type: Type.STRING, enum: ["colaborador", "irrespetuoso", "callado", "ansioso"] },
          vitals: {
            type: Type.OBJECT,
            properties: {
              temp: { type: Type.STRING },
              bp: { type: Type.STRING },
              hr: { type: Type.STRING },
              rr: { type: Type.STRING },
              sat: { type: Type.STRING },
            },
            required: ["temp", "bp", "hr", "rr", "sat"],
          },
          history: { type: Type.STRING },
          physicalExam: { type: Type.STRING },
          diagnosticTests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                result: { type: Type.STRING },
                interpretation: { type: Type.STRING },
              },
              required: ["id", "name", "result", "interpretation"],
            },
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["id", "title", "patientDescription", "patientPersonality", "vitals", "history", "physicalExam", "diagnosticTests", "questions"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const getMentorAdvice = async (caseInfo: string, currentStep: string, personality: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Eres el Doctor Jefe de Internos. Tu personalidad es: ${personality} (puede ser "docil/amable", "duro/estricto" o "espeso/sarcástico"). 
    Un interno te pide consejo sobre este caso: ${caseInfo}. 
    Están en el paso: ${currentStep}. 
    Da un consejo breve y riguroso manteniendo tu personalidad. Si eres "espeso", ayúdalo pero hazlo sentir que debería saberlo.`,
    config: {
      thinkingConfig: { thinkingLevel: "LOW" as any }
    }
  });
  return response.text || "Sigue evaluando al paciente con rigor, interno.";
};

export const getPatientResponse = async (history: string, personality: string, messages: PatientMessage[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: `Eres un paciente en un hospital de Lima, Perú. Tu personalidad es: ${personality}. 
      Tu historia clínica es: ${history}. 
      Responde de forma natural según tu personalidad. 
      Si eres "irrespetuoso", sé difícil y quéjate del hospital. 
      Si eres "callado", responde con monosílabos o frases cortas. 
      Si eres "ansioso", pregunta mucho si te vas a morir o si es grave.
      No des el diagnóstico, solo describe cómo te sientes.` },
      ...messages.map(m => ({ text: `${m.role === "doctor" ? "Doctor" : "Paciente"}: ${m.content}` }))
    ],
    config: {
      thinkingConfig: { thinkingLevel: "LOW" as any }
    }
  });

  return response.text || "No me siento muy bien, doctor...";
};

export const getResponseWithAudio = async (
  history: string, 
  personality: string, 
  messages: PatientMessage[],
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
): Promise<{ text: string, audio: string | null }> => {
  try {
    // Usamos el modelo TTS para generar ambos si es posible, o gemini-2.5-flash que es multimodal
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        { text: `Eres un paciente en un hospital de Lima, Perú. Tu personalidad es: ${personality}. 
        Tu historia clínica es: ${history}. 
        Responde de forma natural según tu personalidad.
        No des el diagnóstico, solo describe cómo te sientes.
        Responde brevemente, máximo 2 oraciones.` },
        ...messages.map(m => ({ text: `${m.role === "doctor" ? "Doctor" : "Paciente"}: ${m.content}` }))
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    const text = response.text || "No me siento muy bien, doctor...";

    return { text, audio };
  } catch (error) {
    console.error("Error en respuesta multimodal:", error);
    // Fallback: Si falla el multimodal, intentamos solo texto (aunque será más lento)
    const text = await getPatientResponse(history, personality, messages);
    return { text, audio: null };
  }
};

export const generatePatientImage = async (description: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Un retrato realista de un paciente en una camilla de hospital. Descripción: ${description}. Estilo cinematográfico, iluminación de hospital, primer plano del rostro expresando su estado actual. Sin texto, sin marcas de agua.`,
          },
        ],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating patient image:", error);
    return null;
  }
};

export const generateSpeech = async (text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};
