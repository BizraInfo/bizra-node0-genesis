const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:8080'

export async function GET() {
  try {
    // Proxy to BIZRA NODE0 consensus stats endpoint
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/consensus/stats`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`BIZRA NODE0 API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform data to match UI expectations
    const transformedData = {
      tps: data.tps || 0,
      finality: data.finality || 'pending',
      blockHeight: data.blockHeight || 0,
      activeValidators: data.activeValidators || 0,
      totalTransactions: data.totalTransactions || 0,
      networkHealth: data.networkHealth || 'unknown',
      lastBlockTime: data.lastBlockTime || new Date().toISOString(),
      احسانScore: data.احسانScore || 100.0,
      consensusRounds: data.consensusRounds || 0,
      averageBlockTime: data.averageBlockTime || 0,
    }

    return Response.json(transformedData, { status: 200 })
  } catch (error) {
    console.error('BIZRA NODE0 stats API error:', error)
    return Response.json(
      {
        error: 'BIZRA NODE0 blockchain API unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
