"use client"

import { useEffect, useState } from "react"
import { Skull } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PuzzlePiece {
  id: number
  currentPosition: number
  originalPosition: number
  isEmpty: boolean
}

interface PuzzleGridProps {
  imageUrl: string
  onForfeit: () => void
}

export function PuzzleGrid({ imageUrl, onForfeit }: PuzzleGridProps) {
  const GRID_SIZE = 4
  const TOTAL_PIECES = GRID_SIZE * GRID_SIZE
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])

  // Initialize puzzle pieces
  useEffect(() => {
    const initialPieces: PuzzlePiece[] = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
      id: index,
      currentPosition: index,
      originalPosition: index,
      isEmpty: index === 0 // Top-left piece is empty
    }))

    // Shuffle pieces (excluding the empty piece)
    const piecesToShuffle = initialPieces.slice(1)
    for (let i = piecesToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[piecesToShuffle[i].currentPosition, piecesToShuffle[j].currentPosition] = 
      [piecesToShuffle[j].currentPosition, piecesToShuffle[i].currentPosition]
    }

    setPieces([initialPieces[0], ...piecesToShuffle])
  }, [imageUrl])

  const canMove = (position: number): boolean => {
    const emptyPiece = pieces.find(p => p.isEmpty)
    if (!emptyPiece) return false

    const emptyPos = emptyPiece.currentPosition
    const row = Math.floor(position / GRID_SIZE)
    const col = position % GRID_SIZE
    const emptyRow = Math.floor(emptyPos / GRID_SIZE)
    const emptyCol = emptyPos % GRID_SIZE

    return (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    )
  }

  const movePiece = (piece: PuzzlePiece) => {
    if (!canMove(piece.currentPosition)) return

    const emptyPiece = pieces.find(p => p.isEmpty)!
    const newPieces = pieces.map(p => {
      if (p.id === piece.id) {
        return { ...p, currentPosition: emptyPiece.currentPosition }
      }
      if (p.isEmpty) {
        return { ...p, currentPosition: piece.currentPosition }
      }
      return p
    })

    setPieces(newPieces)
  }

  // Sort pieces by current position to maintain grid order
  const sortedPieces = [...pieces].sort((a, b) => a.currentPosition - b.currentPosition)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-2xl">
        <div className="grid grid-cols-4 gap-0.5 bg-gray-800 p-0.5 rounded-lg">
          {sortedPieces.map((piece) => {
            const isMovable = canMove(piece.currentPosition)
            return (
              <div
                key={piece.id}
                onClick={() => !piece.isEmpty && movePiece(piece)}
                className={`aspect-square relative ${
                  !piece.isEmpty && isMovable
                    ? "cursor-pointer ring-2 ring-blue-400 ring-opacity-50 hover:ring-opacity-100 hover:brightness-90"
                    : ""
                }`}
              >
                {!piece.isEmpty && (
                  <div className="relative w-full h-full overflow-hidden">
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${GRID_SIZE * 100}%`,
                        backgroundPosition: `${(piece.originalPosition % GRID_SIZE) * -100}% ${
                          Math.floor(piece.originalPosition / GRID_SIZE) * -100
                        }%`,
                      }}
                    />
                  </div>
                )}
                {!piece.isEmpty && isMovable && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onForfeit}
        className="text-red-500 hover:text-red-600 hover:bg-red-100"
      >
        <Skull className="w-4 h-4 mr-2" />
        Nyerah
      </Button>
    </div>
  )
} 