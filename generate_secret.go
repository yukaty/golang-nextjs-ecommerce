package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func main() {
	// Create a byte slice
	b := make([]byte, 64)

	// Generate random bytes
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}

	// Print the hex-encoded string
	fmt.Println(hex.EncodeToString(b))
}
