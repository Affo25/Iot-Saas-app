// This is a one-time script to create test users
// Run with: node test-users.js

const axios = require('axios');

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    const response = await axios.post('http://localhost:3000/api/Auth/CreateTestUsers', {});
    
    console.log('✅ Test users creation response:', response.data);
    
    if (response.data.success) {
      console.log('\n🎉 Test users ready!');
      console.log('Admin credentials:', response.data.credentials.admin);
      console.log('Customer credentials:', response.data.credentials.customer);
      console.log('\nYou can now test login functionality with these credentials.');
    }
  } catch (error) {
    console.error('❌ Error creating test users:', error.response?.data || error.message);
  }
}

createTestUsers();