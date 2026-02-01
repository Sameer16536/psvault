package secret

type SecretType string

const (
	SecretTypePassword SecretType = "password"
	SecretTypeNote     SecretType = "note"
	SecretTypeAPIKey   SecretType = "api_key"
	SecretTypeCard     SecretType = "card"
)
