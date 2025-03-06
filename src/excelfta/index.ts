import { readFileSync, writeFileSync } from 'fs'

import * as XLSX from 'xlsx'
import { v4 } from 'uuid'
import { format } from 'date-fns'

const buf = readFileSync('ftatest.xlsx')

const workbook = XLSX.read(buf, { type: 'buffer' })
const worksheet = workbook.Sheets['Sheet 1']

// Konverter regnearket til en array av arrays (hver rad blir en array)
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

const result = [] as any[]

function excelDateToFormattedDate(excelDate: number) {
    // Excel bruker 1899-12-30 som startdato, og 1 dag = 86400 sekunder
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000)
    return format(jsDate, 'yyyy-MM-dd')
}

// Iterer over radene og print kolonnene separert med space
rows.forEach((row, i) => {
    if (row.length === 0 || i == 0) return
    const uuid = v4()
    const key = v4()
    const obj = {
        key: key,
        friskTilArbeidVedtakStatus: {
            uuid: uuid,
            personident: row[0],
            begrunnelse: 'Initiell import',
            fom: excelDateToFormattedDate(row[1]),
            tom: excelDateToFormattedDate(row[2]),
            status: 'FATTET',
            statusAt: '2025-03-016T00:00:00.000000Z',
            statusBy: 'Initiell import',
        },
    }
    result.push(obj)
})

// Pretty print result objekt json til en ny fil i /build mappa

// Skriv til fil
const json = JSON.stringify(result, null, 2)
const filename = 'build/result.json'
writeFileSync(filename, json)
