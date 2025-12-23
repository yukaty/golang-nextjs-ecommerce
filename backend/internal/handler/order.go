package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v83"
	"github.com/stripe/stripe-go/v83/checkout/session"
	"github.com/stripe/stripe-go/v83/webhook"

	"github.com/yukaty/go-trailhead/backend/internal/database"
)

// --- 1. Type Definitions (structs) ---

// Cart item struct
type CartItem struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Price    int    `json:"price"`
	ImageURL string `json:"imageUrl"`
	Quantity int    `json:"quantity"`
}

// Stripe Checkout session creation request struct
type CheckoutRequest struct {
	Items   []CartItem `json:"items"`
	Address string     `json:"address" binding:"required"`
}

// Product information response struct (for stock check and price calculation)
type productForOrder struct {
	ID    int
	Name  string
	Price int
	Stock int
}

// Order item struct
type OrderItem struct {
	ProductName string `json:"productName"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int    `json:"unitPrice"`
}

// Order information response struct
type OrderData struct {
	ID            int         `json:"id"`
	TotalPrice    int         `json:"totalPrice"`
	Status        string      `json:"status"`        // ENUM treated as string
	PaymentStatus string      `json:"paymentStatus"` // ENUM treated as string
	CreatedAt     time.Time   `json:"createdAt"`
	Items         []OrderItem `json:"items"` // Slice of order items
}

// Order and order items join record struct
type orderJoinRecord struct {
	ID            int
	TotalPrice    int
	Status        string
	PaymentStatus string
	CreatedAt     time.Time
	ProductName   string
	Quantity      int
	UnitPrice     int
}

// Order status (corresponding to orders table ENUM)
const (
	OrderStatusPending    = "Pending"
	OrderStatusProcessing = "Processing"
	// Define other statuses as needed
)

// Payment status (corresponding to orders table ENUM)
const (
	PaymentStatusUnpaid = "Unpaid"
	PaymentStatusPaid   = "Payment Successful"
	// Define other statuses as needed
)

// Shipping cost (in dollars)
const shippingCost = 500

// Initialize Stripe
func init() {
	// Get Stripe secret key from environment variable and set it
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	if stripe.Key == "" {
		log.Println("Warning: STRIPE_SECRET_KEY environment variable is not set")
	}
}

// --- 2. Handler Definitions ---

// Function to create Stripe Checkout session (POST /api/orders/checkout)
func CreateCheckoutSessionHandler(c *gin.Context) {
	// Bind HTTP request body to CheckoutRequest struct
	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Checkout request binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Get user information from HTTP request context
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("CreateCheckoutSessionHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	claims, ok := userClaims.(*JWTCustomClaims)
	if !ok {
		log.Println("CreateCheckoutSessionHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	userID := claims.UserID
	userEmail := claims.Email

	// Get database connection
	db := database.GetDB()

	productIDs := []interface{}{} // Slice to store product ID list from cart
	quantityMap := map[int]int{}  // Map to hold quantity per product ID
	for _, item := range req.Items {
		id, err := strconv.Atoi(item.ID)
		if err != nil {
			log.Printf("Invalid product ID format: %s", item.ID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID in cart"})
			return
		}
		productIDs = append(productIDs, id)
		quantityMap[id] = item.Quantity
	}

	// Get target product information from database (ID IN ...)
	// Dynamically generate placeholders based on number of product IDs
	placeholders := strings.Repeat("?,", len(productIDs)-1) + "?"
	query := fmt.Sprintf(`SELECT id, name, price, stock FROM products WHERE id IN (%s)`, placeholders)

	rows, err := db.Query(query, productIDs...)
	if err != nil {
		log.Printf("Product retrieval error during stock check: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	defer rows.Close()

	dbProducts := make(map[int]productForOrder) // Map with cart product IDs as keys
	shortageItems := []string{}                 // List of out-of-stock product names
	for rows.Next() {
		var p productForOrder
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock); err != nil {
			log.Printf("Product scan error during stock check: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
			return
		}
		dbProducts[p.ID] = p
		// Perform stock check
		if p.Stock < quantityMap[p.ID] {
			shortageItems = append(shortageItems, p.Name)
		}
	}
	if err = rows.Err(); err != nil {
		log.Printf("Row error during stock check: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Return error if cart product IDs don't exist in database
	if len(dbProducts) != len(productIDs) {
		log.Printf("Cart products not found: %v vs %v", len(dbProducts), len(productIDs))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Some cart products were not found"})
		return
	}
	// Return error if any products are out of stock
	if len(shortageItems) > 0 {
		errMsg := fmt.Sprintf("Out of stock products: %s", strings.Join(shortageItems, ", "))
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	// Start transaction to register order information in database
	tx, err := db.Begin()
	if err != nil {
		log.Printf("Transaction start error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	defer tx.Rollback() // Rollback on function exit (if not committed)

	// Calculate total price
	totalPrice := 0
	for _, item := range req.Items {
		id, _ := strconv.Atoi(item.ID)
		product := dbProducts[id]
		totalPrice += product.Price * item.Quantity
	}
	totalPrice += shippingCost // Add shipping cost

	// Insert into orders table
	orderQuery := `
		INSERT INTO orders (user_id, total_price, status, payment_status, shipping_address)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := tx.Exec(orderQuery, userID, totalPrice, OrderStatusPending, PaymentStatusUnpaid, req.Address)
	if err != nil {
		log.Printf("Order registration error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register order"})
		return
	}
	orderID, err := result.LastInsertId() // Get registered order ID
	if err != nil {
		log.Printf("Order ID retrieval error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register order"})
		return
	}

	// Insert into order_items table
	itemQuery := `
		INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
		VALUES (?, ?, ?, ?, ?)
	`
	stmt, err := tx.Prepare(itemQuery) // Use prepared statement
	if err != nil {
		log.Printf("Order items INSERT preparation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register order"})
		return
	}
	defer stmt.Close()

	for _, item := range req.Items {
		id, _ := strconv.Atoi(item.ID)
		product := dbProducts[id]
		_, err := stmt.Exec(orderID, product.ID, product.Name, item.Quantity, product.Price)
		if err != nil {
			log.Printf("Order items INSERT execution error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register order"})
			return
		}
	}

	// Create Stripe Checkout session
	lineItems := []*stripe.CheckoutSessionLineItemParams{}
	for _, item := range req.Items {
		id, _ := strconv.Atoi(item.ID)
		product := dbProducts[id]
		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String(string(stripe.CurrencyJPY)),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(product.Name),
				},
				UnitAmount: stripe.Int64(int64(product.Price)),
			},
			Quantity: stripe.Int64(int64(item.Quantity)),
		})
	}
	// Add shipping cost
	lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
		PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
			Currency: stripe.String(string(stripe.CurrencyJPY)),
			ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
				Name: stripe.String("Shipping"),
			},
			UnitAmount: stripe.Int64(int64(shippingCost)),
		},
		Quantity: stripe.Int64(1),
	})

	// Frontend base URL (to construct redirect destination)
	frontendBaseURL := os.Getenv("FRONTEND_BASE_URL")
	if frontendBaseURL == "" {
		frontendBaseURL = "http://localhost:3000"
	}

	params := &stripe.CheckoutSessionParams{
		LineItems: lineItems,
		Mode:      stripe.String(string(stripe.CheckoutSessionModePayment)), SuccessURL: stripe.String(fmt.Sprintf("%s/account?session_id={CHECKOUT_SESSION_ID}", frontendBaseURL)), CancelURL: stripe.String(fmt.Sprintf("%s/order-confirm", frontendBaseURL)), CustomerEmail: stripe.String(userEmail),
		Metadata: map[string]string{ // Information used in Stripe Webhook
			"orderId": strconv.FormatInt(orderID, 10),
			"userId":  strconv.Itoa(userID),
		},
	}

	s, err := session.New(params)
	if err != nil {
		log.Printf("Stripe Checkout session creation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "[backend] Failed to generate payment page"})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Transaction commit error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm order"})
		return
	}

	// Return Stripe Checkout session URL as response
	c.JSON(http.StatusOK, gin.H{"url": s.URL})
}

// Function to handle Stripe Webhook events (POST /api/orders/webhook)
func StripeWebhookHandler(c *gin.Context) {
	// Get Stripe Webhook signing secret
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if webhookSecret == "" {
		log.Println("Warning: STRIPE_WEBHOOK_SECRET environment variable is not set")
		c.Status(http.StatusInternalServerError)
		return
	}

	// Read HTTP request body
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Webhook request body read error: %v", err)
		c.Status(http.StatusBadRequest)
		return
	}

	// Verify signing secret and construct event
	signature := c.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEventWithOptions(
		payload,
		signature,
		webhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true, // Ignore errors from API version differences
		},
	)
	if err != nil {
		log.Printf("Webhook signature verification error: %v", err)
		c.Status(http.StatusBadRequest) // Invalid signature
		return
	}

	// Handle checkout.session.completed (payment successful) event
	if event.Type == "checkout.session.completed" {
		var session stripe.CheckoutSession
		// Unmarshal event data to CheckoutSession object
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			log.Printf("Webhook event data parsing error: %v", err)
			c.Status(http.StatusBadRequest)
			return
		}

		// Get orderId and userId from metadata
		orderIDStr, okOrderId := session.Metadata["orderId"]
		userIDStr, okUserId := session.Metadata["userId"]
		if !okOrderId || !okUserId {
			log.Printf("Webhook metadata missing: orderId=%s, userId=%s", orderIDStr, userIDStr)
			c.Status(http.StatusBadRequest)
			return
		}
		orderID, errOrderId := strconv.ParseInt(orderIDStr, 10, 64)
		userID, errUserId := strconv.Atoi(userIDStr)
		if errOrderId != nil || errUserId != nil {
			log.Printf("Webhook metadata format error: orderId=%s, userId=%s", orderIDStr, userIDStr)
			c.Status(http.StatusBadRequest)
			return
		}

		// Start transaction to update database
		log.Printf("Webhook received (checkout.session.completed): OrderID=%d, UserID=%d", orderID, userID)
		db := database.GetDB()
		tx, err := db.Begin()
		if err != nil {
			log.Printf("Webhook: Transaction start error: %v", err)
			c.Status(http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		// Update order status
		// (For idempotency, do nothing if payment status is already "Payment Successful")
		updateOrderQuery := `
			UPDATE orders
			SET status = ?, payment_status = ?
			WHERE id = ? AND user_id = ? AND payment_status != ?
		`
		result, err := tx.Exec(updateOrderQuery, OrderStatusProcessing, PaymentStatusPaid, orderID, userID, PaymentStatusPaid)
		if err != nil {
			log.Printf("Webhook: Order status update error (OrderID=%d): %v", orderID, err)
			c.Status(http.StatusInternalServerError)
			return
		}
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			log.Printf("Webhook: No order status to update (OrderID=%d, UserID=%d)", orderID, userID)
			// Return success to Stripe (event was received)
			c.Status(http.StatusOK)
			return
		}

		// Get ordered products and quantities
		itemsQuery := "SELECT product_id, quantity FROM order_items WHERE order_id = ?"
		rows, err := tx.Query(itemsQuery, orderID)
		if err != nil {
			log.Printf("Webhook: Order items retrieval error (OrderID=%d): %v", orderID, err)
			c.Status(http.StatusInternalServerError)
			return
		}
		type orderItem struct{ ProductID, Quantity int }
		itemsToUpdate := []orderItem{}
		for rows.Next() {
			var item orderItem
			if err := rows.Scan(&item.ProductID, &item.Quantity); err != nil {
				log.Printf("Webhook: Order items scan error (OrderID=%d): %v", orderID, err)
				c.Status(http.StatusInternalServerError)
				rows.Close()
				return
			}
			itemsToUpdate = append(itemsToUpdate, item)
		}
		rows.Close()
		if err = rows.Err(); err != nil {
			log.Printf("Webhook: Order items row error (OrderID=%d): %v", orderID, err)
			c.Status(http.StatusInternalServerError)
			return
		}

		// Prepare SQL statement to update stock
		updateStockQuery := `
			UPDATE products
			SET stock = stock - ?, sales_count = sales_count + ?
			WHERE id = ? AND stock >= ? -- Re-verify sufficient stock (for safety)
		`
		stmt, err := tx.Prepare(updateStockQuery)
		if err != nil {
			log.Printf("Webhook: Stock update preparation error: %v", err)
			c.Status(http.StatusInternalServerError)
			return
		}
		defer stmt.Close()

		// Update stock for each product
		for _, item := range itemsToUpdate {
			res, err := stmt.Exec(item.Quantity, item.Quantity, item.ProductID, item.Quantity)
			if err != nil {
				log.Printf("Webhook: Stock update execution error (ProductID=%d): %v", item.ProductID, err)
				c.Status(http.StatusInternalServerError)
				return
			}
			affected, _ := res.RowsAffected()
			if affected == 0 {
				log.Printf("Webhook: Insufficient stock or product not found (ProductID=%d)", item.ProductID)
				c.Status(http.StatusInternalServerError)
				return
			}
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			log.Printf("Webhook: Transaction commit error (OrderID=%d): %v", orderID, err)
			c.Status(http.StatusInternalServerError)
			return
		}

		log.Printf("Webhook processing successful (OrderID=%d)", orderID)
	} else {
		// Ignore events other than checkout.session.completed (but log them)
		log.Printf("Webhook received (ignoring event): %s", event.Type)
	}

	// Notify Stripe that webhook event was successfully received
	c.Status(http.StatusOK)
}

// Function to get order history
func GetOrdersHandler(c *gin.Context) {
	// Get user information from HTTP request context
	userClaims, exists := c.Get("user")
	if !exists {
		log.Println("GetOrdersHandler: User information not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	claims, ok := userClaims.(*JWTCustomClaims) // Type defined in auth.go file
	if !ok {
		log.Println("GetOrdersHandler: User information type assertion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	userID := claims.UserID

	// Get order data from database
	// Join orders and order_items tables, filter by user ID, sort by creation time and order item ID
	db := database.GetDB()
	query := `
		SELECT
			o.id, o.total_price, o.status, o.payment_status, o.created_at,
			oi.product_name, oi.quantity, oi.unit_price
		FROM orders AS o
		JOIN order_items AS oi ON o.id = oi.order_id
		WHERE o.user_id = ?
		ORDER BY o.created_at DESC, oi.id ASC
	`
	rows, err := db.Query(query, userID)
	if err != nil {
		log.Printf("Order history retrieval error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}
	defer rows.Close()

	// Map to store order data
	ordersMap := make(map[int]*OrderData)
	// Variable to temporarily store scan results
	var record orderJoinRecord

	// Scan SQL execution results
	for rows.Next() {
		err := rows.Scan(
			&record.ID, &record.TotalPrice, &record.Status, &record.PaymentStatus, &record.CreatedAt,
			&record.ProductName, &record.Quantity, &record.UnitPrice,
		)
		if err != nil {
			log.Printf("Order history scan error (UserID=%d): %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
			return
		}

		// Use map to group data by order ID (key: order.id, value: pointer to OrderData struct)
		orderData, exists := ordersMap[record.ID]
		if !exists {
			// If this order ID isn't in map yet, create new OrderData struct pointer and add it
			orderData = &OrderData{
				ID:            record.ID,
				TotalPrice:    record.TotalPrice,
				Status:        record.Status,
				PaymentStatus: record.PaymentStatus,
				CreatedAt:     record.CreatedAt,
				Items:         []OrderItem{}, // Initialize with empty slice
			}
			ordersMap[record.ID] = orderData
		}

		// Create order item (OrderItem struct) from current record
		item := OrderItem{
			ProductName: record.ProductName,
			Quantity:    record.Quantity,
			UnitPrice:   record.UnitPrice,
		}
		// Add order item to Items field
		orderData.Items = append(orderData.Items, item)
	}
	if err = rows.Err(); err != nil {
		log.Printf("Order history row error (UserID=%d): %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error occurred"})
		return
	}

	// Create final response slice from map
	orders := make([]OrderData, 0, len(ordersMap))
	for _, order := range ordersMap {
		orders = append(orders, *order) // Add pointer contents to slice
	}

	// Sort by creation time (newest first)
	sort.Slice(orders, func(i, j int) bool {
		return orders[i].CreatedAt.After(orders[j].CreatedAt)
	})

	// Return response as JSON
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}
