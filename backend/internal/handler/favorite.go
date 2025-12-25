package handler

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// Add favorite request struct
type AddFavoriteRequest struct {
	ProductID int `json:"productId" binding:"required"`
}

// Favorite status response struct
type FavoriteStatusResponse struct {
	IsFavorite bool `json:"isFavorite"`
}

// --- 2. Handler Definitions ---

// Function to get list of favorite products (GET /api/favorites)
func ListFavoritesHandler(c *gin.Context) {
	claims, ok := GetUserFromContext(c)
	if !ok {
		log.Println("ListFavoritesHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := claims.UserID

	// Get database connection
	db := database.GetDB()

	// Join favorites and products tables to get required information
	query := `
		SELECT
			p.id, p.name, p.price, p.image_url
		FROM favorites AS f
		JOIN products AS p ON f.product_id = p.id
		WHERE f.user_id = ?
		ORDER BY f.created_at DESC
	`
	rows, err := db.Query(query, userID)
	if err != nil {
		log.Printf("Favorites list retrieval error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}
	defer rows.Close()

	// Slice to store favorite products list
	favorites := []ProductListItem{} // Type defined in product.go file

	// Scan SQL execution results
	for rows.Next() {
		var p ProductListItem
		var imageUrl sql.NullString
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &imageUrl); err != nil {
			log.Printf("Favorites data scan error (UserID=%d): %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
			return
		}
		if imageUrl.Valid {
			p.ImageURL = &imageUrl.String
		}
		favorites = append(favorites, p)
	}
	if err = rows.Err(); err != nil {
		log.Printf("Row error during favorites data retrieval (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}

	// Return response as JSON
	c.JSON(http.StatusOK, favorites)
}

// Function to add product to favorites (POST /api/favorites)
func AddFavoriteHandler(c *gin.Context) {
	claims, ok := GetUserFromContext(c)
	if !ok {
		log.Println("AddFavoriteHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := claims.UserID

	// Bind HTTP request body to AddFavoriteRequest struct
	// Return error if required fields or format are incorrect
	var req AddFavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Add favorite request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	productID := req.ProductID

	// Register favorite information in database
	// INSERT IGNORE ignores UNIQUE constraint violations
	db := database.GetDB()
	query := "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)"
	_, err := db.Exec(query, userID, productID)
	if err != nil {
		log.Printf("Favorite registration error (UserID=%d, ProductID=%d): %v", userID, productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to favorites"})
		return
	}

	// Return successful registration response
	c.JSON(http.StatusOK, gin.H{"message": "Product added to favorites"})
}

// Function to check if specific product is favorited (GET /api/favorites/:productId)
func GetFavoriteStatusHandler(c *gin.Context) {
	claims, ok := GetUserFromContext(c)
	if !ok {
		log.Println("GetFavoriteStatusHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := claims.UserID

	productID, err := GetProductIDFromParam(c, "productId")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": ErrInvalidProductID})
		return
	}

	// Search favorites table
	db := database.GetDB()
	var count int
	query := "SELECT COUNT(*) FROM favorites WHERE user_id = ? AND product_id = ?"
	err = db.QueryRow(query, userID, productID).Scan(&count)
	if err != nil {
		log.Printf("Favorite status check error (UserID=%d, ProductID=%d): %v", userID, productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}

	// Assemble final response
	response := FavoriteStatusResponse{
		IsFavorite: count > 0,
	}

	// Return response as JSON
	c.JSON(http.StatusOK, response)
}

// Function to remove product from favorites (DELETE /api/favorites/:productId)
func RemoveFavoriteHandler(c *gin.Context) {
	claims, ok := GetUserFromContext(c)
	if !ok {
		log.Println("RemoveFavoriteHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := claims.UserID

	productID, err := GetProductIDFromParam(c, "productId")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": ErrInvalidProductID})
		return
	}

	// Delete favorite information from database
	db := database.GetDB()
	query := "DELETE FROM favorites WHERE user_id = ? AND product_id = ?"
	result, err := db.Exec(query, userID, productID)
	if err != nil {
		log.Printf("Favorite deletion error (UserID=%d, ProductID=%d): %v", userID, productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from favorites"})
		return
	}

	// Check number of deleted rows
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		log.Printf("Favorite to delete not found (UserID=%d, ProductID=%d)", userID, productID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Favorite not found"})
		return
	}

	// Return successful deletion response
	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}
