import { GoogleGenerativeAI } from '@google/genai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })