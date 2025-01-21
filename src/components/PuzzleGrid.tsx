"use client"

import { useEffect, useState, useCallback } from "react"
import { Skull, CheckCircle2 } from "lucide-react"
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
  gridSize: 3 | 4
}

interface PuzzleState {
  position: number
  isEmpty: boolean
}

export function PuzzleGrid({ imageUrl, onForfeit, gridSize }: PuzzleGridProps) {
  const GRID_SIZE = gridSize
  const TOTAL_PIECES = GRID_SIZE * GRID_SIZE
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [isSolving, setIsSolving] = useState(false)
  const [solution, setSolution] = useState<number[]>([])

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

  const findSolution = useCallback(() => {
    const getCurrentState = () => {
      return pieces.map(p => ({
        position: p.currentPosition,
        isEmpty: p.isEmpty
      }))
    }

    const getTargetState = () => {
      return Array.from({ length: TOTAL_PIECES }, (_, i) => ({
        position: i,
        isEmpty: i === 0
      }))
    }

    const getManhattanDistance = (pos1: number, pos2: number) => {
      const row1 = Math.floor(pos1 / GRID_SIZE)
      const col1 = pos1 % GRID_SIZE
      const row2 = Math.floor(pos2 / GRID_SIZE)
      const col2 = pos2 % GRID_SIZE
      return Math.abs(row1 - row2) + Math.abs(col1 - col2)
    }

    const getNeighbors = (state: PuzzleState[]) => {
      const emptyPos = state.findIndex(p => p.isEmpty)
      const row = Math.floor(emptyPos / GRID_SIZE)
      const col = emptyPos % GRID_SIZE
      const neighbors: number[] = []

      if (row > 0) neighbors.push(emptyPos - GRID_SIZE)
      if (row < GRID_SIZE - 1) neighbors.push(emptyPos + GRID_SIZE)
      if (col > 0) neighbors.push(emptyPos - 1)
      if (col < GRID_SIZE - 1) neighbors.push(emptyPos + 1)

      return neighbors
    }

    // A* pathfinding algorithm
    const findPath = () => {
      const start = getCurrentState()
      const target = getTargetState()
      const openSet = [{ state: start, path: [], f: 0 }]
      const closedSet = new Set()

      while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f)
        const current = openSet.shift()!

        if (JSON.stringify(current.state) === JSON.stringify(target)) {
          return current.path
        }

        const stateKey = JSON.stringify(current.state)
        if (closedSet.has(stateKey)) continue
        closedSet.add(stateKey)

        const emptyPos = current.state.findIndex(p => p.isEmpty)
        const neighbors = getNeighbors(current.state)

        for (const neighborPos of neighbors) {
          const newState = [...current.state]
          const temp = newState[emptyPos]
          newState[emptyPos] = newState[neighborPos]
          newState[neighborPos] = temp

          const h = newState.reduce((sum, piece, index) => {
            if (!piece.isEmpty) {
              return sum + getManhattanDistance(piece.position, index)
            }
            return sum
          }, 0)

          openSet.push({
            state: newState,
            path: [...current.path, neighborPos],
            f: current.path.length + h
          })
        }
      }

      return []
    }

    return findPath()
  }, [pieces, GRID_SIZE, TOTAL_PIECES])

  const solvePuzzle = async () => {
    setIsSolving(true)
    const moves = findSolution()
    setSolution(moves)

    // Animate moves
    for (const targetPos of moves) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const pieceToMove = pieces.find(p => p.currentPosition === targetPos)!
      const emptyPiece = pieces.find(p => p.isEmpty)!
      
      setPieces(prev => prev.map(p => {
        if (p.id === pieceToMove.id) {
          return { ...p, currentPosition: emptyPiece.currentPosition }
        }
        if (p.isEmpty) {
          return { ...p, currentPosition: pieceToMove.currentPosition }
        }
        return p
      }))
    }

    setIsSolving(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-2xl">
        <div className={`grid grid-cols-${gridSize} gap-0.5 bg-gray-800 p-0.5 rounded-lg`}>
          {sortedPieces.map((piece) => {
            const isMovable = canMove(piece.currentPosition)
            const displayNumber = piece.originalPosition // The target position
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
                  <>
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
                    {/* Number overlay */}
                    {displayNumber > 0 && ( // Don't show number for the empty piece (0)
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white font-bold text-lg shadow-lg backdrop-blur-sm">
                          {displayNumber}
                        </span>
                      </div>
                    )}
                    {/* Movable indicator */}
                    {isMovable && (
                      <div className="absolute inset-0 ring-4 ring-blue-400/30 ring-inset" />
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onForfeit}
          className="text-red-500 hover:text-red-600 hover:bg-red-100"
        >
          <Skull className="w-4 h-4 mr-2" />
          Nyerah
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={solvePuzzle}
          disabled={isSolving}
          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Rampungke
        </Button>
      </div>
    </div>
  )
} 