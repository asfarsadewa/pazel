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
          content: "You are a creative prompt generator. Generate creative prompt describing an interesting fantasy or renaissance style scene. No json-like structure like title key nor description key. Just clear, imaginative sentences that can be turned into a picture. Consider that the picture will be turned into a grid puzzle later."
        },
        {
          role: "user",
          content: "Generate a prompt"
        }
      ],
      model: "gpt-4o",
    })

    const prompt = completion.choices[0].message.content

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal mengarang prompt' }, { status: 500 })
  }
} 