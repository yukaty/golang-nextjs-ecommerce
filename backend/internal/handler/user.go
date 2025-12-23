package handler

import (
	"database/sql"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// User registration request struct
type UserRegisterRequest struct {
	Name     string `json:"name" binding:"required"`        // Make required field with binding:"required"
	Email    string `json:"email" binding:"required,email"` // Also check email format
	Password string `json:"password" binding:"required"`
}

// User information response struct
type UserMeResponse struct {
	UserID  int    `json:"userId"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"isAdmin"`
}

// User edit request struct
type UserUpdateRequest struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required,email"`
}

// Password change request struct
type PasswordUpdateRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

// --- 2. Handler Definitions ---

// Function to register user
func RegisterUserHandler(c *gin.Context) {
	var req UserRegisterRequest
	// Bind HTTP request body to UserRegisterRequest struct
	// Return error if required fields or format are incorrect
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("HTTP request body binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check email address format
	emailPattern := regexp.MustCompile(`^[a-zA-Z0-9.]+@[a-zA-Z0-9.]+$`)
	if !emailPattern.MatchString(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter a valid email address format"})
		return
	}

	// Check password length
	if len(req.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	// Check for duplicate email address
	db := database.GetDB()
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", req.Email).Scan(&count)
	// Also check for QueryRow() method errors (e.g., DB connection errors)
	if err != nil {
		log.Printf("Email duplicate check error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This email address is already registered"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Password hashing error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Register user in database
	insertQuery := `
		INSERT INTO users (name, email, password, is_admin, enabled)
		VALUES (?, ?, ?, false, true)
	`
	_, err = db.Exec(insertQuery, req.Name, req.Email, string(hashedPassword))
	if err != nil {
		log.Printf("User registration error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Return successful registration response
	c.JSON(http.StatusOK, gin.H{"message": "Registration completed"})
}

// Function to get own user information
func GetUserMeHandler(c *gin.Context) {
	// Get claims stored in context by AuthMiddleware function
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("GetUserMeHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication information not found"})
		return
	}

	// Get claims using type assertion
	claims, ok := userClaims.(*JWTCustomClaims)
	if !ok {
		log.Println("GetUserMeHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Assemble final response
	response := UserMeResponse{
		UserID:  claims.UserID,
		Name:    claims.Name,
		Email:   claims.Email,
		IsAdmin: claims.IsAdmin,
	}

	// Return response as JSON
	c.JSON(http.StatusOK, response)
}

// Function to edit user information
func UpdateUserHandler(c *gin.Context) {
	// Get user information from HTTP request context
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("UpdateUserHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	claims, ok := userClaims.(*JWTCustomClaims) // Type defined in auth.go file
	if !ok {
		log.Println("UpdateUserHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	userID := claims.UserID // User ID to update

	// Bind HTTP request body to UserUpdateRequest struct
	// Return error if required fields or format are incorrect
	var req UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("User edit request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check email address format
	emailPattern := regexp.MustCompile(`^[a-zA-Z0-9.]+@[a-zA-Z0-9.]+$`)
	if !emailPattern.MatchString(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter a valid email address format"})
		return
	}

	// Check for duplicate email address (excluding own email address)
	db := database.GetDB()
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE email = ? AND id != ?", req.Email, userID).Scan(&count)
	if err != nil {
		log.Printf("Email duplicate check error (during update): %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This email address is already in use"})
		return
	}

	// Update database
	updateQuery := "UPDATE users SET name = ?, email = ? WHERE id = ?"
	_, err = db.Exec(updateQuery, req.Name, req.Email, userID)
	if err != nil {
		log.Printf("User information update error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Regenerate JWT token with updated information
	expirationTime := time.Now().Add(1 * time.Hour) // Expiration same as login
	newClaims := &JWTCustomClaims{                  // Type defined in auth.go file
		UserID:  userID,
		Name:    req.Name,       // Updated name
		Email:   req.Email,      // Updated email address
		IsAdmin: claims.IsAdmin, // Inherit admin privileges from original JWT token
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()), // Update issued time
		},
	}
	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)

	// Sign JWT token
	newTokenString, err := newToken.SignedString(JWTSecret)
	if err != nil {
		// Database update succeeded, so only log error and continue processing
		log.Printf("JWT re-signing error (during update): %v", err)
	}

	// If signing succeeded, save new JWT token in cookie
	if newTokenString != "" {
		c.SetCookie(
			AuthTokenCookieName, // Cookie name (constant defined in auth.go file)
			newTokenString,      // New JWT token string
			3600,                // Expiration (seconds)
			"/",                 // Path
			Domain,              // Domain
			IsSecure,            // Allow only encrypted communication (HTTPS) - true in production
			true,                // Set HttpOnly attribute to prevent JavaScript access
		)
	}

	// Return successful update response
	c.JSON(http.StatusOK, gin.H{"message": "User information updated"})
}

// Function to change password
func UpdatePasswordHandler(c *gin.Context) {
	// Get user information from HTTP request context
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("UpdatePasswordHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	claims, ok := userClaims.(*JWTCustomClaims) // Type defined in auth.go file
	if !ok {
		log.Println("UpdatePasswordHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	userID := claims.UserID // User ID to update

	// Bind HTTP request body to PasswordUpdateRequest struct
	// Return error if required fields or format are incorrect
	var req PasswordUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Password change request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check new password length
	if len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	// Get current password from database
	db := database.GetDB()
	var currentPasswordHash string
	err := db.QueryRow("SELECT password FROM users WHERE id = ?", userID).Scan(&currentPasswordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Password change error: User not found (UserID=%d)", userID)
			c.JSON(http.StatusNotFound, gin.H{"error": "User information not found"})
		} else {
			log.Printf("Current password retrieval error (UserID=%d): %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		}
		return
	}

	// Verify current password is correct
	err = bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(req.OldPassword))
	if err != nil {
		log.Printf("Password change failed (current password mismatch): UserID=%d", userID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	newPasswordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("New password hashing error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Update password in database
	updateQuery := "UPDATE users SET password = ? WHERE id = ?"
	_, err = db.Exec(updateQuery, string(newPasswordHash), userID)
	if err != nil {
		log.Printf("Password update error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Return successful update response
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
