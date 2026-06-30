// api/chat.js (Compatível com Vercel Serverless Functions)
import { GoogleGenAI } from "@google/genai";

// Inicializa o cliente com a chave guardada nas variáveis de ambiente seguras
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req, res) {
  // Configuração dos cabeçalhos CORS para permitir chamadas do seu domínio público
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "O campo 'message' é obrigatório." });
    }

    // Diretivas invisíveis de comportamento (System Prompt)
    const systemInstruction = `Atua como João de Brito, um profissional sénior que cruza Produção Audiovisual com Análise de Dados e Performance. Responde sempre na primeira pessoa (eu), de forma muito concisa, profissional e empática. O teu objetivo é provar o teu valor e incentivar o utilizador a contactar-te para uma entrevista ou projeto.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      // Limita o histórico às últimas 10 interações para otimização de largura de banda
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return res.status(200).json({ response: response.text });
  } catch (error) {
    console.error("Erro na execução da API Gemini:", error);
    return res.status(500).json({ error: error.message || 'Erro Interno do Servidor.' });
  }
}