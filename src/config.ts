import * as fs from 'fs'
import * as YAML from 'yaml'
import { Config, RepoConfig } from './types'

const file = fs.readFileSync('./config.yml', 'utf8')
export const config = multirepoTilConfig(YAML.parse(file) as BaseConfig)

function multirepoTilConfig(baseConfig: BaseConfig): Config {
    const repos: RepoConfig[] = []

    baseConfig.repos.forEach((a) => {
        a.reponame.forEach((n) => {
            repos.push({ name: n, checks: a.checks, patch: true })
        })
    })
    return {
        owner: baseConfig.owner,
        repos,
    }
}

interface BaseConfig {
    owner: string
    repos: MultiRepoConfig[]
}

interface MultiRepoConfig {
    reponame: string[]
    checks: string[]
}
