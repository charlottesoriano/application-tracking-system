export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)

    return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`
}
