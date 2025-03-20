import { readFileSync, writeFileSync } from 'fs'

import * as XLSX from 'xlsx'
import { v4 } from 'uuid'
import { addDays, format, isSunday } from 'date-fns'

const buf = readFileSync('fa-prod-19-3.xlsx')

const workbook = XLSX.read(buf, { type: 'buffer' })
const worksheet = workbook.Sheets['TOM UKE 11']

// Konverter regnearket til en array av arrays (hver rad blir en array)
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

const result = [] as any[]

function excelDateToDate(excelDate: number) {
    // Excel bruker 1899-12-30 som startdato, og 1 dag = 86400 sekunder
    const date = new Date((excelDate - 25569) * 86400 * 1000)
    format(date, 'yyyy-MM-dd') // Test format for at den skal kaste feil
    return date
}

const radMedFeil = [] as string[]
const fnrs = [] as string[]
const seenFnr = [] as string[]
const duplikatFnr = [] as string[]

// Iterer over radene og print kolonnene separert med space
rows.forEach((row, i) => {
    if (row.length === 0 || i == 0) return

    function fnr() {
        const row0string = row[0].toString()
        if (row0string.length == 10) {
            return '0' + row0string
        }
        if (row0string.length == 11) {
            return row0string
        }

        console.log('FNR uleselig, ' + i + ' ' + row0string)
        throw Error('FNR uleselig, ' + row0string)
    }

    let personident = ''
    try {
        personident = fnr()
    } catch (e) {
        radMedFeil.push(row[0] + ' Fødselsnummer uleselig i rad: ' + (i + 1))
        return
    }
    fnrs.push(personident)

    if (seenFnr.includes(personident)) {
        duplikatFnr.push(personident)
    } else {
        seenFnr.push(personident)
    }

    let fom: Date | undefined = undefined
    let tom: Date | undefined = undefined
    let utbetalt: Date | undefined = undefined

    try {
        fom = excelDateToDate(row[1])
    } catch (e) {
        radMedFeil.push(personident + ' FOM uleselig i rad: ' + (i + 1))
        return
    }

    try {
        tom = excelDateToDate(row[2])
    } catch (e) {
        radMedFeil.push(personident + ' TOM uleselig i rad: ' + (i + 1))
        return
    }

    try {
        if (row[3]) {
            utbetalt = excelDateToDate(row[3])
        }
    } catch (e) {
        radMedFeil.push(personident + ' Utbetalt uleselig i rad: ' + (i + 1) + ' :' + row[3])
        return
    }

    if (row[2] == row[3]) {
        radMedFeil.push(personident + ' Lik utbetalt og tiltak tom i rad: ' + (i + 1))
        return
    }

    if (row[2] < row[3]) {
        radMedFeil.push(personident + ' Tom er etter utbetalt i rad: ' + (i + 1))
        return
    }

    if (row[2] < row[1]) {
        radMedFeil.push(personident + ' Tom er før fom i rad: ' + (i + 1))
        return
    }

    function skapNyVedtaksFom() {
        if (utbetalt) {
            return addDays(utbetalt, 1)
        }
        return fom!
    }

    const nyVedtaksFom = skapNyVedtaksFom()

    if (utbetalt) {
        if (!isSunday(utbetalt)) {
            radMedFeil.push(personident + ' Utbetalt er ikke søndag ' + (i + 1))
            return
        }
    }

    const uuid = v4()
    const key = v4()
    const obj = {
        key: key,
        friskTilArbeidVedtakStatus: {
            uuid: uuid,
            personident: personident,
            begrunnelse: 'Initiell import',
            fom: format(nyVedtaksFom, 'yyyy-MM-dd'),
            tom: format(tom, 'yyyy-MM-dd'),
            status: 'FATTET',
            statusAt: '2025-03-20T00:00:00.000000Z',
            statusBy: 'Initiell import',
        },
    }
    result.push(obj)
})

const resultUtenDuplikateFnr = result.filter((r) => !duplikatFnr.includes(r.friskTilArbeidVedtakStatus.personident))

// Skriv til fil
const json = JSON.stringify(resultUtenDuplikateFnr, null, 2)
const filename = 'build/result.json'
writeFileSync(filename, json)

const feilFilename = 'build/feil.txt'
writeFileSync(feilFilename, radMedFeil.join('\n'))

const fnrfil = 'build/fnr.txt'
writeFileSync(fnrfil, fnrs.join('\n'))

const duplikateFnrSomSet = new Set(duplikatFnr)

const duplikateFnrFil = 'build/dupFnr.txt'
writeFileSync(duplikateFnrFil, Array.from(duplikateFnrSomSet).join('\n'))
