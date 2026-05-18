import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { crimeScenario, prosecutorArgument, defendantArgument, voteDistribution } = await request.json()

    // Construct the prompt for the AI Judge
    const prompt = `
You are an AI Supreme Court Judge in a chaotic, absurd courtroom. Your task is to deliver a theatrical, witty, and ruthless verdict based on the arguments presented.

Case Scenario: "${crimeScenario}"

Prosecutor's Argument: "${prosecutorArgument}"

Defendant's Argument: "${defendantArgument}"

Jury Vote Distribution: Guilty: ${voteDistribution.guilty}, Not Guilty: ${voteDistribution.not_guilty}

Instructions:
1. Analyze both arguments, considering the jury's potential bias.
2. Deliver a final verdict (GUILTY or NOT GUILTY).
3. If GUILTY, devise an absurd, ironic, or hilariously fitting punishment.
4. Provide a detailed reasoning for your verdict in the style of a dramatic, witty Supreme Court Justice.
5. Keep your response concise but vivid, suitable for display on a "Verdict Certificate".

Output Format:
VERDICT: [GUILTY or NOT GUILTY]
PUNISHMENT: [If guilty, describe the absurd punishment; if not guilty, state "No punishment, the defendant is free."]
REASONING: [Your detailed reasoning]
`

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the response to extract verdict, punishment, and reasoning
    const verdictMatch = text.match(/VERDICT:\s*(GUILTY|NOT GUILTY)/i)
    const punishmentMatch = text.match(/PUNISHMENT:\s*([\s\S]*?)(?=REASONING:|$)/i)
    const reasoningMatch = text.match(/REASONING:\s*([\s\S]*)/i)

    const verdict = verdictMatch ? verdictMatch[1].toLowerCase() === 'guilty' ? 'guilty' : 'not_guilty' : 'not_guilty'
    const punishment = punishmentMatch ? punishmentMatch[1].trim() : null
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null

    // Return structured data
    return NextResponse.json({
      verdict,
      punishment,
      reasoning
    })
  } catch (error) {
    console.error('Error in Gemini AI judge:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI verdict' },
      { status: 500 }
    )
  }
}