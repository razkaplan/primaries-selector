# Candidate Profile Schema

Write one JSON file per candidate at `data/profiles/<id>.json` (UTF-8, Hebrew content) with EXACTLY this structure:

```json
{
  "id": "29717",
  "name": "עלי סלאלחה",
  "axes": {
    "peace_diplomacy": 0,
    "religion_state": 0,
    "socioeconomic": 0,
    "democracy_law": 0,
    "arab_jewish": 0,
    "climate_env": 0,
    "periphery": 0,
    "security": 0,
    "gender_lgbtq": 0,
    "education_health": 0
  },
  "attrs": {
    "gender": "m | f",
    "sector": "jewish | muslim | christian | druze | ethiopian_israeli | other",
    "origin": "meretz | labor | new",
    "region": "north | south | center | jerusalem | shfela | sharon",
    "experience": "mk_current | mk_former | local_gov | activist | professional",
    "age": 45
  },
  "summary_he": "2-3 sentences in Hebrew summarizing who they are and their agenda",
  "highlights_he": ["3-6 short Hebrew bullets: concrete achievements/roles"],
  "sources": ["urls actually used"]
}
```

## Axis scoring (0-5)
Score = how CENTRAL the issue is to this candidate's declared agenda and track record.
- 0 = not part of their agenda at all
- 1-2 = mentioned but secondary
- 3 = one of several stated priorities
- 4 = major declared priority with track record
- 5 = their core life mission / primary identity

Axes:
- peace_diplomacy: peace process, two-state, regional agreements, ending the war/occupation
- religion_state: separation of religion and state, civil marriage, secular rights, anti-coercion
- socioeconomic: welfare, workers, cost of living, housing, unions, periphery economics
- democracy_law: rule of law, anti-corruption, transparency, fighting the judicial overhaul
- arab_jewish: Jewish-Arab partnership, minority rights, equality for Arab society
- climate_env: climate, environment, energy, planning
- periphery: geographic/social periphery (Negev, Galilee, development towns)
- security: security credentials/agenda (military background used as platform)
- gender_lgbtq: women's rights, LGBTQ rights, fighting violence against women
- education_health: education and/or health systems as an agenda

Base scores on: the official bio, their website content, their CV, and search findings. If evidence is thin, score conservatively from the bio. `age` = best estimate integer or null.
