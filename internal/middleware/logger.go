package middleware

import (
	"fmt"
	"nurse-table/internal/logger"
	"time"

	"github.com/gofiber/fiber/v3"
)

func Logger() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()

		msg := c.Path() + " [" + latency.String() + "]"
		if err != nil {
			msg += " (error: " + err.Error() + ")"
			logger.ErrorSystem(msg, c.IP(), c.OriginalURL(), c.Method())
		} else {
			// Optional: only log info for specific routes if too noisy,
			// but we'll log all as requested with the custom logger
			logger.InfoSystem(fmt.Sprintf("%d | %s", status, msg), c.IP(), c.OriginalURL(), c.Method())
		}

		return err
	}
}
