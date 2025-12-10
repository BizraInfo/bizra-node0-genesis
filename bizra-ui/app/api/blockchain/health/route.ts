const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3006'

export async function GET() {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_URL}/health`, {
      cache: 'no-store',
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    return Response.json(
      { error: 'Blockchain API unavailable', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 },
    )
  }
}

