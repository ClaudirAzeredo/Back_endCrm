function MetricCard({ title, value, change, changeType = "neutral", icon }) {
  const getChangeClass = () => {
    switch (changeType) {
      case "positive":
        return "metric-change positive"
      case "negative":
        return "metric-change negative"
      default:
        return "metric-change neutral"
    }
  }

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className={getChangeClass()}>
        {changeType === "positive" && <span>↗️</span>}
        {changeType === "negative" && <span>↘️</span>}
        <span>{change}</span>
      </div>
    </div>
  )
}

export default MetricCard
