'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { session, isLoading } = useSupabase();
  const [userType, setUserType] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [tollData, setTollData] = useState<any>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !session) {
      router.push('/login');
      return;
    }

    // Get user type from session
    if (session?.user?.user_metadata?.user_type) {
      setUserType(session.user.user_metadata.user_type);
    }

    // Load data from localStorage based on user type
    try {
      const storedRestaurantData = localStorage.getItem('restaurant_data');
      if (storedRestaurantData) {
        setRestaurantData(JSON.parse(storedRestaurantData));
      }

      const storedTollData = localStorage.getItem('toll_data');
      if (storedTollData) {
        setTollData(JSON.parse(storedTollData));
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, [session, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-400">GPS Pay Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
          >
            Sign Out
          </button>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Welcome, {session?.user?.email}
          </h2>

          {/* Restaurant Data */}
          {restaurantData && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Your Restaurant</h3>
              <div className="bg-gray-700 rounded-lg p-6">
                <p className="text-lg font-medium mb-2">{restaurantData.name}</p>
                <p className="text-gray-300 mb-4">{restaurantData.address}</p>
                
                <h4 className="text-lg font-medium mb-2">Menu Items</h4>
                {restaurantData.menuItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {restaurantData.menuItems.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-600 p-4 rounded">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-green-400">₹{item.price}</p>
                        {item.description && <p className="text-sm text-gray-300">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No menu items added</p>
                )}
              </div>
            </div>
          )}

          {/* Toll Data */}
          {tollData && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Toll Booth</h3>
              <div className="bg-gray-700 rounded-lg p-6">
                <p className="text-lg font-medium mb-2">{tollData.name}</p>
                <p className="text-gray-300 mb-4">{tollData.address}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Location</h4>
                    <p>Lat: {tollData.coordinates.lat}</p>
                    <p>Lng: {tollData.coordinates.lng}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Payment</h4>
                    <p>UPI: {tollData.upiId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!restaurantData && !tollData && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No data found for your account.</p>
              <Link href="/register" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md">
                Register Your Business
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 