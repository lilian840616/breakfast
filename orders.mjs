import { getStore } from "@netlify/blobs";

const clip = (v, n) => String(v ?? "").slice(0, n);

export default async (req) => {
  const store = getStore("orders");
  const url = new URL(req.url);

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const rows = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return Response.json(rows.filter(Boolean));
  }

  if (req.method === "POST") {
    const o = await req.json();
    if (!o.name || (!o.drink && !o.bfast)) return new Response("bad", { status: 400 });
    const id = crypto.randomUUID();
    const rec = {
      id, owner: clip(o.owner, 64), name: clip(o.name, 20),
      drink: clip(o.drink, 40), sugar: clip(o.sugar, 10), ice: clip(o.ice, 10),
      bfast: clip(o.bfast, 40), t: Date.now(),
    };
    await store.setJSON(id, rec);
    return Response.json(rec);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    const owner = url.searchParams.get("owner");
    const rec = id ? await store.get(id, { type: "json" }) : null;
    if (rec && rec.owner === owner) await store.delete(id);
    return Response.json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/orders" };
