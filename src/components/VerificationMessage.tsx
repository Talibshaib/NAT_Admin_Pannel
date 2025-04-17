import React from 'react';
import Link from 'next/link';

interface VerificationMessageProps {
  email: string;
}

export default function VerificationMessage({ email }: VerificationMessageProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8 text-center">
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
      
      <p className="text-gray-300 mb-6">
        We've sent a verification link to <span className="text-blue-400 font-medium">{email}</span>.
        Please check your inbox and click the link to verify your account.
      </p>
      
      <div className="bg-gray-700 p-4 rounded-lg mb-6 text-left">
        <h3 className="text-sm uppercase text-gray-400 mb-2">Note:</h3>
        <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
          <li>The verification link will expire in 24 hours</li>
          <li>Check your spam folder if you don't see the email</li>
          <li>You'll be redirected to the login page after verification</li>
        </ul>
      </div>
      
      <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
        Back to Login
      </Link>
    </div>
  );
} 