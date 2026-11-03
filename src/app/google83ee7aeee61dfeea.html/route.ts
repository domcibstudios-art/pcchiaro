export function GET() {
  return new Response("google-site-verification: google83ee7aeee61dfeea.html\n", {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
