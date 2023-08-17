# flex-cli
Forsøk på å automatisere verfikasjon av repo innstillinger og til å approve og merge dependabot pullrequests.


# Komme i gang
Legg et personal accesttoken i en .env fil. Accestokenet legges bak `GITHUB_PAT=`. Fila er gitignored
```
GITHUB_PAT=ghp_123abc....
``` 
Kjør `npm install` og deretter `npm run dev` for utvikling

### Secrets
For å opprette ny eller oppdatere ekisterende secrets i github så må hemmligheten legges til i .env fila
```
GITHUB_PAT=ghp_123abc....
TEST_SECRET=hemmelig
```
Dersom det er en ny secret må den også inn på choices i secrets.ts
Kjør `npm run secret`


### Nytt repo
For å opprette et nytt repo så må det legges til i config.yml. Kjør deretter `npm run patch` som vil opprette repoet. Hvis secrets også trengs bør man kjøre `npm run secret` som beskrevet over.

For å få meldinger om commit til master i #flex-github-feed må disse kommandoene kjøres i slack kanalen:

```
/github subscribe navikt/repo commits
/github unsubscribe navikt/repo issues pulls releases deployments
```

### 
Koden kan også kompilers med `npm run build` og startes med `npm start`
Flere repoer legges til i config.yml

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan stilles til flex@nav.no

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #flex.
