// internal/utils/validator.go
package utils

import (
	"errors"
)

// Validate password strength (นอกเหนือจาก min length)
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
	}

	hasUpper := false
	hasLower := false
	hasNumber := false

	for _, char := range password {
		switch {
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case 'a' <= char && char <= 'z':
			hasLower = true
		case '0' <= char && char <= '9':
			hasNumber = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber {
		return errors.New("รหัสผ่านต้องประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข")
	}

	return nil
}

// Validate Thai phone number format
func ValidateThaiPhone(phone string) error {
	if len(phone) != 10 {
		return errors.New("เบอร์โทรศัพท์ต้องมี 10 หลัก")
	}

	if phone[0] != '0' {
		return errors.New("เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0")
	}

	return nil
}
