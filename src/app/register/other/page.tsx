"use client";

import { useState, FormEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OtherServiceRegistration() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Form state
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Validate service information
      if (!serviceName || !serviceType || !address) {
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
    setError(null);
    
    // Final validation
    if (!upiId) {
      setError('Please add your UPI ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'service',
          },
        },
      });
      
      if (authError) throw authError;
      
      // 2. Create service record
      const { error: profileError } = await supabase
        .from('other_services')
        .insert([
          {
            user_id: authData.user?.id,
            name: serviceName,
            service_type: serviceType,
            address,
            location: `POINT(${coordinates.lng} ${coordinates.lat})`,
            upi_id: upiId,
          },
        ]);
      
      if (profileError) throw profileError;
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto max-w-3xl">
        <header className="py-8">
          <Link href="/register" className="flex items-center w-fit">
            <h1 className="text-3xl font-bold text-blue-400">GPS Pay</h1>
            <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded">Other Services</span>
          </Link>
        </header>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-2xl font-bold mb-6">Register Your Service</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-green-600' : 'bg-gray-700'
              }`}>
                1
              </div>
              <div className={`h-1 w-20 ${step >= 2 ? 'bg-green-600' : 'bg-gray-700'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-green-600' : 'bg-gray-700'
              }`}>
                2
              </div>
              <div className={`h-1 w-20 ${step >= 3 ? 'bg-green-600' : 'bg-gray-700'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-green-600' : 'bg-gray-700'
            }`}>
              3
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
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            
            {/* Step 2: Service Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium mb-4">Service Information</h2>
                
                <div>
                  <label htmlFor="serviceName" className="block text-sm font-medium text-gray-300 mb-2">
                    Service Name
                  </label>
                  <input
                    id="serviceName"
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your Service Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="serviceType" className="block text-sm font-medium text-gray-300 mb-2">
                    Service Type
                  </label>
                  <select
                    id="serviceType"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Service Type</option>
                    <option value="Utility">Utility</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Educational">Educational</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
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
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Service Address"
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
                        className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Longitude"
                        value={coordinates.lng}
                        onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                        className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-green-400 text-sm hover:underline flex items-center"
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
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your-upi-id@bank"
                  />
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition ml-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-md font-medium text-white transition ml-auto ${
                    loading
                      ? 'bg-green-600 opacity-70 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 