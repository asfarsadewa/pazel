import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    const response = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      {
        prompt: `${prompt}`,
        model: 'recraftv3',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RECRAFT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({ imageUrl: response.data.data[0].url })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
} 