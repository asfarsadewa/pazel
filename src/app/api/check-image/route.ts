import { NextRequest, NextResponse } from 'next/server'

// In a production app, use Redis or a database
const imageJobs = new Map<string, { status: string; url?: string }>()

export function getImageJob(jobId: string) {
  return imageJobs.get(jobId)
}

export function setImageJob(jobId: string, status: string, url?: string) {
  imageJobs.set(jobId, { status, url })
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const job = getImageJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
} 