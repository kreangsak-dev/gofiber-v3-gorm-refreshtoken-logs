package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"gopkg.in/natefinch/lumberjack.v2"
	"gorm.io/gorm"

	model "nurse-table/internal/models"
)

var (
	SystemLog *log.Logger
	AuthLog   *log.Logger
	dbInst    *gorm.DB
)

// InitLogger initializes file-based rotating loggers and saves the db instance for async DB logging.
func InitLogger(db *gorm.DB) {
	dbInst = db

	// Ensure logs directory exists
	if err := os.MkdirAll("logs", os.ModePerm); err != nil {
		fmt.Println("Error creating logs directory:", err)
	}

	// System Logger definition
	// กำหนดขนาดไฟล์ด้วย ถ้าเกินให้เขียนทับ (MaxBackups: 1, MaxSize limit)
	systemWriter := &lumberjack.Logger{
		Filename:   "logs/system.log",
		MaxSize:    10, // megabytes
		MaxBackups: 1,  // เก็บไฟล์เก่าแค่ 1 ไฟล์ (เขียนทับ)
		MaxAge:     30, // days
		Compress:   true,
	}

	// Auth Logger definition
	authWriter := &lumberjack.Logger{
		Filename:   "logs/auth.log",
		MaxSize:    10, // megabytes
		MaxBackups: 1,  // เก็บไฟล์เก่าแค่ 1 ไฟล์ (เขียนทับ)
		MaxAge:     30, // days
		Compress:   true,
	}

	// Multiwriter to log to both File and Console (optional, can be disabled)
	sysOutput := io.MultiWriter(os.Stdout, systemWriter)
	authOutput := io.MultiWriter(os.Stdout, authWriter)

	SystemLog = log.New(sysOutput, "[SYSTEM] ", log.Ldate|log.Ltime)
	AuthLog = log.New(authOutput, "[AUTH] ", log.Ldate|log.Ltime)
}

// WriteToDB writes a log entry to PostgreSQL database asynchronously.
func WriteToDB(level, logType, message, ip, url, method string, userID *uint) {
	if dbInst == nil {
		return
	}
	// Async DB Insert so it doesn't block the HTTP request thread
	go func() {
		entry := model.SystemLog{
			Level:     level,
			Type:      logType,
			Message:   message,
			IP:        ip,
			URL:       url,
			Method:    method,
			UserID:    userID,
			CreatedAt: time.Now(),
		}
		// Assuming we don't care about logging the error of the log insert itself to avoid infinite loops
		dbInst.Create(&entry)
	}()
}

// InfoSystem logs informational messages to system.log ONLY (skip DB to save space).
func InfoSystem(msg, ip, url, method string) {
	if SystemLog != nil {
		SystemLog.Println(msg)
	}
	// skip DB for normal info logs
}

// ErrorSystem logs error messages to system.log and the DB.
func ErrorSystem(msg, ip, url, method string) {
	if SystemLog != nil {
		SystemLog.Println("ERROR: " + msg)
	}
	WriteToDB("error", "system", msg, ip, url, method, nil)
}

// InfoAuth logs authentication and user-related events to auth.log and the DB.
func InfoAuth(msg, ip, url, method string, userID *uint) {
	if AuthLog != nil {
		AuthLog.Println(msg)
	}
	WriteToDB("info", "auth", msg, ip, url, method, userID)
}

// ErrorAuth logs authentication errors to auth.log and the DB.
func ErrorAuth(msg, ip, url, method string, userID *uint) {
	if AuthLog != nil {
		AuthLog.Println("ERROR: " + msg)
	}
	WriteToDB("error", "auth", msg, ip, url, method, userID)
}
