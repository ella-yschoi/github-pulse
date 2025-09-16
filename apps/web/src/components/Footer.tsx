import Link from 'next/link';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className='border-t border-gray-200 bg-white text-gray-900'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0'>
          {/* Copyright */}
          <div className='text-sm text-gray-600'>© 2025 GitHub Pulse</div>

          {/* Links */}
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <FaLinkedin className='h-5 w-5 text-gray-600' />
              <Link
                href='https://linkedin.com/in/ella-yschoi'
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
              >
                ella-yschoi
              </Link>
            </div>
            <div className='flex items-center space-x-2'>
              <FaGithub className='h-5 w-5 text-gray-600' />
              <Link
                href='https://github.com/ella-yschoi/github-pulse'
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
              >
                github-pulse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
