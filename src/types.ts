export interface ApprovedPr {
    pull_number: number
    repo: string
    node_id: string
    auto_merge: object | null
}

export interface RepoConfig {
    name: string
    checks: string[]
}

export interface Config {
    owner: string
    repos: RepoConfig[]
}
