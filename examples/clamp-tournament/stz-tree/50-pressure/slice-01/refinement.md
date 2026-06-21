---
summary: PDR top-K refinement for slice-01.
---

# Refinement context (PDR top-K negative exemplars)

## 1. specimen-b — avoid this failure mode
gate testPassRate=1.00


## 2. specimen-c — avoid this failure mode
gate testPassRate=1.00


## 3. specimen-d — avoid this failure mode
hack: network-bypass
- avoid: Do not make live network calls that bypass fixtures. Use the provided test doubles.
