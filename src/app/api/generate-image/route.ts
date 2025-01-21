import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setImageJob } from '@/lib/imageJobs'

const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // 1 second

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url)
    return response.status === 200
  } catch {
    return false
  }
}

async function generateImage(prompt: string, jobId: string, retryCount = 0) {
  try {
    const response = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      {
        prompt: `${prompt}`,
        style: 'digital_illustration',
        model: 'recraftv3',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RECRAFT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const imageUrl = response.data.data[0].url
    
    // Validate the generated image URL
    if (await validateImageUrl(imageUrl)) {
      setImageJob(jobId, 'completed', imageUrl)
    } else if (retryCount < MAX_RETRIES) {
      // Retry after delay
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      await generateImage(prompt, jobId, retryCount + 1)
    } else {
      setImageJob(jobId, 'failed')
    }
  } catch (error) {
    console.error('Error generating image:', error)
    if (retryCount < MAX_RETRIES) {
      // Retry after delay
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      await generateImage(prompt, jobId, retryCount + 1)
    } else {
      setImageJob(jobId, 'failed')
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    const jobId = Math.random().toString(36).substring(7)

    // Start the job
    setImageJob(jobId, 'pending')

    // Start image generation in the background (non-blocking)
    generateImage(prompt, jobId)

    // Return immediately with the job ID
    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Error starting image generation:', error)
    return NextResponse.json({ error: 'Failed to start image generation' }, { status: 500 })
  }
} 