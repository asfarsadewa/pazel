// In a production app, use Redis or a database
const imageJobs = new Map<string, { status: string; url?: string }>()

export function getImageJob(jobId: string) {
  return imageJobs.get(jobId)
}

export function setImageJob(jobId: string, status: string, url?: string) {
  imageJobs.set(jobId, { status, url })
} 