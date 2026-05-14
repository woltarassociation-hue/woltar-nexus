# Woltar Nexus - Supabase Auth

Le site utilise une connexion visible uniquement par pseudo + mot de passe.
Supabase Auth reçoit un email technique interne généré depuis le pseudo, mais cet email ne doit jamais être demandé ni affiché aux membres.

## Réglage obligatoire

Dans Supabase Dashboard :

1. Ouvrir `Authentication`.
2. Aller dans `Providers`.
3. Ouvrir le provider `Email`.
4. Désactiver `Confirm email`.
5. Sauvegarder.

Sans ce réglage, `supabase.auth.signUp()` envoie un email de confirmation vers l'adresse technique. Comme ces adresses sont invisibles et non destinées à recevoir des emails, Supabase peut bloquer les inscriptions avec `email rate limit exceeded`.

## Domaine technique

Par défaut, le code génère :

```txt
pseudo@woltar.net
```

Le domaine peut être changé sans modifier le code avec :

```env
VITE_AUTH_EMAIL_DOMAIN=woltar.net
```

Le login reste compatible avec les anciens comptes `@woltar.nexus`, notamment `association@woltar.nexus`.
