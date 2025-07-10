package middlewares

import (
    "net/http"
    "time"
    "strings"
    "github.com/project_capstone/WareHouse/services"
    "github.com/gin-gonic/gin"
)

var HashKey = []byte("very-secret")
var BlockKey = []byte("a-lot-secret1234")

// Authorization เป็นฟังก์ชั่นตรวจเช็ค Cookie
func Authorizes() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Fetch the Authorization header
        clientToken := c.Request.Header.Get("Authorization")

        // Check if the header exists
        if clientToken == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No Authorization header provided"})
            return
        }

        // Split the header to check for "Bearer" prefix
        tokenParts := strings.Fields(clientToken)
        if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error":"Incorrect Authorization header provided"})
            return
        }

        // Extract the token part from the header
        clientToken = tokenParts[1]

        // Initialize the JWT Wrapper
        jwtWrapper := services.JwtWrapper{
            SecretKey: "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx", // Ideally, use an environment variable here
            Issuer:    "AuthService",
        }

        claims, err := jwtWrapper.ValidateToken(clientToken)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
            return
        }

        // Check if the token is expired
        if time.Now().Unix() > claims.ExpiresAt {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is expired"})
            return
        }

        // Add the email to the context for use in subsequent handlers
        c.Set("email", claims.Email)

        c.Next()
    }
}