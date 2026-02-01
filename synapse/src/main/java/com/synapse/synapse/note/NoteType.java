package com.synapse.synapse.note;

public enum NoteType {
    STICKY,
    PHOTO,
    DOCUMENT,
    CLIPPING,
    LABEL,
    INDEX_CARD,
    EVIDENCE_TAG;

    public static NoteType fromString(String value) {
        if (value == null || value.isBlank()) {
            return STICKY;
        }

        String normalized = value
                .trim()
                .toUpperCase()
                .replace("-", "_");

        try {
            return NoteType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return STICKY; // safe fallback
        }
    }

    public String toApiValue() {
        return this.name().toLowerCase().replace("_", "-");
    }
}
