// debug.js - اسکریپت کامل دیباگ برای تست APIها
const axios = require('axios')

const BASE_URL = 'http://localhost:8000/api'
let accessToken = null
let refreshToken = null

console.log('========================================')
console.log('🔍 Email Panel - Full API Debug Script')
console.log('========================================\n')

// 1. تست اتصال به بک‌اند
async function testConnection() {
  console.log('📡 1. Testing Backend Connection...')
  try {
    const response = await axios.get(`${BASE_URL}/auth/login/`, {
      timeout: 5000,
    })
    console.log('✅ Backend is reachable (GET /auth/login/ returns 200 or 405)')
    console.log(`   Status: ${response.status}\n`)
    return true
  } catch (error) {
    if (error.response?.status === 405 || error.response?.status === 401) {
      console.log('✅ Backend is reachable (Method not allowed or Unauthorized - this is normal)')
      console.log(`   Status: ${error.response.status}\n`)
      return true
    }
    console.log('❌ Backend is NOT reachable!')
    console.log(`   Error: ${error.message}`)
    console.log('   Make sure backend is running: python backend\\manage.py runserver 8000\n')
    return false
  }
}

// 2. تست لاگین
async function testLogin() {
  console.log('🔑 2. Testing Login...')
  try {
    const response = await axios.post(`${BASE_URL}/auth/login/`, {
      username: 'admin',
      password: 'admin123'
    })
    accessToken = response.data.access
    refreshToken = response.data.refresh
    console.log('✅ Login successful!')
    console.log(`   Access Token: ${accessToken?.substring(0, 30)}...`)
    console.log(`   Refresh Token: ${refreshToken?.substring(0, 30)}...`)
    console.log(`   User: ${response.data.user?.username}\n`)
    return true
  } catch (error) {
    console.log('❌ Login failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('   Try: python backend\\manage.py createsuperuser\n')
    return false
  }
}

// 3. تست Senders API
async function testSenders() {
  console.log('📧 3. Testing Senders API...')
  if (!accessToken) {
    console.log('⚠️  No access token! Skipping...\n')
    return false
  }
  try {
    const response = await axios.get(`${BASE_URL}/senders/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('✅ Senders API is working!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Count: ${response.data.length} senders`)
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...\n`)
    return true
  } catch (error) {
    console.log('❌ Senders API failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('')
    return false
  }
}

// 4. تست Campaigns API
async function testCampaigns() {
  console.log('📨 4. Testing Campaigns API...')
  if (!accessToken) {
    console.log('⚠️  No access token! Skipping...\n')
    return false
  }
  try {
    const response = await axios.get(`${BASE_URL}/emails/campaigns/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('✅ Campaigns API is working!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Count: ${response.data.results?.length || response.data?.length || 0} campaigns`)
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...\n`)
    return true
  } catch (error) {
    console.log('❌ Campaigns API failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('')
    return false
  }
}

// 5. تست Categories API
async function testCategories() {
  console.log('📁 5. Testing Categories API...')
  if (!accessToken) {
    console.log('⚠️  No access token! Skipping...\n')
    return false
  }
  try {
    const response = await axios.get(`${BASE_URL}/categories/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('✅ Categories API is working!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Count: ${response.data.length} categories`)
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...\n`)
    return true
  } catch (error) {
    console.log('❌ Categories API failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('')
    return false
  }
}

// 6. تست Dashboard API
async function testDashboard() {
  console.log('📊 6. Testing Dashboard API...')
  if (!accessToken) {
    console.log('⚠️  No access token! Skipping...\n')
    return false
  }
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/stats/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('✅ Dashboard API is working!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...\n`)
    return true
  } catch (error) {
    console.log('❌ Dashboard API failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('')
    return false
  }
}

// 7. تست Notifications API
async function testNotifications() {
  console.log('🔔 7. Testing Notifications API...')
  if (!accessToken) {
    console.log('⚠️  No access token! Skipping...\n')
    return false
  }
  try {
    const response = await axios.get(`${BASE_URL}/notifications/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    console.log('✅ Notifications API is working!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Count: ${response.data.results?.length || response.data?.length || 0} notifications`)
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 200)}...\n`)
    return true
  } catch (error) {
    console.log('❌ Notifications API failed!')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Error: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    console.log('')
    return false
  }
}

// ==================== اجرای همه تست‌ها ====================
async function runAllTests() {
  console.log('🚀 Starting Debug Tests...\n')
  console.log('========================================\n')
  
  const results = {
    connection: await testConnection(),
    login: await testLogin(),
    senders: await testSenders(),
    campaigns: await testCampaigns(),
    categories: await testCategories(),
    dashboard: await testDashboard(),
    notifications: await testNotifications(),
  }
  
  console.log('========================================')
  console.log('📊 Test Results Summary:')
  console.log('========================================')
  
  const total = Object.keys(results).length
  const passed = Object.values(results).filter(v => v === true).length
  const failed = total - passed
  
  for (const [key, value] of Object.entries(results)) {
    console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'PASSED' : 'FAILED'}`)
  }
  
  console.log(`\n📈 Total: ${passed}/${total} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed! Check the errors above.')
    console.log('   Common fixes:')
    console.log('   1. Make sure backend is running on port 8000')
    console.log('   2. Make sure you have created a superuser: python backend\\manage.py createsuperuser')
    console.log('   3. Make sure CORS is configured correctly in settings.py')
    console.log('   4. Make sure all migrations are applied: python backend\\manage.py migrate')
    console.log('   5. Check if required apps are installed in INSTALLED_APPS')
  } else {
    console.log('\n🎉 All tests passed! Your backend is working perfectly.')
  }
  
  console.log('\n========================================')
}

// اجرا
runAllTests().catch(console.error)