const fetchFn = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function run() {
  const email = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
  const password = process.env.ADMIN_PASSWORD || 'Adm1n!Secure';
  const base = process.env.API_BASE || 'http://localhost:3000';
  try {
    const loginRes = await fetchFn(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, loginData);
    if (!loginRes.ok) process.exit(1);
    const token = loginData.token;
    const profRes = await fetchFn(`${base}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profile = await profRes.json();
    console.log('Profile status:', profRes.status, profile);
    if (!profRes.ok) process.exit(1);
    const quotesRes = await fetchFn(`${base}/admin/quotes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const quotesData = await quotesRes.json();
    console.log('Admin quotes status:', quotesRes.status);
    console.log('Admin quotes body:', quotesData);
    const usersRes = await fetchFn(`${base}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    console.log('Admin users status:', usersRes.status);
    console.log('Admin users body:', usersData);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run();
