import { Link } from 'react-router'
import { cn } from '~/lib/utils'

const UploadButton = ({ className }: { className?: string }) => (
    <Link
        to='/upload'
        className={cn(
            'inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold rounded-full pl-4 pr-5 py-2.5 transition-colors',
            className
        )}
    >
        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
                d='M12 16V4m0 0L7 9m5-5l5 5M5 20h14'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
        Upload Resume
    </Link>
)

export default UploadButton
