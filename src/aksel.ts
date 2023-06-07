import { execSync } from 'node:child_process'
import * as path from 'path'
import * as fs from 'fs' // import path module to resolve file path

console.log('\n\nBumper aksel dependencies ')

function exec(repo: string, kommando: string) {
    return execSync(kommando, {
        cwd: `../${repo}`,
    })
}

function resetTilMaster(repo: string) {
    exec(repo, 'git add .')
    exec(repo, 'git stash')
    exec(repo, 'git checkout master')
    exec(repo, 'git pull')
}

function oppgraderDependencies(repo: string) {
    exec(repo, "npx npm-check-updates '@navikt/aksel*' '@navikt/ds*' -u")
    exec(repo, 'npm install')
}

function opprettNyBranchOgPr(repo: string) {
    const packageJsonPath = path.resolve(`../${repo}/package.json`)
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8')
    const packageJson = JSON.parse(packageJsonData)
    const dsReactVersion = packageJson.dependencies[
        '@navikt/ds-react'
    ].replaceAll('^', '')

    const branchNavn = `demo-bump-aksel-deps-${Date.now()}-${dsReactVersion.replaceAll(
        '.',
        '-'
    )}`
    exec(repo, `git checkout -b ${branchNavn}`)
    exec(repo, 'git add .')
    exec(
        repo,
        `git commit -m "Bumpet aksel dependencies til ${dsReactVersion}"`
    )
    exec(repo, `git push origin ${branchNavn}`)
    exec(
        repo,
        `gh pr create --title "Bumpet aksel dependencies til ${dsReactVersion}" --body "Automatisk lagd i GitHub actions" --base master --label "automerge,designsystemet"`
    )
    console.log(`Opprettet PR i ${repo}`)
}

function oppgraderAkselDependencies(repo: string) {
    resetTilMaster(repo)
    oppgraderDependencies(repo)
    const diff = exec(repo, 'git diff master')
    if (diff) {
        opprettNyBranchOgPr(repo)
    }
}

for (const r of [
    'sykepengesoknad-frontend',
    'ditt-sykefravaer',
    'spinnsyn-frontend',
]) {
    oppgraderAkselDependencies(r)
}

console.log('\n\nAksel dependencies bumpet')
