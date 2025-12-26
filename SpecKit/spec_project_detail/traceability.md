# Requirement Traceability Matrix (RTM)

## Feature Traceability
| Feature ID | Feature Name | Spec Header | Related Tasks | Status |
| :--- | :--- | :--- | :--- | :--- |
| **[F-001]** | Applicant Registration | 1. System Features | [T-001], [T-002] | **Active** |
| **[F-002]** | Dashboard | 1. System Features | [T-004] | **Active** |
| **[F-003]** | PDF Generation | 1. System Features | [T-003], [T-005] | **Active** |
| **[F-004]** | Digital Signature | 1. System Features | [T-002] | **Done** |

## Data Traceability
| Entity | Interface | Key State Variables | Related Files | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Application | `ApplicationData` | `application`, `setApplication` | `application-details.tsx` | Main form data |
| Signature | `SignatureData` | `signaturePad` (ref) | `SignaturePad.tsx` | Canvas ref |
