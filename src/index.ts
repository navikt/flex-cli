import prompts from 'prompts'

await prompts([
    {
        type: 'confirm',
        name: 'svar',
        message: 'Vil du også se pullrequests som ikke er bygd grønt ✅?',
    },
])
console.log('heiff')
