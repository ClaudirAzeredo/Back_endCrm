"use client"

import { useMemo } from "react"

type PieChartData = {
  name: string
  value: number
  percentage: string
}

type PieChartProps = {
  data: PieChartData[]
  colors: string[]
  width?: number
  height?: number
  showLabels?: boolean
  showLegend?: boolean
}

export default function PieChart({
  data,
  colors,
  width = 400,
  height = 300,
  showLabels = true,
  showLegend = true,
}: PieChartProps) {
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
        color: colors[index % colors.length],
      }
    })

    return { slices, total }
  }, [data, colors])

  const radius = Math.min(width, height) / 2 - 40
  const centerX = width / 2
  const centerY = height / 2

  const createPath = (startAngle: number, endAngle: number, radius: number) => {
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

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const getLabelPosition = (startAngle: number, endAngle: number, radius: number) => {
    const midAngle = (startAngle + endAngle) / 2
    return polarToCartesian(centerX, centerY, radius * 0.7, midAngle)
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-muted-foreground">Nenhum dado disponível</p>
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
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {slices.map((slice) => (
            <div key={slice.name} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-sm truncate">{slice.name}</span>
              <span className="text-xs text-muted-foreground">({slice.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
