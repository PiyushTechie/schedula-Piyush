const apiUrl = 'http://localhost:3000';

const doctors = [
  // --- CARDIOLOGISTS (4) ---
  {
    auth: { email: 'dr.rahul.s@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Rahul Sharma', specialization: 'Cardiology', experience: 12, qualification: 'MD', consultationFee: 800, availability: '9 AM - 5 PM' }
  },
  {
    auth: { email: 'dr.sarah@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Sarah Smith', specialization: 'Cardiology', experience: 8, qualification: 'MBBS, MD', consultationFee: 600, availability: '10 AM - 4 PM' }
  },
  {
    auth: { email: 'dr.amit@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Amit Patel', specialization: 'Cardiology', experience: 15, qualification: 'MD, DM', consultationFee: 1000, availability: 'Mon-Wed 9 AM - 1 PM' }
  },
  {
    auth: { email: 'dr.emily@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Emily Chen', specialization: 'Cardiology', experience: 5, qualification: 'MBBS', consultationFee: 500, availability: 'Weekends Only' }
  },

  // --- NEUROLOGISTS (3) ---
  {
    auth: { email: 'dr.james@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. James Jones', specialization: 'Neurology', experience: 20, qualification: 'MD, PhD', consultationFee: 1500, availability: 'Tue-Thu 10 AM - 6 PM' }
  },
  {
    auth: { email: 'dr.priya@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Priya Singh', specialization: 'Neurology', experience: 7, qualification: 'MD', consultationFee: 700, availability: '9 AM - 3 PM' }
  },
  {
    auth: { email: 'dr.michael@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Michael Brown', specialization: 'Neurology', experience: 11, qualification: 'MBBS, MD', consultationFee: 900, availability: 'On Call' }
  },

  // --- PEDIATRICIANS (3) ---
  {
    auth: { email: 'dr.rahul.v@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Rahul Verma', specialization: 'Pediatrics', experience: 6, qualification: 'MBBS, DCH', consultationFee: 400, availability: '8 AM - 12 PM' }
  },
  {
    auth: { email: 'dr.jessica@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Jessica Davis', specialization: 'Pediatrics', experience: 14, qualification: 'MD', consultationFee: 800, availability: '1 PM - 7 PM' }
  },
  {
    auth: { email: 'dr.william@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. William Garcia', specialization: 'Pediatrics', experience: 9, qualification: 'MBBS', consultationFee: 500, availability: 'Mon-Fri 9 AM - 5 PM' }
  },

  // --- ORTHOPEDICS (2) ---
  {
    auth: { email: 'dr.john@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. John Doe', specialization: 'Orthopedics', experience: 18, qualification: 'MS Ortho', consultationFee: 1200, availability: '10 AM - 8 PM' }
  },
  {
    auth: { email: 'dr.jane@test.com', password: 'password', role: 'DOCTOR' },
    profile: { fullName: 'Dr. Jane Roe', specialization: 'Orthopedics', experience: 4, qualification: 'MBBS, MS', consultationFee: 600, availability: 'Wed-Sun 12 PM - 6 PM' }
  }
];

async function seed() {
  console.log('🚀 Starting automated database seeding...');
  
  for (const doc of doctors) {
    try {
      await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc.auth)
      });

      const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: doc.auth.email, password: doc.auth.password })
      });
      const loginData = await loginRes.json();
      
      await fetch(`${apiUrl}/doctor/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.access_token}`
        },
        body: JSON.stringify(doc.profile)
      });
      
      console.log(`✅ Successfully created profile for ${doc.profile.fullName}`);
    } catch (error) {
      console.log(`❌ Failed to create ${doc.profile.fullName}:`, error.message);
    }
  }
  console.log('🎉 Database seeding complete! 12 profiles generated.');
}

seed();