import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a creative prompt generator for image generation."
        },
        {
          role: "user",
          content: "Generate a prompt that's interesting to be turned to a picture which will be turned into a puzzle"
        }
      ],
      model: "gpt-4-0125-preview",
    })

    const prompt = completion.choices[0].message.content

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Error generating prompt:', error)
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 })
  }
} 