package handler

import (
	"database/sql"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// Review display struct
type ReviewData struct {
	ID        int       `json:"id"`
	ProductID int       `json:"product_id"`
	UserID    int       `json:"user_id"`
	Score     int       `json:"score"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UserName  string    `json:"user_name"`
}

// Response struct for reviews list API (/api/products/:id/reviews)
type ReviewsPageData struct {
	Reviews    []ReviewData `json:"reviews"`
	ReviewAvg  float64      `json:"review_avg"` // Average rating
	Pagination Pagination   `json:"pagination"` // Pagination information (type defined in product.go file)
}

// Review submission request struct
type ReviewRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"` // Number of stars (1-5)
	Content string `json:"content" binding:"required"`
}

// --- 2. Handler Definitions ---

// Function to get reviews list for specified product ID (GET /api/products/:id/reviews)
func GetReviewsHandler(c *gin.Context) {
	// Get "product ID" from path parameter (:id)
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		log.Printf("Invalid product ID format (review retrieval): %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get pagination information from query parameter (?page=X)
	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	// Set number of reviews per page
	perPage := 10
	offset := (page - 1) * perPage

	// Get database connection
	db := database.GetDB()

	// Get reviews list, total review count, and average rating with concurrent processing
	var reviews []ReviewData
	var totalItems int
	var reviewAvg sql.NullFloat64 // AVG (average rating) can be NULL
	var reviewsErr, statsErr error

	// WaitGroup to wait for goroutine completion
	var wg sync.WaitGroup

	wg.Add(2)

	// Goroutine 1: Get reviews list
	go func() {
		defer wg.Done()
		query := `
			SELECT
				r.id, r.product_id, r.user_id, r.score, r.content, r.created_at,
				u.name AS user_name
			FROM reviews AS r
			JOIN users AS u ON r.user_id = u.id
			WHERE r.product_id = ?
			ORDER BY r.created_at DESC
			LIMIT ? OFFSET ?
		`
		rows, err := db.Query(query, productID, perPage, offset)
		if err != nil {
			log.Printf("Reviews list retrieval error (ProductID=%d): %v", productID, err)
			reviewsErr = err
			return
		}
		defer rows.Close()

		for rows.Next() {
			var r ReviewData
			if err := rows.Scan(
				&r.ID, &r.ProductID, &r.UserID, &r.Score, &r.Content, &r.CreatedAt,
				&r.UserName,
			); err != nil {
				log.Printf("Review data scan error (ProductID=%d): %v", productID, err)
				reviewsErr = err
				return
			}
			reviews = append(reviews, r)
		}
		reviewsErr = rows.Err()
	}()

	// Goroutine 2: Get total review count and average rating
	go func() {
		defer wg.Done()
		query := `
			SELECT COUNT(*), COALESCE(AVG(score), 0.0)
			FROM reviews
			WHERE product_id = ?
		`
		err := db.QueryRow(query, productID).Scan(&totalItems, &reviewAvg)
		if err != nil {
			log.Printf("Review statistics retrieval error (ProductID=%d): %v", productID, err)
			statsErr = err
		}
	}()

	// Wait for all goroutines to complete
	wg.Wait()
	if reviewsErr != nil || statsErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Use actual value if AVG (average rating) result is not NULL, otherwise use 0.0
	avg := 0.0
	if reviewAvg.Valid {
		avg = reviewAvg.Float64
	}
	// Round to 1 decimal place
	avg = math.Round(avg*10) / 10

	// Create pagination information
	totalPages := int(math.Ceil(float64(totalItems) / float64(perPage)))
	pagination := Pagination{ // Type defined in product.go file
		CurrentPage: page,
		PerPage:     perPage,
		TotalItems:  totalItems,
		TotalPages:  totalPages,
	}

	// Assemble final response
	response := ReviewsPageData{
		Reviews:    reviews,
		ReviewAvg:  avg,
		Pagination: pagination,
	}

	// Return response as JSON
	c.JSON(http.StatusOK, response)
}

// Function to create new review (POST /api/products/:id/reviews)
func CreateReviewHandler(c *gin.Context) {
	// Get "product ID" from path parameter (:id)
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		log.Printf("Invalid product ID format (review submission): %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get user information from HTTP request context
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("CreateReviewHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Login required to post review"})
		return
	}
	claims, ok := userClaims.(*JWTCustomClaims) // Type defined in auth.go file
	if !ok {
		log.Println("CreateReviewHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	userID := claims.UserID

	// Bind HTTP request body to ReviewRequest struct
	// Return error if required fields or format are incorrect
	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Review submission request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input (rating must be 1-5, comment required)"})
		return
	}
	// Also check Content field (comment) for whitespace
	if strings.TrimSpace(req.Content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter a comment"})
		return
	}

	// Register review in database
	db := database.GetDB()
	query := `
		INSERT INTO reviews (product_id, user_id, score, content)
		VALUES (?, ?, ?, ?)
	`
	_, err = db.Exec(query, productID, userID, req.Rating, req.Content)
	if err != nil {
		log.Printf("Review registration error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post review"})
		return
	}

	// Return successful registration response
	c.JSON(http.StatusCreated, gin.H{"message": "Review posted successfully"})
}
