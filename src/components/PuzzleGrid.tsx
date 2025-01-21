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

interface PathNode {
  state: PuzzleState[]
  path: number[]
  f: number
}

export function PuzzleGrid({ imageUrl, onForfeit, gridSize }: PuzzleGridProps) {
  const GRID_SIZE = gridSize
  const TOTAL_PIECES = GRID_SIZE * GRID_SIZE
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [isSolving, setIsSolving] = useState(false)
  const [solverMessage, setSolverMessage] = useState<string>("")

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
  }, [imageUrl, TOTAL_PIECES])

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
    const MAX_ITERATIONS = 10000
    let iterations = 0

    const getCurrentState = () => {
      // Return array of current positions indexed by original position
      const state: number[] = new Array(TOTAL_PIECES).fill(0)
      pieces.forEach(piece => {
        state[piece.originalPosition] = piece.currentPosition
      })
      return state
    }

    const getTargetState = () => {
      // Target state is where each piece is in its original position
      return Array.from({ length: TOTAL_PIECES }, (_, i) => i)
    }

    const getManhattanDistance = (pos1: number, pos2: number) => {
      const row1 = Math.floor(pos1 / GRID_SIZE)
      const col1 = pos1 % GRID_SIZE
      const row2 = Math.floor(pos2 / GRID_SIZE)
      const col2 = pos2 % GRID_SIZE
      return Math.abs(row1 - row2) + Math.abs(col1 - col2)
    }

    const getEmptyPosition = (state: number[]) => {
      return state[0] // Position of the empty piece (originalPosition 0)
    }

    const getNeighbors = (emptyPos: number) => {
      const row = Math.floor(emptyPos / GRID_SIZE)
      const col = emptyPos % GRID_SIZE
      const neighbors: number[] = []

      if (row > 0) neighbors.push(emptyPos - GRID_SIZE)
      if (row < GRID_SIZE - 1) neighbors.push(emptyPos + GRID_SIZE)
      if (col > 0) neighbors.push(emptyPos - 1)
      if (col < GRID_SIZE - 1) neighbors.push(emptyPos + 1)

      return neighbors
    }

    const findPath = () => {
      const initial = getCurrentState()
      const target = getTargetState()
      const openSet = [{ state: initial, path: [], f: 0 }]
      const seen = new Set()

      while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++
        openSet.sort((a, b) => a.f - b.f)
        const current = openSet.shift()!

        if (JSON.stringify(current.state) === JSON.stringify(target)) {
          return current.path
        }

        const stateKey = JSON.stringify(current.state)
        if (seen.has(stateKey)) continue
        seen.add(stateKey)

        const emptyPos = getEmptyPosition(current.state)
        const neighbors = getNeighbors(emptyPos)

        for (const neighborPos of neighbors) {
          if (iterations >= MAX_ITERATIONS) break

          const newState = [...current.state]
          // Find which piece is at the neighbor position
          const pieceIndex = newState.indexOf(neighborPos)
          // Swap empty space with neighbor
          newState[0] = neighborPos
          newState[pieceIndex] = emptyPos

          const h = newState.reduce((sum, pos, index) => {
            return sum + getManhattanDistance(pos, index)
          }, 0)

          openSet.push({
            state: newState,
            path: [...current.path, neighborPos],
            f: current.path.length + h
          })
        }

        // Limit openSet size
        if (openSet.length > 1000) {
          openSet.length = 1000
        }
      }

      return []
    }

    return findPath()
  }, [pieces, GRID_SIZE, TOTAL_PIECES])

  const solvePuzzle = async () => {
    try {
      setIsSolving(true)
      setSolverMessage("Mencari jalan...")

      // Use setTimeout to allow UI to update
      const moves = await new Promise<number[]>(resolve => {
        setTimeout(() => {
          const solution = findSolution()
          resolve(solution)
        }, 100)
      })

      if (moves.length === 0) {
        setSolverMessage("Tidak bisa menemukan jalan!")
        setTimeout(() => setSolverMessage(""), 2000)
        return
      }

      setSolverMessage("Menjalankan...")
      
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

      setSolverMessage("Selesai!")
      setTimeout(() => setSolverMessage(""), 1000)
    } catch (error) {
      console.error('Solver error:', error)
      setSolverMessage("Ada masalah!")
      setTimeout(() => setSolverMessage(""), 2000)
    } finally {
      setIsSolving(false)
    }
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
      
      <div className="flex flex-col items-center gap-2">
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

          {gridSize === 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={solvePuzzle}
              disabled={isSolving}
              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isSolving ? "Tunggu..." : "Rampungke"}
            </Button>
          )}
        </div>
        
        {solverMessage && (
          <p className="text-sm text-gray-500 animate-pulse">
            {solverMessage}
          </p>
        )}
      </div>
    </div>
  )
} 