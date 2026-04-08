package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/checkout/session"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
	_ "modernc.org/sqlite"
)

type config struct {
	ListenAddr          string
	SQLitePath          string
	CORSOrigins         []string
	GoogleSpreadsheetID string
	GoogleCredsPath     string
	GoogleSheetName     string
	SMTPHost            string
	SMTPPort            string
	SMTPUser            string
	SMTPPass            string
	SMTPFrom            string
	AdminEmailTo        string
	ListMonkBaseURL          string
	ListMonkUser             string
	ListMonkPass             string
	ListMonkListIDSponsors   int
	ListMonkListIDMembers    int
	RateLimitPerMinute       int
	StripeSecretKey          string
	StripeDonateSuccessURL   string
	StripeDonateCancelURL    string
	DonationGoalCents        int64
}

func loadConfig() config {
	c := config{
		ListenAddr:          getEnv("LISTEN_ADDR", "127.0.0.1:8080"),
		SQLitePath:          getEnv("SQLITE_PATH", "./data/membership.db"),
		GoogleSpreadsheetID: os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID"),
		GoogleCredsPath:     firstNonEmpty(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"), os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_PATH")),
		GoogleSheetName:     getEnv("GOOGLE_SHEET_NAME", "Sheet1"),
		SMTPHost:            os.Getenv("SMTP_HOST"),
		SMTPPort:            getEnv("SMTP_PORT", "587"),
		SMTPUser:            os.Getenv("SMTP_USER"),
		SMTPPass:            os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:            os.Getenv("SMTP_FROM"),
		AdminEmailTo:        os.Getenv("ADMIN_EMAIL_TO"),
		ListMonkBaseURL:        strings.TrimRight(os.Getenv("LISTMONK_BASE_URL"), "/"),
		ListMonkUser:           os.Getenv("LISTMONK_ADMIN_USER"),
		ListMonkPass:           os.Getenv("LISTMONK_ADMIN_PASS"),
		ListMonkListIDSponsors: atoiDef(os.Getenv("LISTMONK_LIST_ID_SPONSORS"), 0),
		ListMonkListIDMembers:  atoiDef(os.Getenv("LISTMONK_LIST_ID_MEMBERS"), 0),
		RateLimitPerMinute:     atoiDef(os.Getenv("RATE_LIMIT_PER_MINUTE"), 30),
		StripeSecretKey:        os.Getenv("STRIPE_SECRET_KEY"),
		StripeDonateSuccessURL: getEnv("STRIPE_DONATE_SUCCESS_URL", "https://fairlinked.eu/donate/?payment=success"),
		StripeDonateCancelURL:  getEnv("STRIPE_DONATE_CANCEL_URL", "https://fairlinked.eu/donate/?payment=cancelled"),
		DonationGoalCents:      int64(atoiDef(os.Getenv("DONATION_GOAL_CENTS"), 8000000)),
	}
	if co := os.Getenv("CORS_ORIGINS"); co != "" {
		for _, p := range strings.Split(co, ",") {
			p = strings.TrimSpace(p)
			if p != "" {
				c.CORSOrigins = append(c.CORSOrigins, p)
			}
		}
	}
	return c
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func atoiDef(s string, def int) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

type ApplicationRequest struct {
	MembershipClass  string `json:"membership_class"`
	FirstName        string `json:"first_name"`
	LastName         string `json:"last_name"`
	BusinessName     string `json:"business_name"`
	Country          string `json:"country"`
	MembershipTier   string `json:"membership_tier"`
	Email            string `json:"email"`
	MarketingConsent bool   `json:"marketing_consent"`
	PrivacyConsent   bool   `json:"privacy_consent"`
	Honeypot         string `json:"company_website"`
}

func (r *ApplicationRequest) validate() error {
	if r.Honeypot != "" {
		return errors.New("rejected")
	}
	r.MembershipClass = strings.ToLower(strings.TrimSpace(r.MembershipClass))
	if r.MembershipClass != "full" {
		return errors.New("membership_class must be full")
	}
	r.Email = strings.TrimSpace(r.Email)
	if r.Email == "" || !strings.Contains(r.Email, "@") {
		return errors.New("valid email required")
	}
	r.FirstName = strings.TrimSpace(r.FirstName)
	r.LastName = strings.TrimSpace(r.LastName)
	r.BusinessName = strings.TrimSpace(r.BusinessName)
	r.Country = strings.TrimSpace(strings.ToUpper(r.Country))
	if len(r.Country) != 2 {
		return errors.New("country must be ISO 3166-1 alpha-2")
	}
	if r.FirstName == "" || r.LastName == "" {
		return errors.New("first_name and last_name required")
	}
	if !r.PrivacyConsent {
		return errors.New("privacy_consent required")
	}
	r.MembershipTier = strings.TrimSpace(r.MembershipTier)
	allowed := map[string]bool{"individual": true, "business": true, "toolmaker": true}
	if !allowed[r.MembershipTier] {
		return errors.New("invalid membership_tier")
	}
	return nil
}

func initDB(path string) (*sql.DB, error) {
	dir := filepath.Dir(path)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
	}
	db, err := sql.Open("sqlite", path+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, err
	}
	schema := `CREATE TABLE IF NOT EXISTS membership_applications (
		id TEXT PRIMARY KEY,
		created_at TEXT NOT NULL,
		payload_json TEXT NOT NULL,
		email TEXT NOT NULL,
		membership_class TEXT NOT NULL,
		membership_tier TEXT,
		country TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_membership_email ON membership_applications(email);
	CREATE TABLE IF NOT EXISTS donations (
		id TEXT PRIMARY KEY,
		amount_cents INTEGER NOT NULL,
		interval TEXT NOT NULL,
		currency TEXT DEFAULT 'eur',
		stripe_session_id TEXT,
		confirmed INTEGER DEFAULT 0,
		created_at TEXT NOT NULL
	);`
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}

	migrations := []string{
		"ALTER TABLE membership_applications ADD COLUMN verification_code TEXT DEFAULT ''",
		"ALTER TABLE membership_applications ADD COLUMN verified INTEGER DEFAULT 0",
		"ALTER TABLE membership_applications ADD COLUMN verify_attempts INTEGER DEFAULT 0",
	}
	for _, m := range migrations {
		_, _ = db.Exec(m)
	}

	return db, nil
}

type rateLimiter struct {
	mu    sync.Mutex
	hits  map[string][]time.Time
	limit int
}

func newRateLimiter(perMinute int) *rateLimiter {
	if perMinute < 1 {
		perMinute = 30
	}
	return &rateLimiter{hits: make(map[string][]time.Time), limit: perMinute}
}

func (r *rateLimiter) allow(ip string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	cut := now.Add(-time.Minute)
	var kept []time.Time
	for _, t := range r.hits[ip] {
		if t.After(cut) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= r.limit {
		return false
	}
	kept = append(kept, now)
	r.hits[ip] = kept
	return true
}

func clientIP(r *http.Request) string {
	if x := r.Header.Get("X-Forwarded-For"); x != "" {
		parts := strings.Split(x, ",")
		return strings.TrimSpace(parts[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

func main() {
	cfg := loadConfig()
	db, err := initDB(cfg.SQLitePath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if cfg.StripeSecretKey != "" {
		stripe.Key = cfg.StripeSecretKey
		log.Println("stripe configured")
	}

	rl := newRateLimiter(cfg.RateLimitPerMinute)
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/capture-lead", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if !rl.allow(clientIP(r)) {
			http.Error(w, "rate limit", http.StatusTooManyRequests)
			return
		}
		var lead struct {
			Email           string `json:"email"`
			FirstName       string `json:"first_name"`
			LastName        string `json:"last_name"`
			BusinessName    string `json:"business_name"`
			Country         string `json:"country"`
			MembershipClass string `json:"membership_class"`
			Honeypot        string `json:"company_website"`
		}
		if err := json.NewDecoder(r.Body).Decode(&lead); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		if lead.Honeypot != "" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		lead.Email = strings.TrimSpace(lead.Email)
		if lead.Email == "" || !strings.Contains(lead.Email, "@") {
			http.Error(w, "valid email required", http.StatusBadRequest)
			return
		}
		lead.MembershipClass = strings.ToLower(strings.TrimSpace(lead.MembershipClass))
		lead.FirstName = strings.TrimSpace(lead.FirstName)
		lead.LastName = strings.TrimSpace(lead.LastName)
		lead.Country = strings.TrimSpace(strings.ToUpper(lead.Country))
		go func() {
			partial := &ApplicationRequest{
				MembershipClass: lead.MembershipClass,
				FirstName:       lead.FirstName,
				LastName:        lead.LastName,
				BusinessName:    strings.TrimSpace(lead.BusinessName),
				Country:         lead.Country,
				Email:           lead.Email,
				PrivacyConsent:  true,
			}
			if cfg.ListMonkBaseURL != "" && cfg.ListMonkUser != "" && cfg.ListMonkPass != "" {
				listID := cfg.ListMonkListIDMembers
				if listID > 0 {
					if err := listmonkUpsert(cfg, listID, partial); err != nil {
						log.Printf("listmonk lead capture: %v", err)
					}
				}
			}
			if cfg.GoogleSpreadsheetID != "" && cfg.GoogleCredsPath != "" {
				created := time.Now().UTC().Format(time.RFC3339)
				if err := appendGoogleSheet(context.Background(), cfg, "LEAD", created, partial); err != nil {
					log.Printf("google sheet lead capture: %v", err)
				}
			}
		}()
		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("/membership-applications", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if !rl.allow(clientIP(r)) {
			http.Error(w, "rate limit", http.StatusTooManyRequests)
			return
		}
		var req ApplicationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		if err := req.validate(); err != nil {
			if err.Error() == "rejected" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		id := fmt.Sprintf("%d-%s", time.Now().UnixNano(), randomHex(4))
		created := time.Now().UTC().Format(time.RFC3339)
		raw, _ := json.Marshal(req)
		code := randomCode4()

		_, err := db.Exec(`INSERT INTO membership_applications (id, created_at, payload_json, email, membership_class, membership_tier, country, verification_code, verified, verify_attempts) VALUES (?,?,?,?,?,?,?,?,0,0)`,
			id, created, string(raw), req.Email, req.MembershipClass, req.MembershipTier, req.Country, code)
		if err != nil {
			log.Printf("db insert: %v", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}

		go func() {
			if err := sendVerificationCodeMail(cfg, req.FirstName, req.Email, code); err != nil {
				log.Printf("verification email: %v", err)
			}
		}()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
	})

	mux.HandleFunc("/membership-applications/verify", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			ID   string `json:"id"`
			Code string `json:"code"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		body.ID = strings.TrimSpace(body.ID)
		body.Code = strings.TrimSpace(body.Code)
		if body.ID == "" || body.Code == "" {
			http.Error(w, "id and code required", http.StatusBadRequest)
			return
		}

		var storedCode string
		var verified, attempts int
		var payloadJSON, email string
		err := db.QueryRow(`SELECT verification_code, verified, verify_attempts, payload_json, email FROM membership_applications WHERE id = ?`, body.ID).Scan(&storedCode, &verified, &attempts, &payloadJSON, &email)
		if err == sql.ErrNoRows {
			http.Error(w, "application not found", http.StatusNotFound)
			return
		}
		if err != nil {
			log.Printf("db query verify: %v", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}

		if verified == 1 {
			w.WriteHeader(http.StatusOK)
			return
		}

		if attempts >= 5 {
			http.Error(w, "too many attempts", http.StatusTooManyRequests)
			return
		}

		_, _ = db.Exec(`UPDATE membership_applications SET verify_attempts = verify_attempts + 1 WHERE id = ?`, body.ID)

		if body.Code != storedCode {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}

		_, _ = db.Exec(`UPDATE membership_applications SET verified = 1 WHERE id = ?`, body.ID)

		var req ApplicationRequest
		_ = json.Unmarshal([]byte(payloadJSON), &req)

		var created string
		_ = db.QueryRow(`SELECT created_at FROM membership_applications WHERE id = ?`, body.ID).Scan(&created)

		go fanout(context.Background(), cfg, body.ID, created, &req)

		w.WriteHeader(http.StatusOK)
	})

	mux.HandleFunc("/donations", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if !rl.allow(clientIP(r)) {
			http.Error(w, "rate limit", http.StatusTooManyRequests)
			return
		}
		var req struct {
			Amount   int    `json:"amount"`
			Interval string `json:"interval"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		if req.Amount < 1 {
			http.Error(w, "amount must be at least 1", http.StatusBadRequest)
			return
		}
		req.Interval = strings.ToLower(strings.TrimSpace(req.Interval))
		if req.Interval != "monthly" && req.Interval != "once" {
			req.Interval = "once"
		}
		if cfg.StripeSecretKey == "" {
			http.Error(w, "payments not configured", http.StatusServiceUnavailable)
			return
		}

		donID := fmt.Sprintf("don-%d-%s", time.Now().UnixNano(), randomHex(4))
		created := time.Now().UTC().Format(time.RFC3339)
		amountCents := int64(req.Amount) * 100

		checkoutURL, sessionID, err := createDonationCheckout(cfg, amountCents, req.Interval)
		if err != nil {
			log.Printf("stripe donation checkout: %v", err)
			http.Error(w, "payment setup failed", http.StatusInternalServerError)
			return
		}

		_, err = db.Exec(`INSERT INTO donations (id, amount_cents, interval, currency, stripe_session_id, confirmed, created_at) VALUES (?,?,?,?,?,?,?)`,
			donID, amountCents, req.Interval, "eur", sessionID, 0, created)
		if err != nil {
			log.Printf("db insert donation: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{"checkout_url": checkoutURL, "donation_id": donID})
	})

	mux.HandleFunc("/donation-progress", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var raised int64
		row := db.QueryRow(`SELECT COALESCE(SUM(amount_cents), 0) FROM donations WHERE confirmed = 1`)
		if err := row.Scan(&raised); err != nil {
			log.Printf("donation progress query: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int64{"raised": raised, "goal": cfg.DonationGoalCents})
	})

	mux.HandleFunc("/donations/confirm", func(w http.ResponseWriter, r *http.Request) {
		applyCORS(w, r, cfg.CORSOrigins)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			DonationID string `json:"donation_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		req.DonationID = strings.TrimSpace(req.DonationID)
		if req.DonationID == "" {
			http.Error(w, "donation_id required", http.StatusBadRequest)
			return
		}
		_, err := db.Exec(`UPDATE donations SET confirmed = 1 WHERE id = ? AND confirmed = 0`, req.DonationID)
		if err != nil {
			log.Printf("confirm donation: %v", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	log.Printf("listening on %s", cfg.ListenAddr)
	log.Fatal(http.ListenAndServe(cfg.ListenAddr, mux))
}

func createDonationCheckout(cfg config, amountCents int64, interval string) (checkoutURL string, sessionID string, err error) {
	name := "Fairlinked Donation"

	params := &stripe.CheckoutSessionParams{
		SuccessURL:      stripe.String(cfg.StripeDonateSuccessURL),
		CancelURL:       stripe.String(cfg.StripeDonateCancelURL),
		AdaptivePricing: &stripe.CheckoutSessionAdaptivePricingParams{Enabled: stripe.Bool(true)},
	}

	if interval == "monthly" {
		name = "Fairlinked Donation (monthly)"
		params.Mode = stripe.String(string(stripe.CheckoutSessionModeSubscription))
		params.LineItems = []*stripe.CheckoutSessionLineItemParams{{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency:   stripe.String("eur"),
				UnitAmount: stripe.Int64(amountCents),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(name),
				},
				Recurring: &stripe.CheckoutSessionLineItemPriceDataRecurringParams{
					Interval: stripe.String(string(stripe.PriceRecurringIntervalMonth)),
				},
			},
			Quantity: stripe.Int64(1),
		}}
	} else {
		params.Mode = stripe.String(string(stripe.CheckoutSessionModePayment))
		params.LineItems = []*stripe.CheckoutSessionLineItemParams{{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency:   stripe.String("eur"),
				UnitAmount: stripe.Int64(amountCents),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(name),
				},
			},
			Quantity: stripe.Int64(1),
		}}
	}

	s, err := session.New(params)
	if err != nil {
		return "", "", err
	}
	return s.URL, s.ID, nil
}

func applyCORS(w http.ResponseWriter, r *http.Request, origins []string) {
	origin := r.Header.Get("Origin")
	for _, o := range origins {
		if o == origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Vary", "Origin")
			return
		}
	}
}

func randomHex(n int) string {
	b := make([]byte, (n+1)/2)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%x", time.Now().UnixNano())
	}
	s := hex.EncodeToString(b)
	if len(s) > n {
		return s[:n]
	}
	return s
}

func randomCode4() string {
	b := make([]byte, 2)
	_, _ = rand.Read(b)
	n := int(b[0])<<8 | int(b[1])
	return fmt.Sprintf("%04d", n%10000)
}

func sendVerificationCodeMail(cfg config, firstName, email, code string) error {
	if cfg.SMTPHost == "" || cfg.SMTPFrom == "" {
		return fmt.Errorf("SMTP not configured")
	}
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "Hi %s,\n\n", firstName)
	fmt.Fprintf(&buf, "Your Fairlinked verification code is: %s\n\n", code)
	fmt.Fprintf(&buf, "Enter this code on the application page to confirm your email address.\n\n")
	fmt.Fprintf(&buf, "If you did not request this, you can ignore this email.\n\n")
	fmt.Fprintf(&buf, "Best regards,\nThe Fairlinked Team\nhttps://fairlinked.eu\n")

	addr := cfg.SMTPHost + ":" + cfg.SMTPPort
	var auth smtp.Auth
	if cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	}
	msg := "From: " + cfg.SMTPFrom + "\r\nTo: " + email + "\r\nSubject: Your Fairlinked verification code\r\n\r\n" + buf.String()
	return smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{email}, []byte(msg))
}

func fanout(ctx context.Context, cfg config, id, created string, req *ApplicationRequest) {
	if cfg.GoogleSpreadsheetID != "" && cfg.GoogleCredsPath != "" {
		if err := appendGoogleSheet(ctx, cfg, id, created, req); err != nil {
			log.Printf("google sheet: %v", err)
		}
	}
	if cfg.SMTPHost != "" && cfg.AdminEmailTo != "" {
		if err := sendAdminMail(cfg, id, created, req); err != nil {
			log.Printf("smtp admin: %v", err)
		}
	}
	if cfg.SMTPHost != "" && cfg.SMTPFrom != "" && req.Email != "" {
		if err := sendApplicantMail(cfg, req); err != nil {
			log.Printf("smtp applicant: %v", err)
		}
	}
	if cfg.ListMonkBaseURL != "" && cfg.ListMonkUser != "" && cfg.ListMonkPass != "" {
		listID := cfg.ListMonkListIDMembers
		if listID > 0 {
			if err := listmonkUpsert(cfg, listID, req); err != nil {
				log.Printf("listmonk: %v", err)
			}
		}
	}
}

func appendGoogleSheet(ctx context.Context, cfg config, id, created string, req *ApplicationRequest) error {
	data, err := os.ReadFile(cfg.GoogleCredsPath)
	if err != nil {
		return err
	}
	conf, err := google.JWTConfigFromJSON(data, sheets.SpreadsheetsScope)
	if err != nil {
		return err
	}
	client := conf.Client(ctx)
	srv, err := sheets.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return err
	}
	row := sheetRow(id, created, req)
	rangeName := cfg.GoogleSheetName + "!A:N"
	_, err = srv.Spreadsheets.Values.Append(cfg.GoogleSpreadsheetID, rangeName, &sheets.ValueRange{Values: [][]interface{}{row}}).ValueInputOption("USER_ENTERED").Do()
	return err
}

func sheetRow(id, created string, req *ApplicationRequest) []interface{} {
	return []interface{}{
		created, id, req.Email, req.MembershipClass, req.FirstName, req.LastName,
		req.BusinessName, req.Country, req.MembershipTier, "",  "",
		req.MarketingConsent, req.PrivacyConsent,
	}
}

func sendAdminMail(cfg config, id, created string, req *ApplicationRequest) error {
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "New membership application (verified)\n\nID: %s\nTime: %s\n\n", id, created)
	fmt.Fprintf(&buf, "Email: %s\nTier: %s\n", req.Email, req.MembershipTier)
	fmt.Fprintf(&buf, "Name: %s %s\nBusiness: %s\nCountry: %s\n", req.FirstName, req.LastName, req.BusinessName, req.Country)
	fmt.Fprintf(&buf, "Privacy / processing consent: %v\n", req.PrivacyConsent)
	addr := cfg.SMTPHost + ":" + cfg.SMTPPort
	var auth smtp.Auth
	if cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	}
	msg := "From: " + cfg.SMTPFrom + "\r\nTo: " + cfg.AdminEmailTo + "\r\nSubject: Fairlinked membership application " + id + "\r\n\r\n" + buf.String()
	return smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{cfg.AdminEmailTo}, []byte(msg))
}

func sendApplicantMail(cfg config, req *ApplicationRequest) error {
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "Hi %s,\n\n", req.FirstName)
	fmt.Fprintf(&buf, "Thank you for applying for full membership with Fairlinked \u2014 Alliance for Digital Fairness e.V.\n\n")
	fmt.Fprintf(&buf, "Your email has been verified and your application is now being reviewed by the board. We'll follow up by email once your membership has been confirmed.\n\n")
	fmt.Fprintf(&buf, "If you have any questions, just reply to this email.\n\n")
	fmt.Fprintf(&buf, "Best regards,\nThe Fairlinked Team\nhttps://fairlinked.eu\n")

	addr := cfg.SMTPHost + ":" + cfg.SMTPPort
	var auth smtp.Auth
	if cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	}
	msg := "From: " + cfg.SMTPFrom + "\r\nTo: " + req.Email + "\r\nSubject: Your Fairlinked application\r\n\r\n" + buf.String()
	return smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{req.Email}, []byte(msg))
}

type listmonkSubscriber struct {
	Email      string                 `json:"email"`
	Name       string                 `json:"name"`
	Status     string                 `json:"status"`
	Lists      []int                  `json:"lists"`
	Attribs    map[string]interface{} `json:"attribs"`
	Preconfirm bool                   `json:"preconfirm_subscriptions"`
}

func listmonkUpsert(cfg config, listID int, req *ApplicationRequest) error {
	name := strings.TrimSpace(req.FirstName + " " + req.LastName)
	attribs := map[string]interface{}{
		"membership_class":  req.MembershipClass,
		"membership_tier":   req.MembershipTier,
		"first_name":        req.FirstName,
		"last_name":         req.LastName,
		"business_name":     req.BusinessName,
		"country":           req.Country,
		"marketing_consent": req.MarketingConsent,
		"privacy_consent":   req.PrivacyConsent,
	}
	body, _ := json.Marshal(listmonkSubscriber{
		Email:      req.Email,
		Name:       name,
		Status:     "enabled",
		Lists:      []int{listID},
		Attribs:    attribs,
		Preconfirm: true,
	})
	postURL := cfg.ListMonkBaseURL + "/api/subscribers"
	httpReq, err := http.NewRequest(http.MethodPost, postURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.SetBasicAuth(cfg.ListMonkUser, cfg.ListMonkPass)
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		return nil
	}
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusConflict && resp.StatusCode != http.StatusBadRequest {
		return fmt.Errorf("listmonk POST %d: %s", resp.StatusCode, string(respBody))
	}
	subID, err := listmonkFindID(cfg, req.Email)
	if err != nil {
		return fmt.Errorf("listmonk find after conflict: %w (%s)", err, string(respBody))
	}
	patchURL := fmt.Sprintf("%s/api/subscribers/%d", cfg.ListMonkBaseURL, subID)
	patchBody, _ := json.Marshal(map[string]interface{}{
		"email":                    req.Email,
		"name":                     name,
		"status":                   "enabled",
		"lists":                    []int{listID},
		"attribs":                  attribs,
		"preconfirm_subscriptions": true,
	})
	patchReq, err := http.NewRequest(http.MethodPatch, patchURL, bytes.NewReader(patchBody))
	if err != nil {
		return err
	}
	patchReq.SetBasicAuth(cfg.ListMonkUser, cfg.ListMonkPass)
	patchReq.Header.Set("Content-Type", "application/json")
	patchResp, err := http.DefaultClient.Do(patchReq)
	if err != nil {
		return err
	}
	defer patchResp.Body.Close()
	if patchResp.StatusCode != http.StatusOK {
		pb, _ := io.ReadAll(io.LimitReader(patchResp.Body, 4096))
		return fmt.Errorf("listmonk PATCH %d: %s", patchResp.StatusCode, string(pb))
	}
	return nil
}

type listmonkListResponse struct {
	Data struct {
		Results []struct {
			ID int `json:"id"`
		} `json:"results"`
	} `json:"data"`
}

func listmonkFindID(cfg config, email string) (int, error) {
	esc := strings.ReplaceAll(email, "'", "''")
	q := fmt.Sprintf("subscribers.email = '%s'", esc)
	u := cfg.ListMonkBaseURL + "/api/subscribers?per_page=1&query=" + url.QueryEscape(q)
	req, err := http.NewRequest(http.MethodGet, u, nil)
	if err != nil {
		return 0, err
	}
	req.SetBasicAuth(cfg.ListMonkUser, cfg.ListMonkPass)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	var lr listmonkListResponse
	if err := json.NewDecoder(resp.Body).Decode(&lr); err != nil {
		return 0, err
	}
	if len(lr.Data.Results) == 0 {
		return 0, fmt.Errorf("no subscriber for email")
	}
	return lr.Data.Results[0].ID, nil
}
