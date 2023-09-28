const blacklist: string[] = [
    'vault-iac',
    'nav-dekoratoren-server-component',
    'next-logger',
    'next-api-proxy',
    'next-auth-wonderwall',
    'aad-iac',
    'omrade-helse-etterlevelse-topic',
]

export function blacklisted<Repo extends { name: string }>(repo: Repo): boolean {
    return !blacklist.includes(repo.name)
}
