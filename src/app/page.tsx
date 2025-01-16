"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [prompt, setPrompt] = useState<string>("")

  const generatePuzzle = async () => {
    try {
      setLoading(true)
      
      // First get the prompt from OpenAI
      const promptResponse = await fetch('/api/generate-prompt')
      const promptData = await promptResponse.json()
      setPrompt(promptData.prompt)
      
      // Then use the prompt to generate image
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptData.prompt }),
      })
      
      const imageData = await imageResponse.json()
      setImageUrl(imageData.imageUrl)
    } catch (error) {
      console.error('Error generating puzzle:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-center">Pazel</h1>
        
        <Button 
          onClick={generatePuzzle}
          disabled={loading}
          className="text-lg"
        >
          {loading ? "Menggambar..." : "Main"}
        </Button>

        {prompt && (
          <div className="w-full max-w-2xl bg-gradient-to-r from-pink-50 to-blue-50 p-6 rounded-lg shadow-sm border border-pink-100/50">
            {/* <h2 className="text-lg font-semibold text-gray-700 mb-2">Generated Prompt:</h2> */}
            <p className="text-gray-600 leading-relaxed italic">"{prompt}"</p>
          </div>
        )}

        {imageUrl && (
          <div className="relative w-full aspect-square max-w-2xl border-2 border-gray-200 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Generated puzzle image"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  )
}
