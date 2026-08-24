export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
export const ACCEPTED_FILE_TYPE = 'application/pdf'

export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)

    return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`
}

export const generateUUID = () => crypto.randomUUID()

// Strips ```json / ``` fences some models wrap JSON responses in, so the
// remainder can be passed straight to JSON.parse.
export function stripCodeFences(text: string): string {
    return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
}