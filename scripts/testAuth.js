  const fetchFn = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

  async function run() {
    const email = `itest_${Date.now()}@example.com`;
    const password = "Aa123456!";
    let ok = true;
    try {
      const reg = await fetchFn("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: "ITest" }),
      });
      if (reg.status !== 201 && reg.status !== 400) ok = false;
      const login = await fetchFn("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (login.status !== 200) ok = false;
      const j = await login.json();
      if (!j.token || !j.refreshToken) ok = false;
      const refresh = await fetchFn("http://localhost:3000/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: j.refreshToken }),
      });
      if (refresh.status !== 200) ok = false;
      const rj = await refresh.json();
      if (!rj.token) ok = false;
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      console.log("Auth integration test: FAIL");
      process.exit(1);
    } else {
      console.log("Auth integration test: OK");
    }
  }

  run();
