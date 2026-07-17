# Politique de sécurité

## Modèle de sécurité

Claude Usage est une extension Chrome (Manifest V3) qui :

- communique **uniquement** avec `https://claude.ai` (déclaré dans `host_permissions`) ;
- s'appuie sur le **cookie de session** déjà présent dans ton navigateur — aucun token,
  mot de passe ni cookie n'est saisi, stocké de façon persistante, ni transmis ailleurs ;
- ne journalise rien et n'envoie **aucune donnée** vers un serveur tiers.

Les seules permissions demandées sont `storage` (réglages locaux) et `alarms`
(rafraîchissement périodique du badge).

## Signaler une vulnérabilité

Merci de **ne pas** ouvrir d'issue publique pour un problème de sécurité.

Utilise plutôt la fonction **« Report a vulnerability »** de l'onglet *Security* du dépôt
GitHub (GitHub Security Advisories), qui permet un signalement privé.

Merci d'inclure :

- une description du problème et de son impact potentiel ;
- les étapes pour le reproduire ;
- la version du navigateur et de l'extension concernée.

Nous nous efforçons d'accuser réception sous quelques jours et de corriger les problèmes
confirmés dans un délai raisonnable.

## Versions supportées

Seule la dernière version publiée sur la branche `main` reçoit des correctifs de sécurité.
