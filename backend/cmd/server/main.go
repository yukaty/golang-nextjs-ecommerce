package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Create a default Gin router
	router := gin.Default()

	// Define routes under /api
	api := router.Group("/api")
	{
		api.GET("/sample", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"message": "Hello, World!",
			})
		})
	}

	// Start the Gin server on port 8080
	log.Println("Starting Gin server on port 8080")
	router.Run(":8080")
}
