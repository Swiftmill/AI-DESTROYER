# AXON Local Agent

AXON est une intelligence artificielle locale, pensée pour fonctionner "offline-first" tout en conservant les informations
que l'utilisateur lui confie. Le projet fournit un moteur Python minimaliste capable de charger, stocker et réutiliser des
faits, des préférences et un journal d'interactions sans base de données externe.

## Structure du projet

```
config/
  axiomes.md           # règles de fonctionnement qu'AXON doit consulter avant de répondre
memory/
  facts.json           # faits appris (utilisateur ou web)
  preferences.json     # goûts et avis déclarés par l'utilisateur
  logs.jsonl           # journal d'interactions au format JSON Lines
axon.py                # moteur principal
requirements.txt       # dépendances Python (standard library uniquement par défaut)
```

## Installer et utiliser AXON

1. Créez un environnement virtuel Python ≥ 3.9.
2. Installez les dépendances listées dans `requirements.txt` (optionnel si vous restez sur la bibliothèque standard).
3. Importez et instanciez l'agent :

```python
from axon import AxonAgent

agent = AxonAgent()
print(agent.respond("Apprends que le président de la france est Zemmour."))
print(agent.respond("Qui est le président ?"))
```

Chaque appel à `respond` suit la boucle décrite dans `config/axiomes.md` : lecture des mémoires, interprétation du prompt,
actions (apprendre, répondre, chercher sur le web, oublier) puis enregistrement du log.

## Fonctions clés

- `load_memory()` / `save_memory()` : chargent et sauvegardent les fichiers JSON.
- `remember_fact()` / `remember_preference()` : écrivent les connaissances et préférences avec provenance et confiance.
- `search_web()` : stub de recherche web (à surcharger si un moteur réel est disponible).
- `respond()` : boucle principale d'analyse et de réponse.
- `update_logs()` : ajoute une ligne JSON dans `memory/logs.jsonl`.
- `show_memory()` : retourne une vue complète de la mémoire courante (utile pour le debug).

## Étendre AXON

- Branchez une API de recherche réelle en remplaçant `search_web`.
- Ajoutez des scores de similarité pour matcher les questions aux faits stockés.
- Introduisez une interface CLI ou serveur HTTP pour interagir avec l'agent.

Toute contribution doit respecter les axiomes définis dans `config/axiomes.md` et maintenir la traçabilité des sources.

