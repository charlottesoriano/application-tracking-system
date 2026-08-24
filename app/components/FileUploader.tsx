import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ACCEPTED_FILE_TYPE, formatSize, MAX_FILE_SIZE } from "~/lib/utils";

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
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="space-y-4 cursor-pointer">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center">
                        <img src="/icons/info.svg" alt="upload" className="size-20" />
                    </div>

                    {
                        file ? (
                            <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                                <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                <div className="flex items-center space-x-3">
                                    <div>
                                        <p className="text-lg text-gray-700 font-medium truncate max-w-xs">
                                            {file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 cursor-pointer" onClick={handleRemove}>
                                    <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                                </button>
                            </div>
                        )
                            : (
                                <div>
                                    <p className="text-lg text-gray-500">
                                        <span className="font-semibold">Click to Upload</span> or drag and drop
                                    </p>
                                    <p className="text-lg text-gray-500">
                                        PDF (max 20 MB)
                                    </p>
                                </div>
                            )
                    }
                </div>
            </div>
        </div>
    )
}

export default FileUploader