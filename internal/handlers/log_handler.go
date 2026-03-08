package handler

import (
	"bufio"
	"io"
	"nurse-table/internal/utils"
	"os"

	"github.com/gofiber/fiber/v3"
)

type LogHandler struct{}

func NewLogHandler() *LogHandler {
	return &LogHandler{}
}

// GET /api/logs/:type
func (h *LogHandler) GetLogs(c fiber.Ctx) error {
	logType := c.Params("type")

	validTypes := map[string]string{
		"system": "logs/system.log",
		"auth":   "logs/auth.log",
	}

	filePath, exists := validTypes[logType]
	if !exists {
		return fiber.NewError(fiber.StatusBadRequest, "ประเภท Log ไม่ถูกต้อง")
	}

	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return utils.SuccessMessageResponse(c, "ยังไม่มีข้อมูล Log", []string{})
		}
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถอ่านไฟล์ Log ได้")
	}
	defer file.Close()

	// Read the last N lines (simple implementation reading all lines, returning last 1000 to prevent huge memory usage)
	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil && err != io.EOF {
		return fiber.NewError(fiber.StatusInternalServerError, "Error reading log: "+err.Error())
	}

	// Limit to last 500 lines
	maxLines := 500
	if len(lines) > maxLines {
		lines = lines[len(lines)-maxLines:]
	}

	return utils.SuccessResponse(c, lines)
}
