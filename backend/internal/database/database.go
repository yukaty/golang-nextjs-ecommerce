package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

// Function to initialize database connection and store in global variable db
func InitDB() {
	// Build DSN (Data Source Name) from environment variables
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSocketPath := os.Getenv("DB_SOCKET_PATH")
	var dsn string
	if dbSocketPath != "" {
		dsn = fmt.Sprintf("%s:%s@unix(%s)/%s?charset=utf8mb4&parseTime=true&loc=Local",
			dbUser, dbPass, dbSocketPath, dbName)
	} else {
		// In development environment, read DB_DSN environment variable directly
		dsn = os.Getenv("DB_DSN")
		if dsn == "" {
			log.Fatal("Error: Please set either DB_DSN (development) or DB_SOCKET_PATH (production) environment variable")
		}
	}

	// Prepare database connection
	conn, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to prepare database connection: %v", err)
	}

	// Attempt to connect to database
	err = conn.Ping()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Successfully connected to database!")
	// Store connection in global variable db
	db = conn
}

// Function to return initialized database connection
func GetDB() *sql.DB {
	if db == nil {
		log.Fatal("Database not initialized")
	}
	return db
}
