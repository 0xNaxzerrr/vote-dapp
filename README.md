# Vote DApp - Application de Vote Décentralisée sur Solana

Cette application décentralisée (DApp) permet aux utilisateurs de créer des propositions de vote, de voter sur ces propositions, et de gérer leur cycle de vie sur la blockchain Solana.

## 🚀 Fonctionnalités

- ✨ Création de propositions de vote avec titre, description et choix multiples
- 🗳️ Vote sur les propositions existantes
- ⏰ Gestion des délais de vote
- 🧹 Nettoyage automatique des propositions expirées (après un mois)
- 💰 Récupération automatique des frais de location (rent) lors de la suppression

## 📋 Prérequis

### Requis pour le développement et le déploiement
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.17.0 ou supérieur)
- [Anchor](https://www.anchor-lang.com/) (v0.31.1)

### Requis pour les tests et le développement client
- [Node.js](https://nodejs.org/) (v16.0.0 ou supérieur)
- [Yarn](https://yarnpkg.com/) (recommandé) ou npm

### Installation de Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
```

### Installation d'Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## 🛠️ Installation

1. Clonez le dépôt :
```bash
git clone <votre-repo-url>
cd vote-dapp
```

2. Installez les dépendances :
```bash
yarn install
```

3. Construisez le programme :
```bash
anchor build
```

## 💻 Configuration

1. Démarrez un validateur Solana local :
```bash
solana-test-validator
```

2. Configurez votre environnement Solana pour utiliser le réseau local :
```bash
solana config set --url localhost
```

3. Créez un nouveau keypair si nécessaire :
```bash
solana-keygen new
```

## 🚀 Déploiement

1. Mettez à jour l'ID du programme dans `programs/vote-dapp/src/lib.rs` et `Anchor.toml` avec votre nouvelle adresse de programme :
```bash
solana address -k target/deploy/vote_app-keypair.json
```

2. Déployez le programme :
```bash
anchor deploy
```

## 🧪 Tests

Pour exécuter les tests :

```bash
# Démarrez d'abord un validateur local dans un terminal séparé
solana-test-validator

# Dans un autre terminal, exécutez les tests
anchor test
```

Les tests utilisent :
- Mocha comme framework de test
- Chai pour les assertions
- ts-mocha pour l'exécution des tests TypeScript

## 📦 Dépendances Principales

```json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.1"
  },
  "devDependencies": {
    "chai": "^4.3.4",
    "mocha": "^9.0.3",
    "ts-mocha": "^10.0.0",
    "@types/bn.js": "^5.1.0",
    "@types/chai": "^4.3.0",
    "@types/mocha": "^9.0.0",
    "typescript": "^5.7.3",
    "prettier": "^2.6.2"
  }
}
```

## 📝 Structure du Programme

Le programme contient trois instructions principales :

### 1. Create Proposal
```rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
    choices: Vec<String>,
    deadline: u64,
) -> Result<()>
```
Cette instruction permet de créer une nouvelle proposition de vote avec un titre, une description, des options de vote et une date limite.

### 2. Cast Vote
```rust
pub fn cast_vote(
    ctx: Context<CastVote>,
    user_choice: u8
) -> Result<()>
```
Cette instruction permet à un utilisateur de voter pour une option spécifique dans une proposition.

### 3. Delete Proposal
```rust
pub fn delete_proposal(
    ctx: Context<DeleteProposal>
) -> Result<()>
```
Cette instruction permet de supprimer une proposition expirée (après un mois) et de récupérer les frais de location.

## 🏗️ Structure du Projet

```
vote-dapp/
├── programs/              # Code du programme Solana
│   └── vote-dapp/
│       ├── src/
│       │   ├── lib.rs    # Point d'entrée du programme
│       │   ├── state/    # Structures de données
│       │   ├── errors.rs # Gestion des erreurs
│       │   └── instructions/ # Instructions du programme
├── app/                  # Interface utilisateur (si applicable)
├── tests/               # Tests du programme
├── migrations/          # Scripts de migration
└── package.json        # Configuration des dépendances
```

## ⚠️ Gestion des Erreurs

Le programme gère plusieurs types d'erreurs :

- `MaxLengthChoices` : Le nombre de choix dépasse la limite (5)
- `DeadlinePassed` : La date limite de vote est dépassée
- `InvalidOption` : L'option de vote choisie n'est pas valide
- `ProposalNotExpiredEnough` : La proposition ne peut pas encore être supprimée (< 1 mois après expiration)

## 🔐 Sécurité

- Les votes sont uniques par utilisateur grâce à un PDA (Program Derived Address)
- Les propositions ne peuvent être supprimées qu'après un mois d'expiration
- Les fonds de location sont automatiquement retournés au créateur lors de la suppression
- Validation stricte des entrées utilisateur
- Vérification des permissions basée sur les clés publiques

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

### Guide de Style
- Rust : suivez les conventions de [rustfmt](https://github.com/rust-lang/rustfmt)
- TypeScript : le projet utilise Prettier pour le formatage
```bash
# Formater le code
yarn lint:fix
# Vérifier le formatage
yarn lint
```

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE)

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur le dépôt. 