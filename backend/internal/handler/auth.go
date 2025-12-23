package handler

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// Login request struct
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// User information struct retrieved from database
type userForAuth struct {
	ID       int
	Name     string
	Email    string
	Password string
	IsAdmin  bool
}

// JWT token claims (Payload) struct
type JWTCustomClaims struct {
	UserID               int    `json:"userId"`
	Name                 string `json:"name"`
	Email                string `json:"email"`
	IsAdmin              bool   `json:"isAdmin"`
	jwt.RegisteredClaims        // Embed standard claims (iss, exp, iat, etc.)
}

// Get JWT secret key from environment variable for token signing
var JWTSecret = []byte(os.Getenv("JWT_SECRET"))

// Get cookie domain and secure attribute from environment variables
var Domain = os.Getenv("COOKIE_DOMAIN")
var IsSecure = os.Getenv("APP_ENV") == "production"

// Cookie name for storing in browser cookies
const AuthTokenCookieName = "authToken"

// Function to verify JWT token and return claims
func VerifyToken(tokenString string) (*JWTCustomClaims, error) {
	// Use ParseWithClaims function to parse and verify JWT token signature,
	// mapping resulting claims to JWTCustomClaims struct
	token, err := jwt.ParseWithClaims(tokenString, &JWTCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method is HS256
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		// Return secret key for signature verification
		return JWTSecret, nil
	})

	// Return error if parsing or signature verification fails
	if err != nil {
		log.Printf("Token verification error: %v", err)
		return nil, err
	}

	// Verify claims can be type-asserted to *JWTCustomClaims and JWT token is valid
	if claims, ok := token.Claims.(*JWTCustomClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, errors.New("invalid token")
	}
}

// --- 2. Handler Definitions ---

// Function to handle login
func LoginHandler(c *gin.Context) {
	var req LoginRequest
	// Bind HTTP request body to LoginRequest struct
	// Return error if required fields or format are incorrect
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email address or password"})
		return
	}

	// Search for user in database (also verify enabled = true)
	db := database.GetDB()
	var user userForAuth
	query := "SELECT id, name, email, password, is_admin FROM users WHERE email = ? AND enabled = TRUE"
	err := db.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.IsAdmin,
	)

	// Handle error when user is not found
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Login failed (user not found or disabled): email=%s", req.Email)
		} else {
			log.Printf("User search error: %v", err)
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email address or password"})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		log.Printf("Login failed (password mismatch): email=%s", req.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email address or password"})
		return
	}

	// Generate JWT token
	expirationTime := time.Now().Add(1 * time.Hour) // Expiration: 1 hour
	claims := &JWTCustomClaims{
		UserID:  user.ID,
		Name:    user.Name,
		Email:   user.Email,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign JWT token
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		log.Printf("JWT signing error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Store JWT token in cookie
	c.SetCookie(
		AuthTokenCookieName, // Cookie name
		tokenString,         // JWT token string
		3600,                // Expiration (seconds)
		"/",                 // Path
		Domain,              // Domain
		IsSecure,            // Allow only encrypted communication (HTTPS) - true in production
		true,                // Set HttpOnly attribute to prevent JavaScript access
	)

	// Return successful login response
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"isAdmin": user.IsAdmin,
	})
}

// Function to handle logout
func LogoutHandler(c *gin.Context) {
	// Delete cookie by setting expiration to past
	c.SetCookie(
		AuthTokenCookieName,
		"", // Set cookie value to empty string
		-1, // Set expiration to past
		"/",
		Domain,
		IsSecure,
		true,
	)

	// Redirect to frontend URL (top page)
	// Add query parameter (?logged-out=1) to notify logout
	c.Redirect(http.StatusFound, "/?logged-out=1")
}
