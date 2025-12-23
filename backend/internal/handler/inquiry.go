package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// Inquiry registration request struct
type InquiryRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required"`
}

// Inquiry information response struct
type Inquiry struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// --- 2. Handler Definitions ---

// Function to create new inquiry
func CreateInquiryHandler(c *gin.Context) {
	var req InquiryRequest
	// Bind HTTP request body to InquiryRequest struct
	// Return error if required fields or format are incorrect
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Inquiry request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Register inquiry information in database
	db := database.GetDB()
	query := "INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)"
	_, err := db.Exec(query, req.Name, req.Email, req.Message)
	if err != nil {
		log.Printf("Inquiry registration error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit inquiry"})
		return
	}

	// Return successful registration response
	c.JSON(http.StatusOK, gin.H{"message": "Inquiry received"})
}

// Function to return list of inquiries
func ListInquiriesHandler(c *gin.Context) {
	// Get database connection
	db := database.GetDB()

	// Get all inquiries sorted by creation time (newest first)
	query := "SELECT id, name, email, message, created_at FROM inquiries ORDER BY created_at DESC"
	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Inquiry list retrieval error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve inquiry list"})
		return
	}
	defer rows.Close()

	// Scan SQL execution results
	inquiries := []Inquiry{}
	for rows.Next() {
		var i Inquiry
		if err := rows.Scan(&i.ID, &i.Name, &i.Email, &i.Message, &i.CreatedAt); err != nil {
			log.Printf("Inquiry data scan error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve inquiry list"})
			return
		}
		inquiries = append(inquiries, i)
	}
	if err = rows.Err(); err != nil {
		log.Printf("Row error during inquiry data retrieval: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve inquiry list"})
		return
	}

	// Return response as JSON
	c.JSON(http.StatusOK, inquiries)
}
