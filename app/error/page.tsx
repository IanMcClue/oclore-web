export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9eeec] to-[#e7bab2] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Oops! Something went wrong</h1>
        <p className="text-center mb-4">
          We're sorry, but an error occurred while processing your request.
        </p>
        <p className="text-center text-sm text-gray-600">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    </div>
  )
}

