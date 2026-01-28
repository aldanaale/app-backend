const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  let ok = true;
  const email = `rev_${Date.now()}@example.com`;
  const password = "Aa123456!";
  try {
    await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "RevUser" }),
    });
    const login = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await login.json();
    const token = j.token;
    const refreshToken = j.refreshToken;
    if (!token || !refreshToken) ok = false;
    const logout = await fetchFn("http://localhost:3000/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (logout.status !== 200) ok = false;
    const tryRefresh = await fetchFn("http://localhost:3000/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (tryRefresh.status === 200) ok = false; // debe fallar
  } catch {
    ok = false;
  }
  if (!ok) {
    console.log("Refresh revocation test: FAIL");
    process.exit(1);
  } else {
    console.log("Refresh revocation test: OK");
  }
}

run();
