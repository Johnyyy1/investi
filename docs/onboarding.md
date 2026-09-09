# Onboarding and learning preferences

Current onboarding is a single focused decision: experience level, then **Start learning**. Beginner is selected by default, so a new account can reach the first meaningful lesson interaction with one intentional click after account creation. The server validates the selected enum and browser-provided IANA timezone, creates the completed learning profile, and returns the central next-lesson route.

New quick-start profiles use a ten-minute daily preference and empty goals/interests; the application does not invent answers. Settings retains the full legacy preference editor for experience, optional goals/interests, and 5/10/15/20-minute choices. Those minutes map to one or two completed-lesson targets rather than fictional time spent.

The authenticated layout sends incomplete profiles to onboarding and completed profiles directly into Learn. Existing completed learners never replay onboarding. Conditional upsert semantics prevent stale onboarding requests from replacing a completed profile, while Settings preserves the original onboarding completion timestamp.

Server actions derive ownership from the current session and validate again in the server-only repository. See [product-reset.md](product-reset.md) for next-lesson priority, daily-goal, timezone, compatibility, and validation details.
