export const runtime = 'edge';
export async function GET() {
  return new Response("喵！我能通！", { status: 200 });
}