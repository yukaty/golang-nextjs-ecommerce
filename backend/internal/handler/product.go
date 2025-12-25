package handler

import (
	"database/sql"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---
// Define JSON structure expected by frontend using Go structs
// `json:"..."` tags map Go field names (capitalized) to JSON key names (lowercase)

// Product list item struct
type ProductListItem struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Price       int       `json:"price"`
	Stock       int       `json:"stock"`
	ImageURL    *string   `json:"image_url"`
	ReviewAvg   float64   `json:"review_avg"`
	ReviewCount int       `json:"review_count"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Product detail struct
type Product struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"` // Nullable
	Price       int       `json:"price"`
	Stock       int       `json:"stock"`
	ImageURL    *string   `json:"image_url"` // Nullable
	SalesCount  int       `json:"sales_count"`
	IsFeatured  bool      `json:"is_featured"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Pagination information struct
type Pagination struct {
	CurrentPage int `json:"currentPage"`
	PerPage     int `json:"perPage"`
	TotalItems  int `json:"totalItems"`
	TotalPages  int `json:"totalPages"`
}

// Product list page response struct
type ProductsPageData struct {
	Products   []ProductListItem `json:"products"`
	Pagination Pagination        `json:"pagination"`
}

// Homepage product struct
type HomePageProduct struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Price       int     `json:"price"`
	ImageURL    *string `json:"image_url"`
	ReviewAvg   float64 `json:"review_avg"`
	ReviewCount int     `json:"review_count"`
}

// Homepage response struct
type HomePageData struct {
	Featured    []HomePageProduct `json:"featured"`
	NewArrivals []HomePageProduct `json:"newArrivals"`
	BestSellers []HomePageProduct `json:"bestSellers"`
}

// --- 2. Handler Definitions ---

// Function to return product list
func GetProductsHandler(c *gin.Context) {

	// Get "page number" from query parameter (?page=X)
	// Set default to 1 if query parameter doesn't exist or has invalid value
	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	// Get "items per page" from query parameter (?perPage=X)
	// Set default to 16 if query parameter doesn't exist or has invalid value
	perPageStr := c.DefaultQuery("perPage", "16")
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 {
		perPage = 16
	}

	// Get "sort order" from query parameter (?sort=X) (default is new arrivals)
	sort := c.DefaultQuery("sort", "new")

	// Build sort condition (ORDER BY clause)
	var orderByClause string
	switch sort {
	case "priceAsc": // Price low to high
		orderByClause = "ORDER BY p.price ASC"
	case "new": // New arrivals
		orderByClause = "ORDER BY p.created_at DESC"
	default:
		// Default to new arrivals for any other value
		orderByClause = "ORDER BY p.created_at DESC"
	}

	// Get "search keyword" from query parameter (?keyword=X)
	keyword := c.DefaultQuery("keyword", "")

	// Build search condition (WHERE clause)
	var whereClause string
	var whereParams []interface{} // Slice to store parameters for WHERE clause
	if keyword != "" {
		whereClause = "WHERE (p.name LIKE ? OR p.description LIKE ?)"
		// Add parameter (%keyword%) to slice
		likeKeyword := "%" + keyword + "%"
		whereParams = append(whereParams, likeKeyword, likeKeyword)
	}

	// Get database connection
	db := database.GetDB()

	// Execute SQL query to get total product count
	var totalItems int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products AS p %s", whereClause)

	// Expand slice contents with whereParams... and pass to QueryRow() method
	err = db.QueryRow(countQuery, whereParams...).Scan(&totalItems)
	if err != nil {
		log.Printf("Product count retrieval error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}

	// Calculate pagination information
	totalPages := int(math.Ceil(float64(totalItems) / float64(perPage)))
	offset := (page - 1) * perPage

	// Prepare SQL query to get product list
	query := fmt.Sprintf(`
			SELECT
				p.id,
				p.name,
				p.price,
				p.stock,
				p.image_url,
				p.updated_at,
				COALESCE(ROUND(AVG(r.score), 1), 0.0) AS review_avg,
				COALESCE(COUNT(r.id), 0) AS review_count
			FROM products AS p
			LEFT JOIN reviews AS r ON p.id = r.product_id
			%s
			GROUP BY p.id, p.name, p.price, p.stock, p.image_url, p.updated_at
			%s
			LIMIT ? OFFSET ?
		`, whereClause, orderByClause)

	// Prepare parameters to pass to SQL query
	queryParams := append(whereParams, perPage, offset)

	// Execute SQL query
	rows, err := db.Query(query, queryParams...)
	if err != nil {
		log.Printf("Product list retrieval error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}
	defer rows.Close()

	// Slice to store product data
	products := []ProductListItem{}

	// Scan SQL query results
	for rows.Next() {
		var p ProductListItem
		// Use sql.NullString variable imageUrl to handle NULL image_url column
		var imageUrl sql.NullString
		// Map retrieved data to ProductListItem struct fields
		// Scan image_url column into imageUrl variable
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Price,
			&p.Stock,
			&imageUrl,
			&p.UpdatedAt,
			&p.ReviewAvg,
			&p.ReviewCount,
		); err != nil {
			log.Printf("Product data scan error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
			return
		}
		// Only set ProductListItem ImageURL field if imageUrl variable is not NULL
		if imageUrl.Valid {
			p.ImageURL = &imageUrl.String
		}
		products = append(products, p)
	}
	if err = rows.Err(); err != nil {
		log.Printf("Row error during product list data retrieval: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}
	// Create pagination information
	pagination := Pagination{
		CurrentPage: page,       // Current page
		PerPage:     perPage,    // Items per page
		TotalItems:  totalItems, // Total products
		TotalPages:  totalPages, // Total pages
	}

	// Assemble final response
	response := ProductsPageData{
		Products:   products,
		Pagination: pagination,
	}

	// Return response as JSON
	c.JSON(http.StatusOK, response)
}

// Function to return product details
func GetProductByIDHandler(c *gin.Context) {
	id, err := GetProductIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": ErrInvalidProductID})
		return
	}

	// Get database connection
	db := database.GetDB()

	// Prepare SQL query to get product details
	query := `
		SELECT
			id, name,
			description,
			price,
			stock,
			image_url,
			sales_count,
			is_featured,
			created_at,
			updated_at
		FROM products
		WHERE id = ?
	`
	var p Product
	var description sql.NullString
	var imageUrl sql.NullString

	// Execute SQL query and scan results
	err = db.QueryRow(query, id).Scan(
		&p.ID,
		&p.Name,
		&description,
		&p.Price,
		&p.Stock,
		&imageUrl,
		&p.SalesCount,
		&p.IsFeatured,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Product not found: ID=%d", id)
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		} else {
			log.Printf("Product retrieval error (ID=%d): %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		}
		return
	}

	// Only set Product struct fields if description and imageUrl variables are not NULL
	if description.Valid {
		p.Description = &description.String
	}
	if imageUrl.Valid {
		p.ImageURL = &imageUrl.String
	}

	// Return response as JSON
	c.JSON(http.StatusOK, p)
}

// Function to return homepage product list
func GetHomePageProductsHandler(c *gin.Context) {
	// Get database connection
	db := database.GetDB()

	// Slices to store data for each section
	var featured, newArrivals, bestSellers []HomePageProduct
	// Variables for error handling
	var featuredErr, newArrivalsErr, bestSellersErr error
	// WaitGroup to wait for goroutine completion
	var wg sync.WaitGroup

	// Add 3 to counter to run 3 processes concurrently
	wg.Add(3)

	// Goroutine 1: Get featured products (Pick Up)
	go func() {
		defer wg.Done() // Decrement counter when processing is complete
		query := `
			SELECT
				id,
				name,
				price,
				image_url
			FROM products
			ORDER BY sales_count DESC
			LIMIT 3
		`
		rows, err := db.Query(query)
		if err != nil {
			log.Printf("Featured products retrieval error: %v", err)
			featuredErr = err
			return
		}
		defer rows.Close()

		for rows.Next() {
			var p HomePageProduct
			var imageUrl sql.NullString
			if err := rows.Scan(
				&p.ID,
				&p.Name,
				&p.Price,
				&imageUrl,
			); err != nil {
				log.Printf("Featured products scan error: %v", err)
				featuredErr = err
				return
			}
			if imageUrl.Valid {
				p.ImageURL = &imageUrl.String
			}
			p.ReviewAvg = 0.0 // Initialize to 0.0 as average rating is not needed for featured products (Pick Up)
			p.ReviewCount = 0 // Initialize to 0 as review count is not needed for featured products (Pick Up)
			featured = append(featured, p)
		}
		featuredErr = rows.Err()
	}()

	// Goroutine 2: Get new arrivals products (New Arrivals)
	go func() {
		defer wg.Done()
		query := `
			SELECT
				p.id,
				p.name,
				p.price,
				p.image_url,
				COALESCE(ROUND(AVG(r.score), 1), 0.0) AS review_avg,
				COALESCE(COUNT(r.id), 0) AS review_count
			FROM products AS p
			LEFT JOIN reviews AS r ON p.id = r.product_id
			GROUP BY p.id, p.name, p.price, p.image_url, p.created_at
			ORDER BY p.created_at DESC
			LIMIT 4
		`
		rows, err := db.Query(query)
		if err != nil {
			log.Printf("New arrivals retrieval error: %v", err)
			newArrivalsErr = err
			return
		}
		defer rows.Close()

		for rows.Next() {
			var p HomePageProduct
			var imageUrl sql.NullString
			if err := rows.Scan(
				&p.ID,
				&p.Name,
				&p.Price,
				&imageUrl,
				&p.ReviewAvg,
				&p.ReviewCount,
			); err != nil {
				log.Printf("New arrivals scan error: %v", err)
				newArrivalsErr = err
				return
			}
			if imageUrl.Valid {
				p.ImageURL = &imageUrl.String
			}
			newArrivals = append(newArrivals, p)
		}
		newArrivalsErr = rows.Err()
	}()

	// Goroutine 3: Get hot items products (Hot Items)
	go func() {
		defer wg.Done()
		// Use ORDER BY RAND() to get random selection
		query := `
			SELECT
				p.id,
				p.name,
				p.price,
				p.image_url,
				COALESCE(ROUND(AVG(r.score), 1), 0.0) AS review_avg,
				COALESCE(COUNT(r.id), 0) AS review_count
			FROM products AS p
			LEFT JOIN reviews AS r ON p.id = r.product_id
			WHERE p.is_featured = true
			GROUP BY p.id, p.name, p.price, p.image_url
			ORDER BY RAND()
			LIMIT 4
		`
		rows, err := db.Query(query)
		if err != nil {
			log.Printf("Hot items retrieval error: %v", err)
			bestSellersErr = err
			return
		}
		defer rows.Close()

		for rows.Next() {
			var p HomePageProduct
			var imageUrl sql.NullString
			if err := rows.Scan(
				&p.ID,
				&p.Name,
				&p.Price,
				&imageUrl,
				&p.ReviewAvg,
				&p.ReviewCount,
			); err != nil {
				log.Printf("Hot items scan error: %v", err)
				bestSellersErr = err
				return
			}
			if imageUrl.Valid {
				p.ImageURL = &imageUrl.String
			}
			bestSellers = append(bestSellers, p)
		}
		bestSellersErr = rows.Err()
	}()

	// Wait for all goroutines to complete
	wg.Wait()

	// Return 500 error if any goroutine encountered an error
	if featuredErr != nil || newArrivalsErr != nil || bestSellersErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": ErrServerError})
		return
	}

	// Assemble final response
	response := HomePageData{
		Featured:    featured,
		NewArrivals: newArrivals,
		BestSellers: bestSellers,
	}

	// Return response as JSON
	c.JSON(http.StatusOK, response)
}
