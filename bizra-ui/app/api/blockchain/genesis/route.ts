const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:8080'

export async function GET() {
  try {
    // Proxy to BIZRA NODE0 consensus genesis endpoint
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/consensus/genesis`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`BIZRA NODE0 API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform genesis data to match UI expectations
    const transformedData = {
      blockHash: data.blockHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      blockHeight: data.blockHeight || 0,
      timestamp: data.timestamp || new Date().toISOString(),
      proposer: data.proposer || 'BIZRA Genesis Validator',
      transactions: data.transactions || [],
      qc: data.qc || null,
      احسانScore: data.احسانScore || 100.0,
      networkId: data.networkId || 'bizra-testnet-001',
      genesisTime: data.genesisTime || new Date().toISOString(),
    }

    return Response.json(transformedData, { status: 200 })
  } catch (error) {
    console.error('BIZRA NODE0 genesis API error:', error)
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
