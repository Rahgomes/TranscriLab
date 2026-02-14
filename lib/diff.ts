export type DiffToken = {
  type: 'equal' | 'add' | 'remove'
  text: string
}

/**
 * Computes a word-by-word diff between two strings.
 * Uses a simple LCS (Longest Common Subsequence) approach on word arrays.
 */
export function diffWords(oldText: string, newText: string): DiffToken[] {
  const oldWords = tokenize(oldText)
  const newWords = tokenize(newText)

  if (oldWords.length === 0 && newWords.length === 0) return []
  if (oldWords.length === 0) return [{ type: 'add', text: newText }]
  if (newWords.length === 0) return [{ type: 'remove', text: oldText }]

  // Build LCS table
  const m = oldWords.length
  const n = newWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to build diff
  const tokens: DiffToken[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      tokens.unshift({ type: 'equal', text: oldWords[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokens.unshift({ type: 'add', text: newWords[j - 1] })
      j--
    } else {
      tokens.unshift({ type: 'remove', text: oldWords[i - 1] })
      i--
    }
  }

  // Merge consecutive tokens of the same type
  return mergeTokens(tokens)
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean)
}

function mergeTokens(tokens: DiffToken[]): DiffToken[] {
  if (tokens.length === 0) return []

  const merged: DiffToken[] = [tokens[0]]

  for (let i = 1; i < tokens.length; i++) {
    const last = merged[merged.length - 1]
    if (last.type === tokens[i].type) {
      last.text += tokens[i].text
    } else {
      merged.push({ ...tokens[i] })
    }
  }

  return merged
}

/**
 * Checks if two texts are meaningfully different (ignoring whitespace changes).
 */
export function hasTextChanged(oldText: string, newText: string): boolean {
  return oldText.trim() !== newText.trim()
}
