const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  const email = `q_${Date.now()}@example.com`;
  const password = "Aa123456!";
  let ok = true;
  try {
    const reg = await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "QUser" }),
    });
    console.log("register", reg.status);
    const login = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await login.json();
    const token = j.token;
    if (!token) ok = false;

    const trucksRes = await fetchFn("http://localhost:3000/trucks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("trucks", trucksRes.status);
    const trucksJson = await trucksRes.json();
    const trucksArr = Array.isArray(trucksJson) ? trucksJson : trucksJson.items;
    const smallTruck = trucksArr.find((t) => t.type === "S") || trucksArr[0];

    const create = await fetchFn("http://localhost:3000/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_name: "Cliente Demo",
        truck_id: smallTruck?.id,
        origin: "A",
        destination: "B",
        distance: 10,
        loads: [{ description: "Cajas", blocks: 30 }],
      }),
    });
    console.log("create", create.status);
    if (create.status !== 201) ok = false;
    const cq = await create.json();

    const getOne = await fetchFn(`http://localhost:3000/quotes/${cq.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("getOne", getOne.status);
    if (getOne.status !== 200) ok = false;

    const addLoad = await fetchFn(
      `http://localhost:3000/quotes/${cq.id}/loads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: "Bolsas", blocks: 5 }),
      },
    );
    console.log("addLoad", addLoad.status);
    if (addLoad.status !== 201) ok = false;

    const update = await fetchFn(`http://localhost:3000/quotes/${cq.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_name: "Cliente Demo",
        status: "En Proceso",
      }),
    });
    console.log("update", update.status);
    if (update.status !== 200) ok = false;

    const list = await fetchFn("http://localhost:3000/quotes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("list", list.status);
    if (list.status !== 200) ok = false;

    const delRes = await fetchFn(`http://localhost:3000/quotes/${cq.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("delete", delRes.status);
    if (delRes.status !== 200) ok = false;
  } catch {
    ok = false;
  }

  if (!ok) {
    console.log("Quotes integration test: FAIL");
    process.exit(1);
  } else {
    console.log("Quotes integration test: OK");
  }
}

run();
