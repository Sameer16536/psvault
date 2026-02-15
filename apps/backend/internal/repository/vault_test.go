package repository_test

import (
	"context"
	"testing"

	"github.com/Sameer16536/psvault/internal/database"
	"github.com/Sameer16536/psvault/internal/model/vault"
	"github.com/Sameer16536/psvault/internal/repository"
	"github.com/Sameer16536/psvault/internal/server"
	tt "github.com/Sameer16536/psvault/internal/testing"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper to create test user
func createTestUser(t *testing.T, ctx context.Context, testDB *tt.TestDB, email string) string {
	t.Helper()
	userID := uuid.New().String()
	_, err := testDB.Pool.Exec(ctx, "INSERT INTO users (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())", userID, email)
	require.NoError(t, err, "setup: failed to create user")
	return userID
}

// Test: Create vault with all fields
func TestVaultRepository_Create_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "test@example.com")

	name := "Test Vault"
	desc := "A test vault"
	encryptedKey := []byte("encrypted-key-data-12345")
	encryptionVersion := 1

	v := &vault.Vault{
		UserID:               userID,
		Name:                 name,
		Description:          &desc,
		EncryptedKey:         encryptedKey,
		KeyEncryptionVersion: &encryptionVersion,
	}

	err := repo.Create(ctx, v)
	require.NoError(t, err)

	assert.NotEmpty(t, v.ID)
	assert.Equal(t, userID, v.UserID)
	assert.Equal(t, name, v.Name)
	assert.Equal(t, desc, *v.Description)
	assert.Equal(t, encryptedKey, v.EncryptedKey)
	assert.Equal(t, encryptionVersion, *v.KeyEncryptionVersion)
	assert.False(t, v.CreatedAt.IsZero())
	assert.False(t, v.UpdatedAt.IsZero())
}

// Test: Create vault without optional fields
func TestVaultRepository_Create_MinimalFields(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "minimal@example.com")

	v := &vault.Vault{
		UserID:       userID,
		Name:         "Minimal Vault",
		EncryptedKey: []byte("key"),
	}

	err := repo.Create(ctx, v)
	require.NoError(t, err)
	assert.NotEmpty(t, v.ID)
}

// Test: Create vault with invalid user (FK constraint)
func TestVaultRepository_Create_InvalidUser(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	v := &vault.Vault{
		UserID:       uuid.New().String(), // Non-existent user
		Name:         "Invalid Vault",
		EncryptedKey: []byte("key"),
	}

	err := repo.Create(ctx, v)
	assert.Error(t, err, "should fail with FK constraint")
}

// Test: GetByID - existing vault
func TestVaultRepository_GetByID_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "getbyid@example.com")

	v := &vault.Vault{
		UserID:       userID,
		Name:         "Get Test",
		EncryptedKey: []byte("encrypted-data"),
	}
	err := repo.Create(ctx, v)
	require.NoError(t, err)

	retrieved, err := repo.GetByID(ctx, v.ID.String())
	require.NoError(t, err)
	assert.NotNil(t, retrieved)
	assert.Equal(t, v.ID, retrieved.ID)
	assert.Equal(t, v.Name, retrieved.Name)
	assert.Equal(t, v.EncryptedKey, retrieved.EncryptedKey)
}

// Test: GetByID - non-existent vault
func TestVaultRepository_GetByID_NotFound(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	retrieved, err := repo.GetByID(ctx, uuid.New().String())
	assert.NoError(t, err, "GetByID returns nil, nil for not found")
	assert.Nil(t, retrieved)
}

// Test: ListByUserID - multiple vaults
func TestVaultRepository_ListByUserID_MultipleVaults(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "list@example.com")

	// Create 3 vaults
	for i := 1; i <= 3; i++ {
		v := &vault.Vault{
			UserID:       userID,
			Name:         "Vault " + string(rune('0'+i)),
			EncryptedKey: []byte("key"),
		}
		err := repo.Create(ctx, v)
		require.NoError(t, err)
	}

	list, err := repo.ListByUserID(ctx, userID)
	require.NoError(t, err)
	assert.Len(t, list, 3)
}

// Test: ListByUserID - no vaults
func TestVaultRepository_ListByUserID_Empty(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "empty@example.com")

	list, err := repo.ListByUserID(ctx, userID)
	require.NoError(t, err)
	assert.Empty(t, list)
}

// Test: Update vault
func TestVaultRepository_Update_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "update@example.com")

	v := &vault.Vault{
		UserID:       userID,
		Name:         "Original Name",
		EncryptedKey: []byte("key"),
	}
	err := repo.Create(ctx, v)
	require.NoError(t, err)

	newName := "Updated Name"
	newDesc := "Updated Description"
	v.Name = newName
	v.Description = &newDesc

	err = repo.Update(ctx, v)
	require.NoError(t, err)

	// Verify update
	retrieved, err := repo.GetByID(ctx, v.ID.String())
	require.NoError(t, err)
	assert.Equal(t, newName, retrieved.Name)
	assert.Equal(t, newDesc, *retrieved.Description)
}

// Test: Delete vault
func TestVaultRepository_Delete_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "delete@example.com")

	v := &vault.Vault{
		UserID:       userID,
		Name:         "To Delete",
		EncryptedKey: []byte("key"),
	}
	err := repo.Create(ctx, v)
	require.NoError(t, err)

	err = repo.Delete(ctx, v.ID.String())
	require.NoError(t, err)

	// Verify deletion
	retrieved, err := repo.GetByID(ctx, v.ID.String())
	assert.NoError(t, err)
	assert.Nil(t, retrieved)
}

// Test: Encrypted key persistence (CRITICAL)
func TestVaultRepository_EncryptedKeyPersistence(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	testDB, cleanup := tt.SetupTestDB(t)
	defer cleanup()

	db := &database.Database{Pool: testDB.Pool}
	srv := &server.Server{DB: db}
	repo := repository.NewVaultRepository(srv)
	ctx := context.Background()

	userID := createTestUser(t, ctx, testDB, "crypto@example.com")

	// Simulate real encrypted key (base64-like binary data)
	encryptedKey := []byte("U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y=")
	version := 1

	v := &vault.Vault{
		UserID:               userID,
		Name:                 "Crypto Vault",
		EncryptedKey:         encryptedKey,
		KeyEncryptionVersion: &version,
	}

	err := repo.Create(ctx, v)
	require.NoError(t, err)

	// Retrieve and verify exact match
	retrieved, err := repo.GetByID(ctx, v.ID.String())
	require.NoError(t, err)
	assert.Equal(t, encryptedKey, retrieved.EncryptedKey, "Encrypted key must persist exactly")
	assert.Equal(t, version, *retrieved.KeyEncryptionVersion)
}
