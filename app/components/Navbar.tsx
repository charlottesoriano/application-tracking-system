import React from 'react'
import { Link, NavLink } from 'react-router'
import { usePuterStore } from '~/lib/puter'
import { cn } from '~/lib/utils'
import UploadButton from './UploadButton'

interface NavbarProps {
    backTo?: { to: string; label: string }
}

const Navbar = ({ backTo }: NavbarProps) => {
    const { auth } = usePuterStore()

    return (
        <nav className='navbar'>
            <Link to='/' className='flex items-center gap-3'>
                <img src='/images/logo-main.png' alt='' className='w-9 h-9 rounded-lg' />
                <span className='text-xl font-display font-bold text-foreground'>Reality Check</span>
            </Link>
            <div className='flex flex-row items-center gap-3'>
                {auth.isAuthenticated && (
                    <NavLink
                        to='/main-resume'
                        className={({ isActive }) =>
                            cn(
                                'text-sm font-semibold rounded-full px-4 py-2.5 transition-colors',
                                isActive ? 'bg-accent-100 text-accent-700' : 'text-foreground hover:bg-surface-alt'
                            )
                        }
                    >
                        Main Resume
                    </NavLink>
                )}
                {backTo ? (
                    <Link
                        to={backTo.to}
                        className='inline-flex items-center gap-2 text-sm font-semibold text-foreground border border-border rounded-full px-4 py-2.5 hover:bg-surface-alt transition-colors'
                    >
                        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                d='M19 12H5m0 0l6 6m-6-6l6-6'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                        {backTo.label}
                    </Link>
                ) : (
                    <UploadButton />
                )}
                {auth.isAuthenticated && (
                    <button
                        onClick={auth.signOut}
                        className='text-sm font-semibold text-foreground border border-border rounded-full px-4 py-2.5 hover:bg-surface-alt transition-colors cursor-pointer'
                    >
                        Log Out
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Navbar
