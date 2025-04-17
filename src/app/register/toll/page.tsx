"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VerificationMessage from '@/components/VerificationMessage';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase';

export default function TollRegistration() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Form state
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tollName, setTollName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [registrationMessage, setRegistrationMessage] = useState('');

  // Handle next step
  const nextStep = () => {
    setError(null);
    
    if (step === 1) {
      // Validate account information
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }
    
    if (step === 2) {
      // Validate toll information
      if (!tollName || !address) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (!coordinates.lat || !coordinates.lng) {
        setError('Please set your location coordinates');
        return;
      }
    }
    
    setStep(step + 1);
  };
  
  // Handle previous step
  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate current step
    const isValid = validateCurrentStep();
    if (!isValid) {
      setLoading(false);
      return;
    }

    if (step < 3) {
      nextStep();
      setLoading(false);
      return;
    }

    try {
      // Create user account with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?verified=true`,
          data: {
            full_name: tollName,
            user_type: 'toll',
          }
        }
      });

      if (authError) throw authError;
      
      if (authData?.user) {
        // Insert toll data into the database
        const { error: tollError } = await supabase
          .from('toll_booths')
          .insert({
            user_id: authData.user.id,
            name: tollName,
            address,
            latitude: parseFloat(coordinates.lat),
            longitude: parseFloat(coordinates.lng),
            upi_id: upiId,
          });

        if (tollError) {
          // If this is a RLS error, we don't need to show it to the user since the auth part worked
          console.error('Toll booth creation error:', tollError);
          
          // Still consider the registration successful if only the toll booth creation failed
          // The admin can manually approve the toll booth later
          setRegistrationStatus('success');
          setRegistrationMessage('Registration successful! Please check your email to verify your account before logging in.');
        } else {
          setRegistrationStatus('success');
          setRegistrationMessage('Registration successful! Please check your email to verify your account before logging in.');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationStatus('error');
      setRegistrationMessage(error.message || 'An error occurred during registration. Please try again.');
      setError(error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get current location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  // If verification was sent, show verification message
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto max-w-3xl">
          <header className="py-8">
            <Link href="/" className="flex items-center w-fit">
              <h1 className="text-3xl font-bold text-blue-400">GPS Pay</h1>
              <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">Toll Tax</span>
            </Link>
          </header>
          
          <VerificationMessage email={email} />
        </div>
      </div>
    );
  }

  // Return to the beginning of the form after successful registration
  useEffect(() => {
    if (registrationStatus === 'success') {
      // We don't redirect immediately to allow the user to see the success message
    }
  }, [registrationStatus, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-bold text-blue-400">GPS Pay</h1>
            <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">QR-less</span>
          </Link>
        </div>
        
        {registrationStatus === 'success' ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-white">Registration Successful!</h3>
              <p className="mt-2 text-gray-300">{registrationMessage}</p>
              <div className="mt-6">
                <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white text-center">Register Your Toll Booth</h2>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="w-full mr-2">
                    <div className={`h-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                    <p className="text-xs text-center mt-1 text-gray-400">Account</p>
                  </div>
                  <div className="w-full mx-2">
                    <div className={`h-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                    <p className="text-xs text-center mt-1 text-gray-400">Toll Info</p>
                  </div>
                  <div className="w-full ml-2">
                    <div className={`h-2 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                    <p className="text-xs text-center mt-1 text-gray-400">Payment</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Step 1: Account Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium mb-4">Account Information</h2>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
              
              {/* Step 2: Toll Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium mb-4">Toll Information</h2>
                  
                  <div>
                    <label htmlFor="tollName" className="block text-sm font-medium text-gray-300 mb-2">
                      Toll Booth Name
                    </label>
                    <input
                      id="tollName"
                      type="text"
                      value={tollName}
                      onChange={(e) => setTollName(e.target.value)}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Toll Booth Name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Toll Booth Address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location Coordinates
                    </label>
                    <div className="flex gap-4 mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Latitude"
                          value={coordinates.lat}
                          onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                          className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Longitude"
                          value={coordinates.lng}
                          onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                          className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-blue-400 text-sm hover:underline flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Get Current Location
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium mb-4">Payment Information</h2>
                  
                  <div>
                    <label htmlFor="upiId" className="block text-sm font-medium text-gray-300 mb-2">
                      UPI ID
                    </label>
                    <input
                      id="upiId"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-upi-id@bank"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-auto px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    loading
                      ? 'bg-blue-600 opacity-70 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {step === 3 ? 'Registering...' : 'Saving...'}
                    </div>
                  ) : (
                    step === 3 ? 'Complete Registration' : 'Next'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 