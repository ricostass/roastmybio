# roastmybio

## Roaster profiles

System prompts for each roaster persona live in [`prompts/roasters/`](prompts/roasters/):

| persona id | name | file |
| --- | --- | --- |
| `prosecutor` | The Prosecutor (No Chill) | [`prosecutor_system.md`](prompts/roasters/prosecutor_system.md) |
| `genz` | The Comment Section (Gen Z) | [`genz_system.md`](prompts/roasters/genz_system.md) |

Each prompt takes a JSON profile (`language`, `age`, `looking_for`, `photos`, `bio`, `prompts`) as the user message and returns a single JSON object with `persona`, `script`, `jokes`, `cards` and `word_count`.
