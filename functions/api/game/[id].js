export async function onRequestGet(context) {
  const { id } = context.params;
  const data = await context.env.GAMES.get(id);
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return new Response(data, { headers: { 'Content-Type': 'application/json' } });
}
