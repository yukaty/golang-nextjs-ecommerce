package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yukaty/go-trailhead/backend/internal/handler"
)

// Middleware function to verify JWT token stored in HTTP request cookie
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get JWT token stored in HTTP request cookie
		tokenString, err := c.Cookie(handler.AuthTokenCookieName)
		// If cookie doesn't exist, return 401 Unauthorized error and abort further processing
		if err != nil {
			log.Println("Auth middleware: Cookie not found")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}

		// Verify JWT token using VerifyToken function
		claims, err := handler.VerifyToken(tokenString)
		// If JWT token is invalid, return 401 Unauthorized error and abort further processing
		if err != nil {
			log.Printf("Auth middleware: Invalid token: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authentication token"})
			return
		}

		// Store user information in HTTP request context
		// (So subsequent middleware functions or handler functions can retrieve it with c.Get("user"))
		c.Set("user", claims)

		// Execute next middleware function or handler function
		c.Next()
	}
}

// Middleware function to check admin privileges
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user information from HTTP request context
		// (Assumes AuthMiddleware function has already been executed)
		userClaims, exists := c.Get("user")
		// If user information doesn't exist in context, return 401 Unauthorized error
		if !exists {
			log.Println("Admin auth middleware: User information not found in context")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}

		// Get claims using type assertion
		claims, ok := userClaims.(*handler.JWTCustomClaims)
		// If claims type is incorrect or IsAdmin field is false, return 403 Forbidden error
		if !ok || !claims.IsAdmin {
			log.Printf("Admin auth middleware: Insufficient privileges (IsAdmin=%v)", claims.IsAdmin)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// Execute next middleware function or handler function
		c.Next()
	}
}
