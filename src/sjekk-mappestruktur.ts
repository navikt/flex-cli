import * as fs from 'fs'
import * as path from 'path'

import { config } from './config'

console.log('\n\nSjekker mappen over for alle repoer ')

const files = await fs.promises.readdir('./..')
const directories = files.filter((f) => fs.statSync(path.join('./..', f)).isDirectory())
const kjenteRepoer = config.repos.map((r) => r.name)

const manglerFraConfig = directories.filter((x) => !kjenteRepoer.includes(x))

if (manglerFraConfig.length > 0) {
    console.log('Følgende repoer mangler i config.yml:')
    console.log(manglerFraConfig)
} else {
    console.log('Ingen repoer mangler i config.yml')
}

const manglerFraDisk = kjenteRepoer.filter((x) => !directories.includes(x))

if (manglerFraDisk.length > 0) {
    console.log('Følgende repoer mangler fra disk')
    console.log(manglerFraDisk)
} else {
    console.log('Ingen repoer mangler fra disk')
}
