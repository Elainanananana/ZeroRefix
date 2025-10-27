// server/api/jobs.get.ts
import { readFile, access } from 'node:fs/promises'
import { constants as FS } from 'node:fs'
import { join } from 'node:path'
import { parseStringPromise } from 'xml2js'
import iconv from 'iconv-lite'
import type { H3Event } from 'h3'

type RawRow = Record<string, any>
type JobItem = {
  occuDesc: string; unit: string; subj?: string; workAddr?: string; workType?: string;
  shift?: string; salary?: string; count?: string | number; educationDesc?: string;
  trandate?: string; urlQuery?: string; jobdetail?: string; // ⬅️ 新增
}

async function findJobsXml(): Promise<string> {
  const root = process.cwd()
  const candidates = [
    join(root, 'server', 'data', 'jobs.xml'),
    join(root, 'public', 'jobs.xml'),
    join(root, 'data', 'jobs.xml')
  ]
  for (const p of candidates) { try { await access(p, FS.R_OK); return p } catch {} }
  throw new Error('jobs.xml not found in: ' + candidates.join(' | '))
}

function asText(v: any): string {
  if (v == null) return ''
  if (typeof v === 'object') {
    if (typeof v._ === 'string') return v._.trim()
    if (typeof v.value === 'string') return v.value.trim()
    if (typeof v.text === 'string') return v.text.trim()
    return ''
  }
  return String(v).trim()
}
const pick = (row: RawRow, n: number) => asText(row?.[`Col${n}`])

function decodeXml(buf: Buffer): string {
  const head = buf.subarray(0, 4096).toString('latin1')
  let enc = (head.match(/encoding\s*=\s*["']([^"']+)["']/i)?.[1] || '').toLowerCase()
  if (!enc && buf.length >= 2) {
    const b0 = buf[0], b1 = buf[1], b2 = buf[2]
    if (b0 === 0xFE && b1 === 0xFF) enc = 'utf-16be'
    else if (b0 === 0xFF && b1 === 0xFE) enc = 'utf-16le'
    else if (b0 === 0xEF && b1 === 0xBB && b2 === 0xBF) enc = 'utf-8'
  }
  if (enc === 'cp950' || enc === 'big-5' || enc === 'big5-hkscs') enc = 'big5'
  if (!enc) enc = 'utf-8'
  try {
    if (enc.startsWith('utf-16')) return iconv.decode(buf, enc.includes('be') ? 'utf16-be' : 'utf16-le')
    return iconv.decode(buf, enc as any)
  } catch { return buf.toString('utf8') }
}

function formatSalary(kind: string, low: string, up: string) {
  const k = (kind || '').trim(), l = (low || '').trim(), u = (up || '').trim()
  if (!k && !l && !u) return ''
  if (l && (!u || u === '-' || u === '0')) return k ? `${k} ${l}${/薪$/.test(k) ? ' 元' : ''}` : l
  if (l && u && u !== '-' && u !== '0') return k ? `${k} ${l}–${u}${/薪$/.test(k) ? ' 元' : ''}` : `${l}–${u}`
  return k || l || u
}

export default defineEventHandler(async (event: H3Event) => {
  const debug = getQuery(event)?.debug != null
  try {
    const file = await findJobsXml()
    const buf = await readFile(file)
    const xml = decodeXml(buf)

    const parsed = await parseStringPromise(xml, { explicitArray: false, trim: true, attrkey: '$', charkey: '_' })
    const raw = (parsed as any)?.table?.row ?? []
    const rows: RawRow[] = Array.isArray(raw) ? raw : (raw ? [raw] : [])

    const items: JobItem[] = rows.map(r => ({
      occuDesc: pick(r, 1),
      workType: pick(r, 2),
      count:    pick(r, 7),
      // Col9 = JOB_DETAIL
      jobdetail: pick(r, 9),                 // ⬅️ 新增：把工作說明/完整內容放到 jobdetail
      subj:     pick(r, 10),
      shift:    pick(r, 12),
      salary:   formatSalary(pick(r,13), pick(r,14), pick(r,15)),
      educationDesc: pick(r,16),
      urlQuery: pick(r,17),
      unit:     pick(r,18),
      trandate: pick(r,19),
      workAddr: '' // 目前不用地址；若日後要用，再映射對應 ColN
    }))

    if (debug) return { file, count: items.length, firstItem: items[0] ?? null }
    return { items }
  } catch (err: any) {
    if (debug) return { items: [], error: 'PARSE_FAILED', message: String(err?.message || err) }
    return { items: [], error: 'PARSE_FAILED' }
  }
})
