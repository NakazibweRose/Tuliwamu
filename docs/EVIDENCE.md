# Evidence base: Tuliwamu (Track 02, Juvenile Justice)

Every number we use in the pitch or submission must come from this file. **Do not add a figure without a source.**

**Verification status**
- ✅ **Checked:** quoted from the primary document's text. The PDFs are on the `feature/ai-legal-assistant` branch under `ai_service/legal_documents/`.
- 🔎 **Reported:** taken from published reports of the named source through web search. The original page couldn't be opened from our build environment, so **open the link and confirm the figure before the pitch**. Then change 🔎 to ✅.

---

## 1. The problem: referrals between agencies are slow, undocumented and unsafe

| # | Evidence | Source | Status |
|---|---|---|---|
| P1 | The Ministry lists the dilemmas caseworkers face: *"slow or non-responsiveness by government agencies to the cases referred; poor documentation and storage of information on cases handled by actors along the referral pathway; lack of resources…"* | MGLSD, *A Handbook for Case Management in Child Protection* (May 2016), Ch. 3 (principles and ethics) | ✅ |
| P2 | A missing standard approach causes *"limited understanding of the roles of various actors in the case management process"*, *"inadequate understanding of the pathways for managing various child protection cases"* and *"underdeveloped monitoring and evaluation practices"*. | MGLSD Handbook (2016), §1.3.4 | ✅ |
| P3 | The handbook calls for inter-agency **information-sharing protocols** that *"should ensure the confidentiality of the child client at all times"*, and recommends electronic case management databases where case volumes are high. | MGLSD Handbook (2016), §5.1.3 (databases) and §5.1.5 (information-sharing protocols) | ✅ |
| P4 | *"One of the biggest challenges for child-friendly justice in Uganda at present is the acute lack of Probation Officers. This shortage may explain many of the ills in the child justice system such as detention of children with adults, children being remanded for long periods instead of being diverted…"* The handbook also tells PSWOs to *"work hand in hand with the Police, particularly CFPU, to share information"*. | ODPP, *Prosecuting Child-Related Cases in Uganda: A Handbook for the DPP* | ✅ |
| P5 | Sector business processes are *"slow, expensive and complex… largely manual"*, which leads to *"high lead times, increased cost of access… and slow decision making"*. The sector's M&E system *"is manual and must be automated"*. | JLOS Fourth Strategic Development Plan (SDP IV) 2017–2020, para 41 and §M&E | ✅ |

## 2. Scale of the need

| # | Evidence | Source | Status |
|---|---|---|---|
| S1 | **3 in 4** young adults in Uganda experienced some form of violence in childhood. About **1 in 3 girls and 1 in 6 boys** experienced sexual violence in childhood. | Uganda Violence Against Children Survey (MGLSD with UNICEF/CDC/Together for Girls), launched Aug 2018. [UNICEF press release](https://www.unicef.org/uganda/press-releases/3-4-young-adults-uganda-experienced-some-form-violence-during-their-childhood) | 🔎 |
| S2 | Child-related offences rose **27%, from 8,646 cases (2009) to 10,974 (2013)**. | JLOS SDP IV, situation analysis | ✅ |
| S3 | **12,771** defilement cases were reported to police in 2023 (12,580 in 2022). | Uganda Police Annual Crime Report 2023, as reported by [Daily Monitor](https://www.monitor.co.ug/uganda/news/national/over-13-000-children-defiled-300-infected-with-hiv-in-2023-report-4535062) | 🔎 |
| S4 | Cases with children or juveniles as direct victims: **10,741 (2023)** and **9,408 (2024)**. Child-related offences were 4.3% of all reported crime in 2024. | Uganda Police Annual Crime Report 2024, as reported by [Daily Monitor](https://www.monitor.co.ug/uganda/news/national/minister-tasks-law-enforcers-on-sexual-violence-as-defilement-cases-soar-4817678) | 🔎 |
| S5 | The national child helpline Sauti 116 has received **~1.4 million calls** and closed **14,378 cases** since Nov 2021. **Neglect is the most reported abuse (46.5%)**. It handles about 1,500 calls a day. | [UNICEF Uganda, Sauti 116 story](https://www.unicef.org/uganda/stories/sauti-116-bolsters-government-response-violence-and-abuse-homes-and-communities-uganda) | 🔎 |

## 3. Children in conflict with the law

| # | Evidence | Source | Status |
|---|---|---|---|
| J1 | Juvenile **diversion reached 84.1%**. But children on remand were **2.07 per 100,000** child population against a target of **1 per 100,000**. | JLOS SDP IV, para 38 | ✅ |
| J2 | Remand homes: recommended capacity **780 children**, accommodating **1,233**. The Deputy Chief Justice called for more probation officers and State Attorneys and for transport. | [Judiciary of Uganda news](https://judiciary.go.ug/data/news/2058/Deputy+Chief+Justice+Opens+Juvenile+Justice+Roundtable,+Directs+Monthly+Visits+to+Remand+Homes.html) (2026) | 🔎 |
| J3 | Remand-home congestion reached **645% by December 2025**, the highest in five years. | Office of the Prime Minister annual performance report, via [Daily Monitor](https://www.monitor.co.ug/uganda/news/national/govt-links-rising-child-crime-to-poor-parenting-5433242) | 🔎 *(sources disagree on headcounts; quote J2 or J3, not both)* |

## 4. Local context: why USSD + SMS

| # | Evidence | Source | Status |
|---|---|---|---|
| C1 | **Feature phones are 56%** of devices in use vs **smartphones 39%** (26.7M feature phones vs 18.3M smartphones). | UCC *Annual Communications Sector Report 2024* ([PDF](https://www.ucc.co.ug/wp-content/uploads/2025/12/UCC-Annual-Communications-Sector-Report-2024.pdf)) | 🔎 |
| C2 | **43%** of people aged 10+ own a mobile phone: 46% urban, 41% rural, 20% in Karamoja. | National Population and Housing Census 2024 (UBOS), via [AllAfrica](https://allafrica.com/stories/202410070497.html) | 🔎 |
| C3 | Mobile internet penetration is about **28%**. **65%** of people have a feature phone or a 3G smartphone. | GSMA (2024/25), as reported in search results | 🔎 *(find the GSMA report title before citing)* |

**What this means for us:** a smartphone app would miss most reporters, especially in rural areas. USSD works on every phone with no data bundle, and SMS reaches officers in the field.

## 5. Legal basis (what our workflows respect)

| # | Provision | Source | Status |
|---|---|---|---|
| L1 | **s.37**: Any member of the community with evidence that a child's rights are being infringed *"shall report the matter"* to the local government council. → This is why we have the anonymous public reporting channel. | Children Act, **Cap 62** (Revised Edition 2023, as at 16 Aug 2024) | ✅ |
| L2 | **s.66**: A PSWO who is informed that a child *"is suffering or is likely to suffer significant harm"* shall make inquiries. → This is the triage of reports into cases. | Children Act Cap 62 | ✅ |
| L3 | **s.133**: The age of criminal responsibility is **12**. → Our age bands split at 12. | Children Act Cap 62 | ✅ |
| L4 | **s.134**: Police must inform the parent/guardian and the LC secretary for children's affairs *"as soon as possible after arrest"*, and a PSWO when the parent can't be reached (s.134(5)). There is a **24-hour maximum** in police custody (s.134(7)), and no detention with adults (s.134(8)). → Time-critical alerts between police and probation. | Children Act Cap 62 | ✅ |
| L5 | **s.136(5)**: Remand must not exceed **3 months** (capital offences) or **45 days** (other offences). → Deadlines that follow-ups should track. | Children Act Cap 62 | ✅ |
| L6 | **s.148**: *"The child's right to privacy shall be respected…"*. Publishing the child's name, address, school or anything *"likely to lead to the identification of the child"* is an offence. → Why SMS and USSD never carry names, why receivers see minimised records, and why statistics suppress small counts. | Children Act Cap 62 | ✅ |
| L7 | **Data Protection and Privacy Act 2019, s.8**: Personal data about a child may be collected or processed only with prior consent of the parent/guardian, **unless** it is necessary to comply with the law or is for research/statistical purposes. → Our lawful basis is legal duty (Children Act ss.37, 66, 134). The statistics are anonymised aggregates. | DPPA 2019 and the Data Protection and Privacy Regulations 2021 ([ULII](https://ulii.org/en/akn/ug/act/2019/9/eng@2019-05-03)) | 🔎 *(read s.8 wording on ULII before quoting)* |
| L8 | A data controller must register with the **Personal Data Protection Office** (NITA-U) before processing. → Required step before any pilot. | DPPA 2019 & Regulations 2021 | 🔎 |

> **Section numbers:** the Children Act was renumbered in the 2023 Revised Edition (Cap 62). Older documents cite *Cap 59*, where criminal responsibility is s.88/89. Say "Children Act, Cap 62" in the pitch.

## 6. Costs (viability)

| # | Item | Source | Status |
|---|---|---|---|
| V1 | USSD (Africa's Talking, Uganda): sessions charged about **UGX 35 per 20 seconds** plus an infrastructure fee of **UGX 10 per 180 s**. A **UGX 250,000 deposit** is required. Check whether a toll-free/zero-rated code is available so reporters pay nothing. | [africastalking.com/ussd](https://africastalking.com/ussd) | 🔎 *(confirm in the AT dashboard)* |
| V2 | SMS (Africa's Talking, Uganda): roughly **UGX 19–35 per SMS** depending on network and volume. | Third-party summaries; **no official figure confirmed** | 🔎 *(get the rate card from the AT dashboard or sales; until then say "tens of shillings per SMS")* |

## 7. What we will NOT claim
- No real-world impact numbers. Our KPIs come from **fictional demo data**, so present them as "what the dashboard will measure", not as results.
- Nothing about Sauti 116's internal systems. We **complement** the helpline: Sauti takes calls, and Tuliwamu coordinates the referral afterwards across institutions.
