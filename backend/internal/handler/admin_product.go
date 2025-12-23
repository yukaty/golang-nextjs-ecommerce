package handler

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- Handler Definitions ---

// Function to create new product
func AdminCreateProductHandler(c *gin.Context) {
	// Get form data
	name := c.PostForm("name")
	description := c.PostForm("description")
	priceStr := c.PostForm("price")
	stockStr := c.PostForm("stock")
	isFeaturedStr := c.PostForm("isFeatured")

	// Get image file
	fileHeader, err := c.FormFile("imageFile")
	if err != nil {
		log.Printf("Image file retrieval error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product image is required"})
		return
	}

	// Validate input data
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	price, err := strconv.Atoi(priceStr)
	if err != nil || price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be an integer of 0 or greater"})
		return
	}
	stock, err := strconv.Atoi(stockStr)
	if err != nil || stock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock must be an integer of 0 or greater"})
		return
	}

	// Checkbox sends "on" when checked, empty string when unchecked
	isFeatured := isFeaturedStr == "on"

	// Set default value if description is empty
	if description == "" {
		description = "No product description available."
	}

	// Validate file format
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file format (jpg, jpeg, png only)"})
		return
	}

	// Generate unique file name (timestamp + random number + extension)
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	random := rand.Intn(10000)
	fileName := fmt.Sprintf("%d_%d%s", timestamp, random, ext)

	// File save path (relative path from Dockerfile WORKDIR [/app])
	savePath := filepath.Join("uploads", fileName)

	// Save file
	if err := c.SaveUploadedFile(fileHeader, savePath); err != nil {
		log.Printf("Image file save error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File upload failed"})
		return
	}
	log.Printf("Image file saved: %s", savePath)

	// Register product information in database
	db := database.GetDB()
	query := `
		INSERT INTO products (name, description, price, stock, image_url, is_featured)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err = db.Exec(query, name, description, price, stock, fileName, isFeatured)
	if err != nil {
		log.Printf("Product registration error: %v", err)
		// Delete saved file
		_ = os.Remove(savePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Return successful registration response
	c.JSON(http.StatusCreated, gin.H{"message": "Product registered successfully"})
}

// Function to edit product information
func AdminUpdateProductHandler(c *gin.Context) {
	// Get "product ID" from path parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("Invalid product ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get database connection
	db := database.GetDB()

	// Check if product exists and get existing image file name
	var currentImageUrl sql.NullString
	checkQuery := "SELECT image_url FROM products WHERE id = ?"
	err = db.QueryRow(checkQuery, id).Scan(&currentImageUrl)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Product to update not found: ID=%d", id)
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		} else {
			log.Printf("Existing product check error (ID=%d): %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		}
		return
	}

	// Get form data
	name := c.PostForm("name")
	description := c.PostForm("description")
	priceStr := c.PostForm("price")
	stockStr := c.PostForm("stock")
	isFeaturedStr := c.PostForm("isFeatured")

	// Get image file
	fileHeader, err := c.FormFile("imageFile")
	if err != nil && err != http.ErrMissingFile {
		log.Printf("Unexpected error during image file retrieval: %v", err)
	}
	// Flag to indicate if new file was uploaded
	newFileUploaded := fileHeader != nil

	// Validate input data
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	price, err := strconv.Atoi(priceStr)
	if err != nil || price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be an integer of 0 or greater"})
		return
	}
	stock, err := strconv.Atoi(stockStr)
	if err != nil || stock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock must be an integer of 0 or greater"})
		return
	}

	// Checkbox sends "on" when checked, empty string when unchecked
	isFeatured := isFeaturedStr == "on"

	// Set default value if description is empty
	if description == "" {
		description = "No product description available."
	}

	// Prepare image file save path and file names
	imageUrlToSave := currentImageUrl.String // File name to save in DB (default is existing file name)
	newFileName := ""                        // Newly saved file name (for deleting old file later)
	oldFileName := ""                        // Old file name to delete
	if currentImageUrl.Valid {
		oldFileName = currentImageUrl.String
	}

	if newFileUploaded {
		// Validate file format
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
		if !allowedExts[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file format (jpg, jpeg, png only)"})
			return
		}

		// Generate new file name
		timestamp := time.Now().UnixNano() / int64(time.Millisecond)
		random := rand.Intn(10000)
		newFileName = fmt.Sprintf("%d_%d%s", timestamp, random, ext)
		savePath := filepath.Join("uploads", newFileName)

		// Save new file
		if err := c.SaveUploadedFile(fileHeader, savePath); err != nil {
			log.Printf("New image file save error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "File upload failed"})
			return
		}
		log.Printf("New image file saved: %s", savePath)

		// Update file name to save in DB to new file name
		imageUrlToSave = newFileName
	}

	// Update database
	updateQuery := `
		UPDATE products SET
			name = ?, description = ?, price = ?, stock = ?, image_url = ?, is_featured = ?
		WHERE id = ?
	`
	_, err = db.Exec(
		updateQuery,
		name,
		description,
		price,
		stock,
		sql.NullString{String: imageUrlToSave, Valid: imageUrlToSave != ""},
		isFeatured,
		id,
	)
	if err != nil {
		log.Printf("Product update error (ID=%d): %v", id, err)
		// Delete newly saved file
		if newFileName != "" {
			_ = os.Remove(filepath.Join("uploads", newFileName))
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Delete old image file (if new file was saved and old file existed)
	if newFileUploaded && oldFileName != "" && oldFileName != newFileName {
		oldFilePath := filepath.Join("uploads", oldFileName)
		log.Printf("Deleting old image file: %s", oldFilePath)
		if err := os.Remove(oldFilePath); err != nil {
			log.Printf("Old image file deletion error: %v", err)
		}
	}

	// Return successful update response
	c.JSON(http.StatusOK, gin.H{"message": "Product updated successfully"})
}

// Function to delete product
func AdminDeleteProductHandler(c *gin.Context) {
	// Get "product ID" from path parameter (.../products/:id, the :id part)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("Invalid product ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get database connection
	db := database.GetDB()

	// Check if product exists and get existing image file name
	var imageUrlToDelete sql.NullString
	checkQuery := "SELECT image_url FROM products WHERE id = ?"
	err = db.QueryRow(checkQuery, id).Scan(&imageUrlToDelete)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Product to delete not found: ID=%d", id)
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		} else {
			log.Printf("Existing product check error (ID=%d): %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		}
		return
	}

	// Delete from database
	deleteQuery := "DELETE FROM products WHERE id = ?"
	_, err = db.Exec(deleteQuery, id)
	if err != nil {
		log.Printf("Product deletion error (ID=%d): %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Delete image file (if it exists)
	if imageUrlToDelete.Valid && imageUrlToDelete.String != "" {
		filePath := filepath.Join("uploads", imageUrlToDelete.String)
		log.Printf("Deleting associated image file: %s", filePath)
		if err := os.Remove(filePath); err != nil {
			log.Printf("Image file deletion error: %v", err)
		}
	}

	// Return successful deletion response
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}
