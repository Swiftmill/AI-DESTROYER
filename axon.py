"""Core implementation of the AXON offline-first agent."""

from __future__ import annotations

import json
import re
import uuid
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class MemoryPaths:
    """Convenience container holding filesystem paths used by the agent."""

    root: Path = Path(__file__).resolve().parent

    @property
    def config(self) -> Path:
        return self.root / "config" / "axiomes.md"

    @property
    def facts(self) -> Path:
        return self.root / "memory" / "facts.json"

    @property
    def preferences(self) -> Path:
        return self.root / "memory" / "preferences.json"

    @property
    def logs(self) -> Path:
        return self.root / "memory" / "logs.jsonl"


class AxonAgent:
    """AXON agent able to load, store, and reason over local knowledge bases."""

    def __init__(self) -> None:
        self.paths = MemoryPaths()
        self.memory: Dict[str, Any] = {}
        self.axioms: str = ""
        self.ensure_storage()
        self.load_memory()
        self.load_axioms()

    # ---------------------------------------------------------------------
    # File management helpers
    # ---------------------------------------------------------------------
    def ensure_storage(self) -> None:
        """Ensure required directories and files exist before use."""

        self.paths.root.mkdir(parents=True, exist_ok=True)
        (self.paths.root / "config").mkdir(exist_ok=True)
        (self.paths.root / "memory").mkdir(exist_ok=True)

        if not self.paths.facts.exists():
            self.paths.facts.write_text(json.dumps({"items": []}, indent=2), encoding="utf-8")
        if not self.paths.preferences.exists():
            self.paths.preferences.write_text(json.dumps({}, indent=2), encoding="utf-8")
        if not self.paths.logs.exists():
            self.paths.logs.touch()
        if not self.paths.config.exists():
            self.paths.config.write_text("", encoding="utf-8")

    def load_axioms(self) -> None:
        """Load the axioms file described by the specification."""

        if self.paths.config.exists():
            self.axioms = self.paths.config.read_text(encoding="utf-8")
        else:
            self.axioms = ""

    def load_memory(self) -> Dict[str, Any]:
        """Load memory JSON files and keep them in-memory."""

        with self.paths.facts.open("r", encoding="utf-8") as handle:
            facts = json.load(handle)
        with self.paths.preferences.open("r", encoding="utf-8") as handle:
            preferences = json.load(handle)

        self.memory = {
            "facts": facts,
            "preferences": preferences,
        }
        return deepcopy(self.memory)

    def save_memory(self) -> None:
        """Persist the current in-memory state back to disk."""

        facts = self.memory.get("facts", {"items": []})
        preferences = self.memory.get("preferences", {})
        self.paths.facts.write_text(
            json.dumps(facts, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        self.paths.preferences.write_text(
            json.dumps(preferences, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    # ---------------------------------------------------------------------
    # Memory manipulation
    # ---------------------------------------------------------------------
    def remember_fact(
        self,
        subject: str,
        value: str,
        provenance: str,
        *,
        confidence: Optional[float] = None,
        notes: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Store a factual statement with provenance and metadata."""

        confidence_map = {"user": 0.2, "web": 0.8}
        fact = {
            "id": uuid.uuid4().hex,
            "subject": subject.strip(),
            "value": value.strip(),
            "provenance": provenance,
            "confidence": confidence if confidence is not None else confidence_map.get(provenance, 0.5),
            "added_at": self._now(),
            "notes": notes,
            "tags": tags or [],
            "deleted": False,
            "metadata": metadata or {},
        }

        self.memory.setdefault("facts", {"items": []})
        self.memory["facts"].setdefault("items", []).append(fact)
        return fact

    def remember_preference(self, category: str, item: str, opinion: str) -> Dict[str, Any]:
        """Store a user preference grouped by category."""

        preferences = self.memory.setdefault("preferences", {})
        category_block = preferences.setdefault(category, {})
        category_block[item] = {
            "opinion": opinion,
            "added_at": self._now(),
        }
        return category_block[item]

    def forget_fact(self, subject_query: str) -> int:
        """Soft-delete facts matching the provided subject query."""

        if not subject_query.strip():
            return 0
        deleted = 0
        for fact in self.memory.get("facts", {}).get("items", []):
            if fact.get("deleted"):
                continue
            subject = fact.get("subject", "").lower()
            if subject_query.lower() in subject:
                fact["deleted"] = True
                fact["deleted_at"] = self._now()
                deleted += 1
        return deleted

    # ---------------------------------------------------------------------
    # Interaction helpers
    # ---------------------------------------------------------------------
    def search_web(self, query: str) -> List[Dict[str, Any]]:
        """Mockable web search method.

        The default implementation returns a placeholder result to keep the
        project offline-friendly. Integrators can override this method to plug a
        real search API.
        """

        summary = f"Aucune recherche en ligne réelle n'a été effectuée pour '{query}'."
        return [
            {
                "subject": f"web_search:{query}",
                "value": summary,
                "url": None,
                "summary": summary,
                "provenance": "web",
                "confidence": 0.5,
            }
        ]

    def respond(self, prompt: str) -> str:
        """Process a user prompt according to the AXON specification."""

        self.load_axioms()
        self.load_memory()

        lowered = prompt.lower().strip()
        actions: List[str] = []
        response_lines: List[str] = []
        updates_performed: List[str] = []

        if any(keyword in lowered for keyword in ("cherche", "google", "web")):
            query = self._extract_query(prompt)
            results = self.search_web(query)
            for result in results:
                stored = self.remember_fact(
                    subject=result["subject"],
                    value=result["summary"],
                    provenance=result.get("provenance", "web"),
                    confidence=result.get("confidence"),
                    metadata={"url": result.get("url"), "query": query},
                )
                updates_performed.append(f"fact:{stored['id']}")
            response_lines.append(f"Résultat de recherche (mock) pour '{query}'.")
            actions.append("search_web")

        elif any(keyword in lowered for keyword in ("apprends que", "tiens sache que")):
            fact_data = self._parse_fact_statement(prompt)
            if fact_data:
                stored = self.remember_fact(
                    subject=fact_data["subject"],
                    value=fact_data["value"],
                    provenance="user",
                )
                response_lines.append(
                    f"Je mémorise que {stored['subject']} est {stored['value']} (provenance utilisateur)."
                )
                updates_performed.append(f"fact:{stored['id']}")
            else:
                response_lines.append("Je n'ai pas réussi à comprendre le fait à mémoriser.")
            actions.append("remember_fact")

        elif any(keyword in lowered for keyword in ("mon avis", "j'aime", "je n'aime pas")):
            preference = self._parse_preference_statement(prompt)
            if preference:
                stored = self.remember_preference(
                    preference["category"], preference["item"], preference["opinion"],
                )
                response_lines.append(
                    f"Préférence enregistrée pour {preference['item']} dans {preference['category']}."
                )
                updates_performed.append(f"preference:{preference['category']}:{preference['item']}")
            else:
                response_lines.append("Je n'ai pas compris la préférence à enregistrer.")
            actions.append("remember_preference")

        elif "oublie" in lowered:
            subject_query = self._extract_after_keyword(prompt, "oublie").strip()
            if not subject_query:
                response_lines.append("Précise ce que je dois oublier.")
                deleted = 0
            else:
                deleted = self.forget_fact(subject_query)
                if deleted:
                    response_lines.append(
                        f"{deleted} fait(s) marqué(s) comme oublié(s) pour '{subject_query}'."
                    )
                else:
                    response_lines.append("Aucun fait correspondant à oublier.")
            actions.append("forget_fact")

        else:
            subject_query = self._extract_question_subject(prompt)
            if subject_query:
                matches = self._find_matching_facts(subject_query)
                if matches:
                    for fact in matches:
                        source = fact.get("provenance", "inconnue")
                        added_at = fact.get("added_at", "?")
                        response_lines.append(
                            f"Selon {source}: {fact['subject']} = {fact['value']} [{added_at}]."
                        )
                else:
                    response_lines.append("Je n'ai aucun fait correspondant en mémoire.")
            else:
                response_lines.append("Je suis prêt à apprendre ou à répondre selon les instructions.")
            actions.append("answer")

        self.save_memory()
        self.update_logs(
            {
                "timestamp": self._now(),
                "prompt": prompt,
                "response": response_lines,
                "actions": actions,
                "updates": updates_performed,
            }
        )

        return "\n".join(response_lines)

    def update_logs(self, entry: Dict[str, Any]) -> None:
        """Append a JSON line to the logs file."""

        with self.paths.logs.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def show_memory(self) -> Dict[str, Any]:
        """Return a deep copy of the current memory state (for debugging)."""

        return deepcopy(self.memory)

    # ------------------------------------------------------------------
    # Parsing helpers
    # ------------------------------------------------------------------
    def _extract_query(self, prompt: str) -> str:
        """Extract a search query from the prompt."""

        match = re.search(r"(?:cherche|google|web)\s+(.*)", prompt, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return prompt.strip()

    def _parse_fact_statement(self, prompt: str) -> Optional[Dict[str, str]]:
        """Attempt to parse a fact statement from the user."""

        prefix_pattern = re.compile(r"^(apprends que|tiens sache que)\s+", flags=re.IGNORECASE)
        cleaned = prefix_pattern.sub("", prompt).strip()
        match = re.search(r"(.+?)\s+est\s+(.+)", cleaned, flags=re.IGNORECASE)
        if match:
            subject = match.group(1).strip()
            value = match.group(2).strip(" .")
            return {"subject": subject, "value": value}
        stripped = cleaned.strip()
        if stripped:
            return {"subject": stripped, "value": stripped}
        return None

    def _parse_preference_statement(self, prompt: str) -> Optional[Dict[str, str]]:
        """Extract preference data from the prompt when possible."""

        lowered = prompt.lower()
        if "mon avis" in lowered:
            after = self._extract_after_keyword(prompt, "mon avis").strip(" :")
            if after:
                return {"category": "general", "item": after, "opinion": after}
            return None
        like_match = re.search(r"j'aime\s+(.+)", prompt, flags=re.IGNORECASE)
        if like_match:
            item = like_match.group(1).strip(" .")
            return {"category": "likes", "item": item, "opinion": "like"}
        dislike_match = re.search(r"je n'aime pas\s+(.+)", prompt, flags=re.IGNORECASE)
        if dislike_match:
            item = dislike_match.group(1).strip(" .")
            return {"category": "dislikes", "item": item, "opinion": "dislike"}
        return None

    def _extract_question_subject(self, prompt: str) -> Optional[str]:
        """Extract the subject of a question to query the knowledge base."""

        lowered = prompt.lower().strip(" ?!.")
        patterns = [
            r"qui est\s+(.+)",
            r"qu'est-ce que\s+(.+)",
            r"quel est\s+(.+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, lowered)
            if match:
                return match.group(1).strip()
        if lowered.endswith("?"):
            lowered = lowered[:-1]
        return lowered if lowered else None

    def _find_matching_facts(self, subject_query: str) -> List[Dict[str, Any]]:
        """Return facts whose subject roughly matches the query."""

        matches: List[Dict[str, Any]] = []
        subject_query_lower = subject_query.lower()
        for fact in self.memory.get("facts", {}).get("items", []):
            if fact.get("deleted"):
                continue
            subject = fact.get("subject", "")
            value = fact.get("value", "")
            if subject_query_lower in subject.lower() or subject.lower() in subject_query_lower:
                matches.append(fact)
            elif subject_query_lower in value.lower():
                matches.append(fact)
        return matches

    def _extract_after_keyword(self, prompt: str, keyword: str) -> str:
        """Utility returning text located after the first occurrence of keyword."""

        pattern = re.compile(re.escape(keyword), flags=re.IGNORECASE)
        match = pattern.search(prompt)
        if not match:
            return ""
        return prompt[match.end() :]

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()


__all__ = ["AxonAgent"]

