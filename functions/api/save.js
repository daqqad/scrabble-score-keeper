export async function onRequestPost(context) {
  try {
    const { id, players, turns } = await context.request.json();

    if (!id || typeof id !== 'string' || id.length > 32) {
      return Response.json({ error: 'Invalid id' }, { status: 400 });
    }
    if (!Array.isArray(players) || players.length < 2 || players.length > 6) {
      return Response.json({ error: 'Invalid players' }, { status: 400 });
    }

    const data = { players, turns: Array.isArray(turns) ? turns : [], savedAt: Date.now() };
    await context.env.GAMES.put(id, JSON.stringify(data), { expirationTtl: 7776000 }); // 90 days

    return Response.json({ id });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
