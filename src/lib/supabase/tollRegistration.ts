import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Create a Supabase client
const supabase = createClientComponentClient<Database>();

/**
 * Register a new toll booth user and create toll profile record
 */
export async function registerTollBooth(
  email: string, 
  password: string, 
  tollData: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    upi_id?: string;
  }
) {
  try {
    // Step 1: Create a new user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User registration failed');
    }

    // Step 2: Create toll profile record
    const { data: profileData, error: profileError } = await supabase
      .from('toll_profiles')
      .insert({
        user_id: authData.user.id,
        name: tollData.name,
        address: tollData.address,
        latitude: tollData.latitude,
        longitude: tollData.longitude,
        upi_id: tollData.upi_id,
        vehicle_types: [],
        settings: {}
      })
      .select()
      .single();

    if (profileError) {
      console.error('Failed to create toll profile record:', profileError);
      throw profileError;
    }

    return { user: authData.user, profile: profileData };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Fetch toll profile data for the authenticated user
 */
export async function getTollProfile() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('toll_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching toll profile:', error);
    throw error;
  }
}

/**
 * Update toll profile information
 */
export async function updateTollProfile(
  profileId: string,
  updateData: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    upi_id?: string;
    vehicle_types?: any[];
    settings?: Record<string, any>;
  }
) {
  try {
    const { data, error } = await supabase
      .from('toll_profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating toll profile:', error);
    throw error;
  }
}

/**
 * Add a vehicle type to the toll profile
 */
export async function addVehicleType(
  profileId: string,
  vehicleType: {
    name: string;
    fee: number;
  }
) {
  try {
    // First get the current profile
    const { data: profile, error: fetchError } = await supabase
      .from('toll_profiles')
      .select('vehicle_types')
      .eq('id', profileId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Add the new vehicle type
    const vehicleTypes = Array.isArray(profile.vehicle_types) 
      ? [...profile.vehicle_types, vehicleType] 
      : [vehicleType];
    
    // Update the profile
    const { data, error } = await supabase
      .from('toll_profiles')
      .update({ vehicle_types: vehicleTypes })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error adding vehicle type:', error);
    throw error;
  }
}

/**
 * Record a new toll transaction
 */
export async function recordTransaction(
  profileId: string,
  transactionData: {
    vehicle_number: string;
    vehicle_type: string;
    amount: number;
    payment_status?: string;
    payment_method?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        profile_id: profileId,
        vehicle_number: transactionData.vehicle_number,
        vehicle_type: transactionData.vehicle_type,
        amount: transactionData.amount,
        payment_status: transactionData.payment_status || 'completed',
        payment_method: transactionData.payment_method || 'cash'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
}

/**
 * Fetch transactions for a toll profile
 */
export async function getTransactions(profileId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
} 