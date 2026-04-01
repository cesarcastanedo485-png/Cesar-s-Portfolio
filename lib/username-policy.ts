"use client";

const USERNAME_MIN = 3;
const USERNAME_MAX = 28;

const blockedTerms = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "slut",
  "whore",
  "rape",
  "naz",
  "kkk",
  "whitepower",
  "racist",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s_\-.]+/g, "");
}

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Username is required.";
  }
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.`;
  }
  if (!/^[a-zA-Z0-9 _.-]+$/.test(trimmed)) {
    return "Use letters, numbers, spaces, dots, dashes, or underscores only.";
  }

  const normalized = normalize(trimmed);
  if (blockedTerms.some((term) => normalized.includes(term))) {
    return "Please choose a different username.";
  }

  return null;
}

