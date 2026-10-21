---
name: email-summary
description: >-
  Generates a structured, prioritized digest of all unread emails on demand. Use this skill whenever the user asks to summarize their inbox, check what emails need attention, get an email digest, review unread emails, prioritize their inbox, or asks "what's in my inbox" — even if they don't use the exact phrase "email summary" or "digest".
allowed-tools: list_emails get_email
metadata:
  version: 1.0.0
  tags: email productivity inbox digest
---

# Email Summary

Generate a structured, prioritized digest of the user's unread inbox on demand.

---

## Step 1 — Fetch unread emails

Call `list_emails` with:
- `onlyUnread: true`
- `top: 50`

This returns subjects, senders, dates, and short previews for each unread email.

After fetching, apply the following filters in order:

1. **Date filter**: Keep only emails received within the **last 5 days** (i.e., on or after today's date minus 5 days). Discard any emails older than that.

2. **Teams filter**: Discard any email that matches any of the following criteria:
   - The sender display name contains "Microsoft Teams"
   - The sender email address contains `teams.microsoft.com`
   - The subject contains any of: "missed call", "new voicemail", "mentioned you", "You have a new message", "activity in Teams"

If no emails remain after filtering, respond:

> "No unread emails in the last 5 days."

Stop here. Do not proceed to further steps.

---

## Step 2 — Read full email content

For every email returned in Step 1, call `get_email` using its message ID to retrieve the full body.

**Batch these calls in parallel to save time.** Make up to 10 `get_email` calls in a single message. If there are more than 10 emails, send the next batch of up to 10 in the following message. Continue until all emails have been read.

Do not proceed to Step 3 until all emails are fully loaded.

---

## Step 3 — Assess each email

For each email, assign exactly one of these labels based on its full content:

- **Reply needed** — The email asks a direct question, requests your input, approval, decision, feedback, or action. The sender is waiting for a response from you. A CC where you are clearly expected to act also counts.
- **FYI** — An informational update, status notification, meeting invite, or message where you are kept in the loop but no response is expected.
- **Low priority** — Automated alerts, marketing emails, newsletters, system notifications, or anything unlikely to require your attention.

When multiple "Reply needed" emails exist, sort them by urgency within that group:
- Explicit deadline mentioned → highest urgency
- Senior stakeholder or key contact as sender → higher urgency
- Open-ended question with no deadline → standard urgency

---

## Step 4 — Output the digest

Generate the digest using this exact structure:

```
## Inbox Digest — [TODAY'S DATE]
[N] unread · [N] reply needed · [N] FYI · [N] low priority

---

**1. [SENDER FULL NAME] — [SUBJECT LINE]**
`Reply needed` · [DAY, TIME]
[One sentence: what the email says and exactly what response or action is needed]

**2. [SENDER FULL NAME] — [SUBJECT LINE]**
`Reply needed` · [DAY, TIME]
[One sentence summary]

...

**[N]. [SENDER FULL NAME] — [SUBJECT LINE]**
`FYI` · [DAY, TIME]
[One sentence: what this is about]

...

**[N]. [SENDER FULL NAME] — [SUBJECT LINE]**
`Low priority` · [DAY, TIME]
[One sentence: what this is]
```

**Rules for summaries:**
- One sentence per email. Be specific and concrete — not "budget related" but "Approve the $50K tool license line item by Friday EOD".
- For "Reply needed" entries, always state what action is required, not just what the email is about.
- Do not truncate the list — include every unread email.

---

## Step 5 — Offer to draft responses

After outputting the digest, ask:

> "Would you like me to draft a response for any of these? If so, which number(s)?"

Wait for the user's answer. If they specify one or more numbers:

- Draft a reply for each selected email.
- Write from the perspective of an **SAP Ariba Buying & Invoicing consultant**. Use terminology and context appropriate to that role — for example, referencing procurement workflows, sourcing events, purchase requisitions, invoicing processes, supplier enablement, or system configuration where relevant.
- Tone: **conversational and professional**. Clear and direct — like a knowledgeable colleague, not a formal business letter. No corporate boilerplate, no stiff sign-offs. Natural and human.
- Present each draft clearly labelled, e.g.:

```
**Draft response — #[N]: [SUBJECT LINE]**

[Draft text here]
```

If the user says no or does not specify any numbers, end the session.

---

## Edge cases

- **Very long email threads**: Summarise based on the most recent message in the thread.
- **Emails in languages other than English**: Summarise in the user's language (match the language they used to trigger this skill).
- **Ambiguous sender names**: Use the email address if the display name is unclear.
