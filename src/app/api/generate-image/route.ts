import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setImageJob } from '@/lib/imageJobs'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    const jobId = Math.random().toString(36).substring(7)

    // Start the job
    setImageJob(jobId, 'pending')

    // Start image generation in the background
    generateImage(prompt, jobId)

    // Return immediately with the job ID
    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Error starting image generation:', error)
    return NextResponse.json({ error: 'Failed to start image generation' }, { status: 500 })
  }
}

async function generateImage(prompt: string, jobId: string) {
  try {
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

    setImageJob(jobId, 'completed', response.data.data[0].url)
  } catch (error) {
    console.error('Error generating image:', error)
    setImageJob(jobId, 'failed')
  }
} 