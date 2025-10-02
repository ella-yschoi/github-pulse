import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubOAuthURL } from '@/lib/oauth';
import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  // Generate GitHub OAuth URL directly
  const githubOAuthURL = await getGitHubOAuthURL();

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      <div className='flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8'>
        <div className='mx-auto w-full max-w-md'>
          <div className='text-center flex flex-col items-center'>
            <div className='flex items-center gap-2 mb-3 sm:mb-2'>
              <Image
                src='/images/gihub-pulse-logo-no-bg.png'
                alt='GitHub Pulse Logo'
                width={52}
                height={52}
                className='h-10 w-10 sm:h-13 sm:w-13 object-contain'
              />
              <h1 className='text-2xl sm:text-4xl font-bold text-emerald-500'>
                GitHub Pulse
              </h1>
            </div>
            <p className='text-base sm:text-lg text-gray-600 mb-6 sm:mb-8'>
              <span className='hidden sm:inline'>
                Personal Repository Analytics Dashboard
              </span>
              <span className='sm:hidden'>Repository Analytics Dashboard</span>
            </p>
          </div>

          <div className='bg-white py-6 sm:py-8 px-4 shadow rounded-lg sm:px-10'>
            <div className='text-center'>
              <p className='text-sm sm:text-base text-gray-600 mb-4 sm:mb-6'>
                <span className='hidden sm:inline'>
                  Sign in with GitHub to analyze your repositories
                </span>
                <span className='sm:hidden'>
                  Sign in with GitHub to analyze your repos
                </span>
              </p>

              <a
                href={githubOAuthURL}
                className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
              >
                <svg
                  className='w-4 h-4 sm:w-5 sm:h-5 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
                    clipRule='evenodd'
                  />
                </svg>
                Sign in with GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
