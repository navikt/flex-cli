const blacklist: string[] = [
    'vault-iac',
    'nav-dekoratoren-server-component',
    'next-logger',
    'next-api-proxy',
    'next-auth-wonderwall',
    'aad-iac',
    'helse-docs',
]

export function blacklisted<Repo extends { name: string }>(repo: Repo): boolean {
    return !blacklist.includes(repo.name)
}
