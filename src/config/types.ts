export interface ApprovedPr {
    pull_number: number
    repo: string
    title: string
    checksOk: boolean
}

export interface RepoConfig {
    name: string
    checks?: string[]
    skip?: string[]
    patch: boolean
}

export interface Config {
    owner: string
    repos: RepoConfig[]
}
