# UX notes

Real-user passes: I click through the app at phone width (360px) like a confused first-time
shopkeeper and write down what felt broken or unclear. The top 3 get fixed before a phase closes.

## Phase 0 — 2026-11-27

Tested at 360 × 740 in English and Urdu: sign up, log in (right and wrong password), home grid,
Hello → ping → Counter, an unknown app URL, and log out.

| #   | What felt wrong                                                                                                                                                              | Severity | Status                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| 1   | After a wrong password, the red "Wrong mobile number or password" box **stays** while you retype, even next to a new field error. It looks like the new input is also wrong. | High     | **Fixed**: the message clears as soon as you change the form.            |
| 2   | No way to see the password. On a small phone keyboard it is easy to mistype, and you cannot tell why login fails.                                                            | High     | **Fixed**: "Show password" checkbox (48px touch target, English + Urdu). |
| 3   | Log out is one tap on a corner icon, next to the language button. One mistaken tap logs a busy shopkeeper out.                                                               | High     | **Fixed**: asks "Log out of Dukaan OS?" first.                           |
| 4   | A first-time visitor lands on **Log in**. "Create an account" is a link under the form, easy to miss.                                                                        | Medium   | Open: revisit with the landing page (Phase 7).                           |
| 5   | No "forgot password". A shopkeeper who forgets it is stuck.                                                                                                                  | Medium   | Open: needs SMS/OTP to prove the phone is theirs (ADR-0004 known limit). |
| 6   | If two tabs refresh the session at the same moment, refresh-token rotation logs one of them out.                                                                             | Low      | Open: add a short grace window if it shows up in real use.               |
| 7   | The brand "Dukaan OS" stays in English in Urdu mode.                                                                                                                         | Low      | Open: brand decision, not a bug.                                         |

What worked well: the field errors are clear and sit under the field; Urdu flips the whole layout
to RTL, including the back arrow; nothing scrolls sideways at 360px; the unknown-app page offers a
way home.
