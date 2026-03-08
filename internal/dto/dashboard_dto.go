package dto

// DashboardSummaryResponse struct
type DashboardSummaryResponse struct {
	// General Stats (Visible to everyone)
	TotalProducts int64   `json:"total_products"`
	TotalValue    float64 `json:"total_value"`
	LowStockCount int64   `json:"low_stock_count"`

	// Admin Stats (Visible only to admin / super_admin)
	TotalUsers *int64 `json:"total_users,omitempty"`
	SystemLogs *int64 `json:"system_logs,omitempty"`
}
