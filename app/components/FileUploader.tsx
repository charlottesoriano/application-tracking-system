import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ACCEPTED_FILE_TYPE, cn, formatSize, MAX_FILE_SIZE } from "~/lib/utils";

interface FileUploaderProps {
    onFileSelect?: (file: File | null, error?: string) => void;
}

const getRejectionError = (fileRejections: FileRejection[]) => {
    const code = fileRejections[0]?.errors[0]?.code

    switch (code) {
        case 'file-too-large':
            return `File is too large. Max size is ${formatSize(MAX_FILE_SIZE)}`
        case 'file-invalid-type':
            return 'Only PDF files are allowed'
        case 'too-many-files':
            return 'Only one file can be uploaded'
        default:
            return fileRejections[0]?.errors[0]?.message || 'File could not be uploaded'
    }
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const [file, setFile] = useState<File | null>(null)

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            setFile(null)
            onFileSelect?.(null, getRejectionError(fileRejections))
            return
        }

        const file = acceptedFiles[0] || null
        setFile(file)
        onFileSelect?.(file)
    }, [onFileSelect])

    const { getRootProps, getInputProps, isDragActive } = useDropzone(
        {
            onDrop,
            multiple: false,
            accept: { [ACCEPTED_FILE_TYPE]: ['.pdf'] },
            maxSize: MAX_FILE_SIZE
        }
    )

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        onFileSelect?.(null)
    }

    return (
        <div
            {...getRootProps()}
            className={cn('uplader-drag-area', isDragActive && 'bg-accent-tint-100')}
        >
            <input {...getInputProps()} />
            <div className="space-y-4 cursor-pointer">
                {file ? (
                    <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                        <img src="/images/pdf.png" alt="pdf" className="size-10" />
                        <div className="flex items-center space-x-3">
                            <div>
                                <p className="text-lg text-foreground font-medium truncate max-w-xs">
                                    {file.name}
                                </p>
                                <p className="text-sm text-foreground-secondary">
                                    {formatSize(file.size)}
                                </p>
                            </div>
                        </div>
                        <button className="p-2 cursor-pointer" onClick={handleRemove}>
                            <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mx-auto w-12 h-12 flex items-center justify-center text-accent-600">
                            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M7 18a4.5 4.5 0 01-1-8.89 5.5 5.5 0 0110.78-1.79A4.5 4.5 0 0117 18M9 15l3-3 3 3m-3-3v9"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <p className="text-foreground">
                            <span className="font-semibold">Drag and drop your resume</span>, or{' '}
                            <span className="font-semibold text-accent-600">browse files</span>
                        </p>
                        <p className="text-sm text-foreground-muted">
                            PDF, up to {formatSize(MAX_FILE_SIZE)}
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

export default FileUploader
