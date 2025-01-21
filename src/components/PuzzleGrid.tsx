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

export function PuzzleGrid({ imageUrl, onForfeit, gridSize }: PuzzleGridProps) {
  const GRID_SIZE = gridSize
  const TOTAL_PIECES = GRID_SIZE * GRID_SIZE
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [isSolving, setIsSolving] = useState(false)
  const [solverMessage, setSolverMessage] = useState<string>("")

  // Initialize puzzle pieces with solvable configuration
  useEffect(() => {
    const createSolvablePuzzle = () => {
      const initialPieces: PuzzlePiece[] = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
        id: index,
        currentPosition: index,
        originalPosition: index,
        isEmpty: index === 0
      }));
  
      // Generate solvable permutation
      let positions: number[];
      do {
        // Create shuffled positions (excluding empty space at 0)
        positions = Array.from({ length: TOTAL_PIECES - 1 }, (_, i) => i + 1)
          .sort(() => Math.random() - 0.5);
        
        // Add empty space at position 0
        positions.unshift(0);
  
        // Calculate inversion count (for 3x3 puzzles)
        let inversions = 0;
        const flat = positions.slice(1); // Exclude empty tile
        for (let i = 0; i < flat.length; i++) {
          for (let j = i + 1; j < flat.length; j++) {
            if (flat[i] > flat[j]) inversions++;
          }
        }
        
        // For 3x3: solvable if even number of inversions
        if (GRID_SIZE === 3 && inversions % 2 === 0) break;
        
        // For 4x4: solvable if (inversions + row of blank) is even
        if (GRID_SIZE === 4) {
          const blankRow = Math.floor(0 / GRID_SIZE) + 1; // Since empty is at 0 (row 0)
          if ((inversions + blankRow) % 2 === 0) break;
        }
      } while (true);
  
      // Assign shuffled positions to pieces
      return initialPieces.map((piece, index) => ({
        ...piece,
        currentPosition: positions[index],
        isEmpty: positions[index] === 0
      }));
    };
  
    setPieces(createSolvablePuzzle());
  }, [imageUrl, TOTAL_PIECES, GRID_SIZE]);

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
      if (p.id === piece.id) return { ...p, currentPosition: emptyPiece.currentPosition }
      if (p.isEmpty) return { ...p, currentPosition: piece.currentPosition }
      return p
    })

    setPieces(newPieces)
  }

  const sortedPieces = [...pieces].sort((a, b) => a.currentPosition - b.currentPosition)

  const findSolution = useCallback(() => {
    const MAX_DEPTH = 50
    let iterations = 0

    const getCurrentState = () => {
      const state: number[] = new Array(TOTAL_PIECES).fill(0)
      pieces.forEach(piece => {
        state[piece.originalPosition] = piece.currentPosition
      })
      return state
    }

    const targetState = Array.from({ length: TOTAL_PIECES }, (_, i) => i)
    const targetString = targetState.join(',')

    const getManhattanDistance = (pos1: number, pos2: number) => {
      const row1 = Math.floor(pos1 / GRID_SIZE)
      const col1 = pos1 % GRID_SIZE
      const row2 = Math.floor(pos2 / GRID_SIZE)
      const col2 = pos2 % GRID_SIZE
      return Math.abs(row1 - row2) + Math.abs(col1 - col2)
    }

    const heuristic = (state: number[]) => {
      return state.reduce((sum, pos, index) => sum + getManhattanDistance(pos, index), 0)
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

    const depthLimitedSearch = (
      state: number[],
      path: number[],
      g: number,
      threshold: number,
      visited: Set<string>
    ): number[] | number => {
      iterations++
      if (iterations > 100000) return []

      const h = heuristic(state)
      const f = g + h
      if (f > threshold) return f
      if (state.join(',') === targetString) return path

      let min = Infinity
      const emptyPos = state[0]
      const neighbors = getNeighbors(emptyPos)

      const neighborStates = neighbors.map(neighborPos => {
        const newState = [...state]
        const pieceIndex = newState.findIndex(pos => pos === neighborPos)
        newState[0] = neighborPos
        newState[pieceIndex] = emptyPos
        return {
          state: newState,
          pos: neighborPos,
          h: heuristic(newState)
        }
      }).sort((a, b) => a.h - b.h)

      for (const { state: newState, pos } of neighborStates) {
        const stateKey = newState.join(',')
        if (visited.has(stateKey)) continue

        const newVisited = new Set(visited)
        newVisited.add(stateKey)

        const result = depthLimitedSearch(newState, [...path, pos], g + 1, threshold, newVisited)
        if (Array.isArray(result)) return result
        if (result < min) min = result
      }

      return min
    }

    const idaStar = () => {
      const initialState = getCurrentState()
      let threshold = heuristic(initialState)

      while (threshold <= MAX_DEPTH) {
        const result = depthLimitedSearch(initialState, [], 0, threshold, new Set([initialState.join(',')]))
        if (Array.isArray(result)) return result
        threshold = result
      }
      return []
    }

    return idaStar()
  }, [pieces, GRID_SIZE, TOTAL_PIECES])

  const solvePuzzle = async () => {
    try {
      setIsSolving(true)
      setSolverMessage("Mencari jalan...")

      const moves = await new Promise<number[]>(resolve => {
        setTimeout(() => resolve(findSolution()), 100)
      })

      if (!moves.length) {
        setSolverMessage("Tidak bisa menemukan jalan!")
        setTimeout(() => setSolverMessage(""), 2000)
        return
      }

      setSolverMessage("Menjalankan...")
      
      let currentPieces = [...pieces]
      for (const targetPos of moves) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const emptyPiece = currentPieces.find(p => p.isEmpty)!
        const pieceToMove = currentPieces.find(p => p.currentPosition === targetPos)!

        currentPieces = currentPieces.map(p => {
          if (p.id === pieceToMove.id) return { ...p, currentPosition: emptyPiece.currentPosition }
          if (p.isEmpty) return { ...p, currentPosition: targetPos }
          return p
        })

        setPieces([...currentPieces])
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
            const displayNumber = piece.originalPosition
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
                    {displayNumber > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white font-bold text-lg shadow-lg backdrop-blur-sm">
                          {displayNumber}
                        </span>
                      </div>
                    )}
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