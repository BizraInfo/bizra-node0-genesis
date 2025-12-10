"use client"

import { useEffect, useRef } from 'react'

export function ProofSection() {
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && chartRef.current) {
      // Load Chart.js dynamically
      import('chart.js/auto').then((ChartModule) => {
        const Chart = ChartModule.default
        const ctx = chartRef.current?.getContext('2d')

        if (ctx) {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Genesis Finality', 'PoI Throughput', 'SIAP Latency', 'Agent Spawn', 'Test Pass Rate'],
              datasets: [{
                label: 'Performance Metrics',
                data: [8, 50, 10, 100, 100],
                backgroundColor: [
                  'rgba(212, 175, 55, 0.8)',
                  'rgba(212, 175, 55, 0.7)',
                  'rgba(212, 175, 55, 0.6)',
                  'rgba(212, 175, 55, 0.5)',
                  'rgba(212, 175, 55, 0.4)'
                ],
                borderColor: 'rgba(212, 175, 55, 1)',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      const labels = [
                        'Finality: <8 seconds',
                        'Throughput: 50+ attestations/sec',
                        'Latency: <10ms',
                        'Spawn Time: <100ms',
                        'Tests: 35/35 passing (100%)'
                      ]
                      return labels[context.dataIndex]
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  grid: {
                    color: 'rgba(212, 175, 55, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  grid: {
                    color: 'rgba(212, 175, 55, 0.1)'
                  }
                }
              }
            }
          })
        }
      })
    }
  }, [])

  return (
    <section id="proof" className="py-24 px-8">
      <div className="container max-w-7xl mx-auto">
        <div className="section-header text-center mb-16 fade-in">
          <div className="section-badge inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-full text-sm font-600 mb-4 uppercase tracking-wider">
            Verified
          </div>
          <h2 className="section-title text-4xl md:text-6xl font-800 mb-6 text-white">
            Real Code. Real Tests. Real Impact.
          </h2>
          <p className="section-subtitle text-xl text-[rgba(255,255,255,0.7)] max-w-3xl mx-auto leading-relaxed">
            We don't just talk about it—we ship it. Here's the proof.
          </p>
        </div>

        <div className="proof-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="glass-card proof-item fade-in p-6 bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl flex gap-4">
            <div className="proof-icon w-10 h-10 flex-shrink-0">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="proof-content">
              <h3 className="text-xl font-700 mb-2 text-white">Genesis Block Verified</h3>
              <p className="text-[rgba(255,255,255,0.7)] leading-relaxed mb-3">Root hash cryptographically proven and immutable.</p>
              <div className="genesis-hash bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] p-3 rounded-xl text-xs font-mono text-[#D4AF37] break-all">
                d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f
              </div>
            </div>
          </div>

          <div className="glass-card proof-item fade-in p-6 bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl flex gap-4">
            <div className="proof-icon w-10 h-10 flex-shrink-0">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="proof-content">
              <h3 className="text-xl font-700 mb-2 text-white">35/35 Tests Passing</h3>
              <p className="text-[rgba(255,255,255,0.7)] leading-relaxed">Comprehensive test suite covering all critical paths. Zero failures in production validation.</p>
            </div>
          </div>

          <div className="glass-card proof-item fade-in p-6 bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl flex gap-4">
            <div className="proof-icon w-10 h-10 flex-shrink-0">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1V3"/>
                <path d="M12 21V23"/>
                <path d="M4.22 4.22L5.64 5.64"/>
                <path d="M18.36 18.36L19.78 19.78"/>
                <path d="M1 12H3"/>
                <path d="M21 12H23"/>
                <path d="M4.22 19.78L5.64 18.36"/>
                <path d="M18.36 5.64L19.78 4.22"/>
              </svg>
            </div>
            <div className="proof-content">
              <h3 className="text-xl font-700 mb-2 text-white">1.9GB AI Models Trained</h3>
              <p className="text-[rgba(255,255,255,0.7)] leading-relaxed">7 Trading Giants agents (Buffett, Lynch, Soros, Simons, Dalio + Risk/Portfolio) ready for GPU deployment.</p>
            </div>
          </div>
        </div>

        <div className="glass-card fade-in p-8 bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl">
          <h3 className="text-center text-2xl font-700 mb-6 text-white">System Performance Metrics</h3>
          <div className="chart-container h-96">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </section>
  )
}
