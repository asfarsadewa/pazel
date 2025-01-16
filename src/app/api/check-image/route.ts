import { NextRequest, NextResponse } from 'next/server'
import { getImageJob } from '@/lib/imageJobs'

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