import Link from 'next/link'

export default function SignupConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9eeec] to-[#e7bab2] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
        <p className="mb-6">
          We've sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.
        </p>
        <p className="mb-6">
          If you don't see the email, please check your spam folder.
        </p>
        <Link 
          href="/auth?tab=login"
          className="inline-block bg-[#e7bab2] text-white font-bold py-2 px-4 rounded hover:bg-[#d6a299] transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}

