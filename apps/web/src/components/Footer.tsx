import Link from 'next/link';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className='border-t border-gray-200 bg-white text-gray-900'>
      <div className='mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6'>
        <div className='flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0'>
          {/* Copyright */}
          <div className='text-xs sm:text-sm text-gray-600'>
            © 2025 GitHub Pulse
          </div>

          {/* Links */}
          <div className='flex items-center space-x-3 sm:space-x-4'>
            <Link
              href='https://linkedin.com/in/ella-yschoi'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:opacity-80 transition-opacity'
            >
              <FaLinkedin className='h-4 w-4 sm:h-5 sm:w-5 text-gray-600' />
              <span className='text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors'>
                <span className='hidden sm:inline'>ella-yschoi</span>
                <span className='sm:hidden'>ella-yschoi</span>
              </span>
            </Link>
            <Link
              href='https://github.com/ella-yschoi/github-pulse'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:opacity-80 transition-opacity'
            >
              <FaGithub className='h-4 w-4 sm:h-5 sm:w-5 text-gray-600' />
              <span className='text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors'>
                <span className='hidden sm:inline'>github-pulse</span>
                <span className='sm:hidden'>ella-yschoi</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
