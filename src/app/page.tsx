"use client"

import { Button } from "@/components/ui/button"
import { PuzzleGrid } from "@/components/PuzzleGrid"
import Image from "next/image"
import { useState } from "react"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [prompt, setPrompt] = useState<string>("")
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [isPuzzleMode, setIsPuzzleMode] = useState(false)

  const generatePuzzle = async () => {
    try {
      setLoading(true)
      setIsPromptExpanded(false)
      setIsPuzzleMode(false)
      
      const promptResponse = await fetch('/api/generate-prompt')
      const promptData = await promptResponse.json()
      setPrompt(promptData.prompt)
      
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptData.prompt }),
      })
      
      const { jobId } = await imageResponse.json()
      
      const checkStatus = async () => {
        const statusResponse = await fetch(`/api/check-image?jobId=${jobId}`)
        const statusData = await statusResponse.json()
        
        if (statusData.status === 'completed' && statusData.url) {
          setImageUrl(statusData.url)
          setLoading(false)
        } else if (statusData.status === 'failed') {
          console.error('Image generation failed')
          setLoading(false)
        } else {
          setTimeout(checkStatus, 1000)
        }
      }

      checkStatus()
    } catch (error) {
      console.error('Error generating puzzle:', error)
      setLoading(false)
    }
  }

  const startPuzzle = () => {
    setIsPuzzleMode(true)
  }

  const handleForfeit = () => {
    setIsPuzzleMode(false)
  }

  return (
    <div className="h-screen flex flex-col items-center p-4">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row lg:items-start items-center gap-8 pt-4 lg:pt-8">
        <div className="flex flex-col items-center lg:items-start gap-6 lg:gap-8 lg:w-1/3">
          <h1 className="text-4xl font-bold text-center lg:text-left bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 hover:from-violet-500 hover:to-pink-500 transition-all duration-500">
            Pazel
          </h1>
          
          <div className="flex gap-4 w-full lg:w-auto">
            <Button 
              onClick={generatePuzzle}
              disabled={loading}
              className="text-lg flex-1 lg:flex-none transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menggambar...
                </>
              ) : (
                "Main"
              )}
            </Button>

            {imageUrl && !isPuzzleMode && (
              <Button
                onClick={startPuzzle}
                disabled={loading}
                variant="secondary"
                className="text-lg flex-1 lg:flex-none transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menunggu...
                  </>
                ) : (
                  "Mulai Puzzle"
                )}
              </Button>
            )}
          </div>

          {prompt && (
            <div className="w-full">
              <button 
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-blue-50 rounded-t-lg border border-pink-100/50 lg:hidden"
              >
                <span className="text-sm text-gray-600">Prompt</span>
                {isPromptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={`w-full bg-gradient-to-r from-pink-50 to-blue-50 p-6 
                ${isPromptExpanded ? 'block' : 'hidden'} lg:block
                ${isPromptExpanded ? 'rounded-b-lg' : 'rounded-lg'}
                border border-pink-100/50 lg:rounded-lg`}
              >
                <p className="text-gray-600 leading-relaxed italic">"{prompt}"</p>
              </div>
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="relative w-full lg:w-2/3 aspect-square max-w-2xl">
            {isPuzzleMode ? (
              <PuzzleGrid imageUrl={imageUrl} onForfeit={handleForfeit} />
            ) : (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Generated puzzle image"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
