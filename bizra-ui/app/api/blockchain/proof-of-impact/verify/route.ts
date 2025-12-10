const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3006'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/v1/proof-of-impact/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

