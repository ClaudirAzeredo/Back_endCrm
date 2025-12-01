"use client"

import { useMemo } from "react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"]

function PieChart({ data, width = 400, height = 300, showLabels = true, showLegend = true }) {
  const { slices, total } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    const slices = data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      currentAngle += angle

      return {
        ...item,
        percentage,
        angle,
        startAngle,
        endAngle,
        color: COLORS[index % COLORS.length],
      }
    })

    return { slices, total }
  }, [data])

  const radius = Math.min(width, height) / 2 - 40
  const centerX = width / 2
  const centerY = height / 2

  const createPath = (startAngle, endAngle, radius) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

    return [
      "M",
      centerX,
      centerY,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ")
  }

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const getLabelPosition = (startAngle, endAngle, radius) => {
    const midAngle = (startAngle + endAngle) / 2
    return polarToCartesian(centerX, centerY, radius * 0.7, midAngle)
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg width={width} height={height} className="overflow-visible">
        {slices.map((slice, index) => (
          <g key={slice.name}>
            <path
              d={createPath(slice.startAngle, slice.endAngle, radius)}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            {showLabels && slice.percentage > 5 && (
              <text
                x={getLabelPosition(slice.startAngle, slice.endAngle, radius).x}
                y={getLabelPosition(slice.startAngle, slice.endAngle, radius).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-medium"
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
              >
                {slice.percentage.toFixed(1)}%
              </text>
            )}
          </g>
        ))}
      </svg>

      {showLegend && (
        <div className="chart-legend">
          {slices.map((slice) => (
            <div key={slice.name} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: slice.color }}></div>
              <span className="truncate">{slice.name}</span>
              <span className="text-xs text-gray-500">({slice.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PieChart
