package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/yukaty/go-trailhead/backend/internal/database"
	"github.com/yukaty/go-trailhead/backend/internal/handler"
	"github.com/yukaty/go-trailhead/backend/internal/middleware"
)

func main() {
	// Read environment variables
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("Error: JWT_SECRET environment variable not set")
	}

	// Run migrations
	runMigration()

	// Initialize database connection
	database.InitDB()

	// Create Gin default router
	router := gin.Default()

	// Configure CORS
	frontendOrigin := os.Getenv("FRONTEND_BASE_URL")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}
	router.Use(cors.New(cors.Config{
		// Allowed origins (where frontend is running)
		AllowOrigins: []string{frontendOrigin},

		// Allowed HTTP methods
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},

		// Allowed HTTP headers
		AllowHeaders: []string{"Content-Type"},

		// Allow cookie transmission (for authentication)
		AllowCredentials: true,

		// Cache time for preflight request results
		MaxAge: 12 * time.Hour,
	}))

	// Serve /uploads/ folder contents at URL path /uploads/
	// (Relative path from Dockerfile WORKDIR [/app])
	router.StaticFS("/uploads", http.Dir("uploads"))

	// Define routes under /api
	api := router.Group("/api")
	{
		api.GET("/sample", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"message": "Hello, World!",
			})
		})
		api.GET("/products", handler.GetProductsHandler)
		api.GET("/products/:id", handler.GetProductByIDHandler)
		api.GET("/home", handler.GetHomePageProductsHandler)
		api.GET("/products/:id/reviews", handler.GetReviewsHandler)
		api.POST("/users", handler.RegisterUserHandler)
		api.POST("/inquiries", handler.CreateInquiryHandler)
		api.POST("/orders/webhook", handler.StripeWebhookHandler)

		auth := api.Group("/auth")
		{
			auth.POST("/login", handler.LoginHandler)
			auth.POST("/logout", handler.LogoutHandler)
		}

		// Route group requiring authentication
		// These routes execute AuthMiddleware middleware function first
		authorized := api.Group("/")
		authorized.Use(middleware.AuthMiddleware())
		{
			authorized.GET("/users/me", handler.GetUserMeHandler)
			authorized.PUT("/users", handler.UpdateUserHandler)
			authorized.PUT("/users/password", handler.UpdatePasswordHandler)
			authorized.POST("/orders/checkout", handler.CreateCheckoutSessionHandler)
			authorized.GET("/orders", handler.GetOrdersHandler)
			authorized.POST("/products/:id/reviews", handler.CreateReviewHandler)
			authorized.GET("/favorites", handler.ListFavoritesHandler)
			authorized.POST("/favorites", handler.AddFavoriteHandler)
			authorized.GET("/favorites/:productId", handler.GetFavoriteStatusHandler)
			authorized.DELETE("/favorites/:productId", handler.RemoveFavoriteHandler)
		}

		// Route group requiring admin privileges
		// These routes execute AuthMiddleware and AdminAuthMiddleware middleware functions first
		admin := api.Group("/")
		admin.Use(middleware.AuthMiddleware())
		admin.Use(middleware.AdminAuthMiddleware())
		{
			admin.POST("/products", handler.AdminCreateProductHandler)
			admin.PUT("/products/:id", handler.AdminUpdateProductHandler)
			admin.DELETE("/products/:id", handler.AdminDeleteProductHandler)
			admin.GET("/inquiries", handler.ListInquiriesHandler)

		}
	}

	// Start Gin server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Starting Gin server on port " + port)
	router.Run(":" + port)
}

// Function to run migrations
func runMigration() {
	// Build DSN (Data Source Name) from environment variables
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSocketPath := os.Getenv("DB_SOCKET_PATH")
	var dsn string
	if dbSocketPath != "" {
		dsn = fmt.Sprintf("%s:%s@unix(%s)/%s?charset=utf8mb4&parseTime=true&loc=Local&multiStatements=true",
			dbUser, dbPass, dbSocketPath, dbName)
	} else {
		// In development environment, read DB_DSN environment variable directly
		dsn = os.Getenv("DB_DSN")
		if dsn == "" {
			log.Fatal("Error: Please set either DB_DSN (development) or DB_SOCKET_PATH (production) environment variable")
		}
	}

	log.Println("Starting migrations...")

	// Prepare database connection
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to prepare database connection: %v", err)
	}

	// Close database connection after migrations complete
	defer db.Close()

	// Attempt to connect to database
	err = db.Ping()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Create database driver for migrations
	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		log.Fatalf("Failed to create database driver for migrations: %v", err)
	}

	// Specify location of migration source (SQL files)
	// Relative path from Dockerfile.dev WORKDIR (/app)
	sourceURL := "file://db/migrations"

	// Create migration instance
	m, err := migrate.NewWithDatabaseInstance(sourceURL, "mysql", driver)
	if err != nil {
		log.Fatalf("Failed to set up migrations: %v", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Migrations completed successfully!")
}
