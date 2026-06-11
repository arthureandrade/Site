import { execFileSync } from 'node:child_process'

const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA

// Always build when Vercel cannot identify the previous production commit.
if (!previousSha) process.exit(1)

try {
  const files = execFileSync('git', ['diff', '--name-only', previousSha, 'HEAD'], {
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)

  const onlyFallbackChanged =
    files.length > 0 && files.every((file) => file.startsWith('fallback-data/'))

  if (onlyFallbackChanged) {
    console.log('Ignoring build: only fallback-data changed.')
    process.exit(0)
  }
} catch (error) {
  console.error('Could not inspect changed files; continuing with build.', error)
}

process.exit(1)
