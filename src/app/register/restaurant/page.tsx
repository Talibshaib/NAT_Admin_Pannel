'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/SupabaseProvider';
import VerificationMessage from '@/components/VerificationMessage';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
}

export default function RestaurantRegistration() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();
  const { session, isLoading } = useSupabase();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: '',
      price: '',
      description: '',
    };
    setMenuItems([...menuItems, newItem]);
  };

  const updateMenuItem = (id: string, field: keyof MenuItem, value: string) => {
    setMenuItems(
      menuItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeMenuItem = (id: string) => {
    setMenuItems(menuItems.filter((item) => item.id !== id));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Please enter coordinates manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!restaurantName || !address || !coordinates.lat || !coordinates.lng) {
      setError('Please fill in all fields');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!upiId) {
      setError('Please enter your UPI ID');
      return false;
    }
    
    if (menuItems.length === 0) {
      setError('Please add at least one menu item');
      return false;
    }
    
    for (const item of menuItems) {
      if (!item.name || !item.price) {
        setError('Please fill in all required menu item fields');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    setError(null);
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Register user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'restaurant',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // 2. Store minimal profile data in Supabase
        try {
          const { error: profileError } = await supabase
            .from('profile')
            .upsert({
              id: authData.user.id,
              email: email,
              user_type: 'restaurant'
            });
          
          if (profileError) {
            console.error("Profile error:", profileError);
          }
        } catch (profileError) {
          // Continue even if profile creation fails, as the trigger should handle it
          console.error("Profile creation error:", profileError);
        }
        
        // 3. Store detailed restaurant data in localStorage
        const restaurantData = {
          id: authData.user.id,
          name: restaurantName,
          address: address,
          coordinates: coordinates,
          upiId: upiId,
          menuItems: menuItems,
          createdAt: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('restaurant_data', JSON.stringify(restaurantData));
        
        // Show verification message instead of redirect
        setVerificationSent(true);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="container mx-auto max-w-3xl">
          <header className="py-8">
            <Link href="/" className="flex items-center w-fit">
              <h1 className="text-3xl font-bold text-blue-400">PayEase</h1>
              <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">Restaurant</span>
            </Link>
          </header>
          
          <VerificationMessage email={email} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto max-w-3xl">
        <header className="py-8">
          <Link href="/register" className="flex items-center w-fit">
            <h1 className="text-3xl font-bold text-blue-400">PayEase</h1>
            <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">Restaurant</span>
          </Link>
        </header>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-2xl font-bold mb-6">Register Your Restaurant</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                1
              </div>
              <div className={`h-1 w-20 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                2
              </div>
              <div className={`h-1 w-20 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600' : 'bg-gray-700'
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
            
            {/* Step 2: Restaurant Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium mb-4">Restaurant Information</h2>
                
                <div>
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-300 mb-2">
                    Restaurant Name
                  </label>
                  <input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Restaurant Name"
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
                    placeholder="Restaurant Address"
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
            
            {/* Step 3: Menu and Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium mb-4">Menu & Payment</h2>
                
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
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Menu Items
                    </label>
                    <button
                      type="button"
                      onClick={addMenuItem}
                      className="text-blue-400 text-sm hover:underline flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Item
                    </button>
                  </div>
                  
                  {menuItems.length === 0 ? (
                    <p className="text-gray-400 text-sm">No menu items added yet. Click the button above to add items.</p>
                  ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {menuItems.map((item) => (
                        <div key={item.id} className="bg-gray-700 p-4 rounded-md">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium">Menu Item</h4>
                            <button
                              type="button"
                              onClick={() => removeMenuItem(item.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Item Name*
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="e.g. Margherita Pizza"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Price*
                              </label>
                              <input
                                type="text"
                                value={item.price}
                                onChange={(e) => updateMenuItem(item.id, 'price', e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="e.g. 299"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Description (Optional)
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateMenuItem(item.id, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="Describe your item..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition ml-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-md font-medium text-white transition ml-auto ${
                    loading
                      ? 'bg-blue-600 opacity-70 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
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