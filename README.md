# flex-cli

Flex cli har en rekke kommandoer som kan kjøres for å opprette nye repoer, secrets og andre ting som er nyttig for å komme i gang som utvikler i team flex.

For å se alle kommandoer og en beskrivelse av hva de gjør, kjør kommandoen `npm start`.
Fila config.yml inneholder en liste over alle repoer som kan er konfigurert med flex cli. Ved oppdatering av denne fila må man kjøre `npm start patch-alle` for å gjøre oppdateringene i github. Dette skriptet kjøres ikke i GHA, så endringer må pushes opp fra din maskin.
Her konfigurerers hvilke checks som må gå grønt i GitHub actions før en pullrequest kan merges. Ved endringer i navn og antall sjekker så kan man måtte lage i repoet man endrer på for å få kjørt Github Actions med den riktige konfigurasjonen,

Fila distroless.yml inneholder konfigurasjon for hvilke apper som bruker ulike distroless images. Dette brukes til kommandoen `npm start distroless-bump` som oppdaterer apper med nyeste distroless.

# Komme i gang

Legg et personal GITHUB accesttoken i en .env fil. Accestokenet legges bak `GITHUB_PAT=`. Fila er gitignored

```
GITHUB_PAT=ghp_123abc....
```

### Oppsett

-   Du må ha [Node.js](https://nodejs.org/en/) installert.
-   Du må ha [bun.sh](https://bun.sh) installert, dette kan installeres med curl (`curl -fsSL https://bun.sh/install | bash`)

### Hvordan kjøre flex cli

Kjør `bun install` for å installere avhengigheter
Kjør `npm start` for å kjøre flex cli.

### Secrets

For å opprette ny eller oppdatere ekisterende secrets i github så må hemmligheten legges til i .env fila

```
GITHUB_PAT=ghp_123abc....
TEST_SECRET=hemmelig
```

Dersom det er en ny secret må den også inn på choices i secrets.ts
Kjør `npm start secrets`

### Nytt repo

For å opprette et nytt repo så må det legges til i config.yml. Kjør deretter `npm start patch-repoer` som vil opprette repoet. Hvis secrets også trengs bør man kjøre `npm run secret` som beskrevet over.

For å få meldinger om commit til master i #flex-github-feed må disse kommandoene kjøres i slack kanalen:

```
/github subscribe navikt/repo commits
/github unsubscribe navikt/repo issues pulls releases deployments
```

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan stilles til flex@nav.no

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #flex.
