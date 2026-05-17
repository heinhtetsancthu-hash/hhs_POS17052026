
import { GoogleGenAI, Chat } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from '../constants';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      // Recommended model for Basic Text Tasks
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
      },
    });
  }
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  // Check if browser is offline
  if (!navigator.onLine) {
    return "I am currently offline. Please connect to the internet to use the AI assistant. Your other business tools (Finance, Sales, etc.) are still working normally!";
  }

  try {
    const chat = getChatSession();
    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "I'm having trouble connecting to the AI service. This might be due to a poor internet connection. Please try again later.";
  }
};
