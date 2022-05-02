# flex-github-tools
Forsøk på å automatisere verfikasjon av repo innstillinger og til å enable automerge og approve dependabot pullrequests.

## Utfordringer
I noen repoer blir automerge avskrudd når basebranch har endret seg. Dette er en utfordring når mange pull requests i et repo approves.

# Komme i gang
Legg et personal accesttoken i en .env fil. Accestokenet legges bak `GITHUB_PAT=` . Fila er gitignored 
Kjør `npm install` og deretter `npm start`

Flere repoer legges til i config.yml

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan stilles til flex@nav.no

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #flex.
